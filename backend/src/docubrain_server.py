"""DocuBrain FastAPI server. Runs locally with uvicorn and on AWS Lambda through Mangum.

Local:          uvicorn src.docubrain_server:app --reload
Lambda handler: src.docubrain_server.handler
"""
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from src.config.settings import AWS_REGION, CORS_ORIGINS, PARAM_PREFIX
from src.routers import ask_router, health_router
from src.utils.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(title="DocuBrain API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """One log line per request: method, path, status and duration."""
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        raise
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info("%s %s -> %d (%d ms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


app.include_router(health_router.router)
app.include_router(ask_router.router)

handler = Mangum(app)

logger.info(
    "DocuBrain API ready (region=%s, ssm_prefix=%s, cors_origins=%s)",
    AWS_REGION, PARAM_PREFIX, CORS_ORIGINS,
)
