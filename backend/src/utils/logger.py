"""One place to create loggers, so every module logs in the same format.

Usage:
    from src.utils.logger import get_logger
    logger = get_logger(__name__)

Level comes from the LOG_LEVEL environment variable (default INFO).
Output goes to stdout, which Lambda sends to CloudWatch Logs.
"""
import logging
import os
import sys

_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(_FORMAT))
        logger.addHandler(handler)
        logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
        # Lambda already puts a handler on the root logger; don't log every line twice.
        logger.propagate = False
    return logger
