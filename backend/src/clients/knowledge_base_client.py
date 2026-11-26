"""Thin wrapper around the Bedrock Knowledge Base Retrieve API (bedrock-agent-runtime).

Retrieve works for both standard and managed knowledge bases.
(RetrieveAndGenerate does not work with managed knowledge bases.)
"""
import time

import boto3
from botocore.exceptions import ClientError

from src.config.settings import AWS_REGION
from src.utils.logger import get_logger

logger = get_logger(__name__)
_agent_runtime = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)


def retrieve(question: str, kb_id: str) -> list[dict]:
    """Return the knowledge base chunks most relevant to the question."""
    logger.info("Calling Retrieve (kb=%s)", kb_id)
    started = time.perf_counter()
    try:
        response = _agent_runtime.retrieve(
            knowledgeBaseId=kb_id,
            retrievalQuery={"text": question},
        )
    except ClientError as error:
        logger.error(
            "Retrieve failed after %d ms (kb=%s): %s - %s",
            _elapsed_ms(started), kb_id,
            error.response["Error"]["Code"], error.response["Error"]["Message"],
        )
        raise

    results = response.get("retrievalResults", [])
    logger.info("Retrieve returned %d chunk(s) in %d ms", len(results), _elapsed_ms(started))
    return results


def _elapsed_ms(started: float) -> int:
    return int((time.perf_counter() - started) * 1000)
