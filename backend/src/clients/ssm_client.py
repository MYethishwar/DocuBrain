"""Thin wrapper around AWS Systems Manager Parameter Store."""
import boto3
from botocore.exceptions import BotoCoreError, ClientError

from src.config.settings import AWS_REGION
from src.utils.logger import get_logger

logger = get_logger(__name__)
_ssm = boto3.client("ssm", region_name=AWS_REGION)


def get_parameters(names: list[str]) -> dict[str, str]:
    """Return {parameter name: value} for the parameters that exist.

    Never raises: if SSM can't be reached (no credentials, no permission, no network)
    it logs a warning and returns {}, so the caller can fall back to .env.
    """
    try:
        response = _ssm.get_parameters(Names=names)
    except (ClientError, BotoCoreError) as error:
        logger.warning(
            "SSM unavailable in region '%s' (%s: %s); falling back to .env",
            AWS_REGION, type(error).__name__, error,
        )
        return {}

    found = {p["Name"]: p["Value"] for p in response["Parameters"]}
    missing = response.get("InvalidParameters", [])
    logger.info("SSM returned %d of %d parameters", len(found), len(names))
    if missing:
        logger.warning("SSM parameters not found: %s", ", ".join(missing))
    return found
