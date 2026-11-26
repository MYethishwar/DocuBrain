"""Business logic: answer a question from the knowledge base.

Two steps (works with managed knowledge bases):
  1. Retrieve the most relevant chunks from the knowledge base.
  2. Ask the model via Converse with the guardrail attached. The chunks are marked as the
     grounding source and the question as the query, so the guardrail's contextual
     grounding check can run; the question is also checked by every other guardrail policy.
"""
from src.clients import knowledge_base_client, model_client
from src.config.settings import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

MAX_CHUNKS = 5
SYSTEM_PROMPT = (
    "You answer questions using only the knowledge base context provided in the message. "
    "If the answer is not in the context, say that the knowledge base does not contain it. "
    "Keep answers short and clear."
)
NO_CONTEXT = "No relevant information was found in the knowledge base."


def ask(question: str) -> dict:
    logger.info("Answering question (%d chars): %.80s", len(question), question)
    settings = get_settings()

    chunks = knowledge_base_client.retrieve(question, settings.kb_id)[:MAX_CHUNKS]
    context = "\n\n".join(c["content"]["text"] for c in chunks if c.get("content", {}).get("text"))
    sources = _source_uris(chunks)
    if not context:
        logger.warning("No chunks retrieved for the question; the model will see an empty context")

    response = model_client.converse(
        model_arn=settings.model_arn,
        system_prompt=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": [
                {"guardContent": {"text": {"text": context or NO_CONTEXT, "qualifiers": ["grounding_source"]}}},
                {"guardContent": {"text": {"text": question, "qualifiers": ["query", "guard_content"]}}},
            ],
        }],
        guardrail_id=settings.guardrail_id,
        guardrail_version=settings.guardrail_version,
    )

    answer = response["output"]["message"]["content"][0]["text"]
    if response.get("stopReason") == "guardrail_intervened":
        logger.warning("Guardrail intervened; policies triggered: %s", _triggered_policies(response))
        return {"answer": answer, "guardrail_action": "INTERVENED", "sources": []}

    logger.info("Answer ready, based on %d chunk(s) from %d source document(s)", len(chunks), len(sources))
    return {"answer": answer, "guardrail_action": "NONE", "sources": sources}


def _source_uris(chunks: list[dict]) -> list[str]:
    """Unique document locations of the retrieved chunks."""
    uris = set()
    for chunk in chunks:
        location = chunk.get("location", {})
        for value in location.values():
            if isinstance(value, dict):
                uri = value.get("uri") or value.get("url")
                if uri:
                    uris.add(uri)
    return sorted(uris)


def _triggered_policies(response: dict) -> list[str]:
    """Names of guardrail policies that blocked or masked something (from the trace)."""
    guardrail_trace = response.get("trace", {}).get("guardrail", {})
    assessments = list(guardrail_trace.get("inputAssessment", {}).values())
    for output_list in guardrail_trace.get("outputAssessments", {}).values():
        assessments.extend(output_list)

    triggered = set()
    for assessment in assessments:
        for policy_name, details in assessment.items():
            if policy_name.endswith("Policy") and _has_action(details):
                triggered.add(policy_name)
    return sorted(triggered) or ["unknown (see trace)"]


def _has_action(node) -> bool:
    if isinstance(node, dict):
        if node.get("action") in ("BLOCKED", "ANONYMIZED"):
            return True
        return any(_has_action(value) for value in node.values())
    if isinstance(node, list):
        return any(_has_action(item) for item in node)
    return False
