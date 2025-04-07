import logging
import pytest


# Test if the logger can be accessed and used
def test_logging():
    logger = logging.getLogger("test_logger")

    # Test logging at different levels
    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.critical("This is a critical message")

    # We don't need to verify output content, but we can ensure no exceptions are thrown
    try:
        logger.info("Test message")
    except Exception as e:
        pytest.fail(f"Logging failed: {e}")
