"""Thin wrapper around the standalone Bedrock Guardrail API (ApplyGuardrail).

Used when the model is not a Bedrock model (for example Ollama): the guardrail checks the
question before the model runs and the answer after it, including contextual grounding.
"""
import time
from dataclasses import dataclass, field

import boto3
from botocore.exceptions import ClientError

from src.config.settings import AWS_REGION
from src.utils.logger import get_logger

logger = get_logger(__name__)
_runtime = boto3.client("bedrock-runtime", region_name=AWS_REGION)


@dataclass
class GuardrailResult:
    blocked: bool  # a policy BLOCKED the text
    masked: bool  # a policy only masked (ANONYMIZED) part of the text
    text: str  # guardrail output: the blocked message, the masked text, or "" if untouched
    policies: list[str] = field(default_factory=list)  # policies that acted, e.g. ["topicPolicy"]


def check_input(question: str, guardrail_id: str, guardrail_version: str) -> GuardrailResult:
    """Check the user's question against every guardrail policy."""
    return _apply("INPUT", [{"text": {"text": question}}], guardrail_id, guardrail_version)


def check_output(
    answer: str, grounding_source: str, question: str, guardrail_id: str, guardrail_version: str
) -> GuardrailResult:
    """Check the model's answer, including contextual grounding against the retrieved passages."""
    content = [
        {"text": {"text": grounding_source, "qualifiers": ["grounding_source"]}},
        {"text": {"text": question, "qualifiers": ["query"]}},
        {"text": {"text": answer, "qualifiers": ["guard_content"]}},
    ]
    return _apply("OUTPUT", content, guardrail_id, guardrail_version)


def _apply(source: str, content: list[dict], guardrail_id: str, guardrail_version: str) -> GuardrailResult:
    logger.info("Calling ApplyGuardrail on %s (guardrail=%s v%s)", source, guardrail_id, guardrail_version)
    started = time.perf_counter()
    try:
        response = _runtime.apply_guardrail(
            guardrailIdentifier=guardrail_id,
            guardrailVersion=guardrail_version,
            source=source,
            content=content,
        )
    except ClientError as error:
        logger.error(
            "ApplyGuardrail on %s failed after %d ms: %s - %s",
            source, _elapsed_ms(started),
            error.response["Error"]["Code"], error.response["Error"]["Message"],
        )
        raise

    assessments = response.get("assessments", [])
    blocked_policies = policies_with_action(assessments, {"BLOCKED"})
    masked_policies = policies_with_action(assessments, {"ANONYMIZED"})
    text = " ".join(o.get("text", "") for o in response.get("outputs", [])).strip()

    result = GuardrailResult(
        blocked=bool(blocked_policies),
        masked=bool(masked_policies) and not blocked_policies,
        text=text,
        policies=sorted(blocked_policies | masked_policies),
    )
    logger.info(
        "ApplyGuardrail on %s finished in %d ms (action=%s, blocked=%s, masked=%s, policies=%s)",
        source, _elapsed_ms(started), response.get("action"), result.blocked, result.masked, result.policies,
    )
    return result


def policies_with_action(assessments: list[dict], actions: set[str]) -> set[str]:
    found = set()
    for assessment in assessments:
        for policy_name, details in assessment.items():
            if policy_name.endswith("Policy") and _has_action(details, actions):
                found.add(policy_name)
    return found


def _has_action(node, actions: set[str]) -> bool:
    if isinstance(node, dict):
        if node.get("action") in actions:
            return True
        return any(_has_action(value, actions) for value in node.values())
    if isinstance(node, list):
        return any(_has_action(item, actions) for item in node)
    return False


def _elapsed_ms(started: float) -> int:
    return int((time.perf_counter() - started) * 1000)
