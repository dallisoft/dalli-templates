"""
Connectors package for external service integrations.

This package provides a plugin-based architecture for integrating
external services like OCR, Chunking, and Embedding providers.
"""

from .base import BaseConnector
from .factory import ServiceConnectorFactory
from .errors import (
    ConnectorError,
    ProviderNotFoundError,
    ConfigurationError,
    ConnectionError,
    HealthCheckError,
    ProcessingError,
)

__all__ = [
    'BaseConnector',
    'ServiceConnectorFactory',
    'ConnectorError',
    'ProviderNotFoundError',
    'ConfigurationError',
    'ConnectionError',
    'HealthCheckError',
    'ProcessingError',
]

