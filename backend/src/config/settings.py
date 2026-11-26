"""App settings.

Each Bedrock setting is looked up in this order:
  1. SSM Parameter Store  (/docubrain/<name>)
  2. .env file or environment variable
  3. otherwise -> ConfigurationError
Values are read once and cached for the life of the process (one Lambda container).
"""
import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

from src.utils.logger import get_logger

load_dotenv()  # loads backend/.env if it exists; does nothing on Lambda
logger = get_logger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
PARAM_PREFIX = os.getenv("PARAM_PREFIX", "/docubrain")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")]

# setting name -> (SSM parameter name suffix, .env variable name)
_SOURCES = {
    "kb_id": ("kb-id", "KB_ID"),
    "guardrail_id": ("guardrail-id", "GUARDRAIL_ID"),
    "guardrail_version": ("guardrail-version", "GUARDRAIL_VERSION"),
    "model_arn": ("model-arn", "MODEL_ARN"),
}


class ConfigurationError(RuntimeError):
    """A required setting was found neither in SSM nor in .env."""


@dataclass(frozen=True)
class Settings:
    kb_id: str
    guardrail_id: str
    guardrail_version: str
    model_arn: str


@lru_cache
def get_settings() -> Settings:
    # Imported here because ssm_client imports AWS_REGION from this module.
    from src.clients import ssm_client

    ssm_names = {key: f"{PARAM_PREFIX}/{suffix}" for key, (suffix, _) in _SOURCES.items()}
    logger.info("Loading settings: SSM prefix '%s' first, then .env", PARAM_PREFIX)
    ssm_values = ssm_client.get_parameters(list(ssm_names.values()))

    values, missing = {}, []
    for key, (_, env_name) in _SOURCES.items():
        ssm_name = ssm_names[key]
        if ssm_values.get(ssm_name):
            values[key] = ssm_values[ssm_name]
            logger.info("Setting '%s' loaded from SSM parameter '%s'", key, ssm_name)
        elif os.getenv(env_name):
            values[key] = os.environ[env_name]
            logger.info("Setting '%s' not in SSM; loaded from .env variable '%s'", key, env_name)
        else:
            missing.append(f"{ssm_name} (SSM) / {env_name} (.env)")

    if missing:
        logger.error("Settings missing from both SSM and .env: %s", "; ".join(missing))
        raise ConfigurationError(f"Missing settings: {'; '.join(missing)}")

    logger.info("All %d settings loaded", len(values))
    return Settings(**values)
