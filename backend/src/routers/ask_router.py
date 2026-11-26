"""POST /ask: question in, knowledge base answer out."""
from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException

from src.clients.ollama_client import OllamaError
from src.config.settings import ConfigurationError
from src.schemas.ask_schema import AskRequest, AskResponse
from src.services import kb_service
from src.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    try:
        result = kb_service.ask(request.question)
    except ConfigurationError as error:
        logger.error("Cannot answer /ask: server is not configured (%s)", error)
        raise HTTPException(status_code=500, detail="Server configuration error")
    except OllamaError as error:
        logger.error("Cannot answer /ask: local model unavailable (%s)", error)
        raise HTTPException(status_code=503, detail=str(error))
    except ClientError as error:
        code = error.response["Error"]["Code"]
        logger.error("Cannot answer /ask: AWS call failed (%s)", code)
        # Throttling = AWS quota/rate limit: tell the caller to retry later.
        status = 429 if code == "ThrottlingException" else 502
        raise HTTPException(status_code=status, detail=error.response["Error"]["Message"])
    return AskResponse(question=request.question, **result)
