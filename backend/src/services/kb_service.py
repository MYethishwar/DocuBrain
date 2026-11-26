"""Business logic: answer a question from the knowledge base, with the guardrail applied.

MODEL_PROVIDER = "bedrock"
  1. Retrieve the most relevant chunks from the knowledge base.
  2. Converse with the Bedrock model, guardrail attached to the call. The chunks are marked as the
     grounding source and the question as the query, so contextual grounding runs too.

MODEL_PROVIDER = "ollama"
  1. ApplyGuardrail on the question (INPUT). Stop if blocked.
  2. Retrieve the most relevant chunks from the knowledge base.
  3. Ollama (local open-source model) writes the answer from the chunks.
  4. ApplyGuardrail on the answer (OUTPUT), with the chunks as grounding source. Stop if blocked.
"""
from src.clients import guardrail_client, knowledge_base_client, model_client, ollama_client
from src.config.settings import MODEL_PROVIDER, OLLAMA_MAX_CHUNKS, OLLAMA_MODEL, get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

MAX_CHUNKS = 5  # Bedrock models; Ollama uses OLLAMA_MAX_CHUNKS (default 3) to stay fast on CPU
SYSTEM_PROMPT = (
    "You answer questions using only the knowledge base context provided in the message. "
    "If the answer is not in the context, say that the knowledge base does not contain it. "
    "Keep answers short and clear."
)
NO_CONTEXT = "No relevant information was found in the knowledge base."


def ask(question: str) -> dict:
    logger.info("Answering question with provider=%s (%d chars): %.80s", MODEL_PROVIDER, len(question), question)
    if MODEL_PROVIDER == "ollama":
        return _ask_with_ollama(question)
    return _ask_with_bedrock(question)


# ── Bedrock model (Converse with the guardrail attached) ─────────────────────────────
def _ask_with_bedrock(question: str) -> dict:
    settings = get_settings()
    chunks, context, sources = _retrieve(question, settings.kb_id)

    response = model_client.converse(
        model_arn=settings.model_arn,
        system_prompt=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": [
                {"guardContent": {"text": {"text": context, "qualifiers": ["grounding_source"]}}},
                {"guardContent": {"text": {"text": question, "qualifiers": ["query", "guard_content"]}}},
            ],
        }],
        guardrail_id=settings.guardrail_id,
        guardrail_version=settings.guardrail_version,
    )

    answer = response["output"]["message"]["content"][0]["text"]
    if response.get("stopReason") == "guardrail_intervened":
        logger.warning("Guardrail intervened; policies triggered: %s", _triggered_policies(response))
        return _blocked(answer)

    logger.info("Answer ready, based on %d chunk(s) from %d source document(s)", len(chunks), len(sources))
    return {"answer": answer, "guardrail_action": "NONE", "sources": sources}


# ── Ollama model (ApplyGuardrail before and after) ───────────────────────────────────
def _ask_with_ollama(question: str) -> dict:
    settings = get_settings()

    input_check = guardrail_client.check_input(question, settings.guardrail_id, settings.guardrail_version)
    if input_check.blocked:
        logger.warning("Guardrail blocked the question; policies: %s", input_check.policies)
        return _blocked(input_check.text)

    chunks, context, sources = _retrieve(question, settings.kb_id, OLLAMA_MAX_CHUNKS)
    user_prompt = f"Knowledge base context:\n{context}\n\nQuestion: {question}"
    answer = ollama_client.chat(OLLAMA_MODEL, SYSTEM_PROMPT, user_prompt)

    output_check = guardrail_client.check_output(
        answer, context, question, settings.guardrail_id, settings.guardrail_version
    )
    if output_check.blocked:
        logger.warning("Guardrail blocked the answer; policies: %s", output_check.policies)
        return _blocked(output_check.text)
    if output_check.masked:
        logger.warning("Guardrail masked part of the answer; policies: %s", output_check.policies)
        return {"answer": output_check.text, "guardrail_action": "MASKED", "sources": sources}

    logger.info("Answer ready, based on %d chunk(s) from %d source document(s)", len(chunks), len(sources))
    return {"answer": answer, "guardrail_action": "NONE", "sources": sources}


# ── Shared helpers ───────────────────────────────────────────────────────────────────
def _retrieve(question: str, kb_id: str, max_chunks: int = MAX_CHUNKS) -> tuple[list[dict], str, list[str]]:
    """Top chunks, their text joined as one context string, and their source documents."""
    chunks = knowledge_base_client.retrieve(question, kb_id)[:max_chunks]
    context = "\n\n".join(c["content"]["text"] for c in chunks if c.get("content", {}).get("text"))
    if not context:
        logger.warning("No chunks retrieved for the question; using an empty-context notice")
    return chunks, context or NO_CONTEXT, _source_uris(chunks)


def _blocked(message: str) -> dict:
    return {
        "answer": message or "This request was blocked by the guardrail.",
        "guardrail_action": "INTERVENED",
        "sources": [],
    }


def _source_uris(chunks: list[dict]) -> list[str]:
    """Unique document locations of the retrieved chunks."""
    uris = set()
    for chunk in chunks:
        for value in chunk.get("location", {}).values():
            if isinstance(value, dict):
                uri = value.get("uri") or value.get("url")
                if uri:
                    uris.add(uri)
    return sorted(uris)


def _triggered_policies(response: dict) -> list[str]:
    """Names of guardrail policies that blocked or masked something (Converse trace)."""
    guardrail_trace = response.get("trace", {}).get("guardrail", {})
    assessments = list(guardrail_trace.get("inputAssessment", {}).values())
    for output_list in guardrail_trace.get("outputAssessments", {}).values():
        assessments.extend(output_list)
    policies = guardrail_client.policies_with_action(assessments, {"BLOCKED", "ANONYMIZED"})
    return sorted(policies) or ["unknown (see trace)"]
