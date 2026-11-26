"""Thin wrapper around a local Ollama server (open-source models such as llama3.2).

Uses Ollama's HTTP API with the standard library only, so no extra dependency is needed.
"""
import json
import time
import urllib.error
import urllib.request

from src.config.settings import OLLAMA_TIMEOUT_SECONDS, OLLAMA_URL
from src.utils.logger import get_logger

logger = get_logger(__name__)


class OllamaError(RuntimeError):
    """Ollama is not reachable, the model is missing, or the reply was invalid."""


def chat(model: str, system_prompt: str, user_prompt: str) -> str:
    """Send one system + user message to Ollama and return the reply text."""
    payload = {
        "model": model,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "options": {"temperature": 0, "num_ctx": 4096},
        "keep_alive": "30m",  # keep the model in memory between questions
    }
    request = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    logger.info("Calling Ollama (model=%s, url=%s, prompt=%d chars)", model, OLLAMA_URL, len(user_prompt))
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT_SECONDS) as response:
            body = json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:200]
        logger.error("Ollama returned HTTP %d after %d ms: %s", error.code, _elapsed_ms(started), detail)
        raise OllamaError(f"Ollama error {error.code}: {detail}") from error
    except (urllib.error.URLError, TimeoutError) as error:
        logger.error("Ollama not reachable at %s after %d ms: %s", OLLAMA_URL, _elapsed_ms(started), error)
        raise OllamaError(f"Ollama is not reachable at {OLLAMA_URL}") from error

    answer = body.get("message", {}).get("content", "").strip()
    if not answer:
        logger.error("Ollama returned an empty answer (model=%s)", model)
        raise OllamaError("Ollama returned an empty answer")

    logger.info(
        "Ollama answered in %d ms (%s prompt tokens, %s answer tokens)",
        _elapsed_ms(started), body.get("prompt_eval_count", "?"), body.get("eval_count", "?"),
    )
    return answer


def _elapsed_ms(started: float) -> int:
    return int((time.perf_counter() - started) * 1000)
