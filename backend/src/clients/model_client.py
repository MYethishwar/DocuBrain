"""Thin wrapper around the Bedrock Converse API (bedrock-runtime), with a guardrail attached."""
import time

import boto3
from botocore.exceptions import ClientError

from src.config.settings import AWS_REGION
from src.utils.logger import get_logger

logger = get_logger(__name__)
_runtime = boto3.client("bedrock-runtime", region_name=AWS_REGION)


def converse(
    model_arn: str,
    system_prompt: str,
    messages: list[dict],
    guardrail_id: str,
    guardrail_version: str,
) -> dict:
    """Send messages to the model; the guardrail checks the input and the output."""
    logger.info("Calling Converse (guardrail=%s v%s)", guardrail_id, guardrail_version)
    started = time.perf_counter()
    try:
        response = _runtime.converse(
            modelId=model_arn,
            system=[{"text": system_prompt}],
            messages=messages,
            inferenceConfig={"maxTokens": 512, "temperature": 0},
            guardrailConfig={
                "guardrailIdentifier": guardrail_id,
                "guardrailVersion": guardrail_version,
                "trace": "enabled",
            },
        )
    except ClientError as error:
        logger.error(
            "Converse failed after %d ms (model=%s): %s - %s",
            _elapsed_ms(started), model_arn,
            error.response["Error"]["Code"], error.response["Error"]["Message"],
        )
        raise

    logger.info(
        "Converse finished in %d ms (stopReason=%s)",
        _elapsed_ms(started), response.get("stopReason"),
    )
    return response


def _elapsed_ms(started: float) -> int:
    return int((time.perf_counter() - started) * 1000)
