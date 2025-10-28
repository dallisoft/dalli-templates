"""
Custom exceptions for connector system.

This module defines all custom exception classes used throughout
the connector architecture for proper error handling and logging.
"""


class ConnectorError(Exception):
    """
    Base exception for all connector-related errors.
    
    All custom exceptions in the connector system should inherit from this.
    """
    pass


class ProviderNotFoundError(ConnectorError):
    """
    Raised when a requested provider cannot be found.
    
    This typically occurs when trying to get a connector for a provider
    that hasn't been registered or doesn't exist.
    """
    pass


class ConfigurationError(ConnectorError):
    """
    Raised when configuration is invalid or incomplete.
    
    This occurs when:
    - Required configuration keys are missing
    - Configuration values are invalid
    - Configuration file cannot be parsed
    """
    pass


class ConnectionError(ConnectorError):
    """
    Raised when connection to external service fails.
    
    This occurs when:
    - Network connection fails
    - Service is unreachable
    - Authentication fails
    - Initial handshake fails
    """
    pass


class HealthCheckError(ConnectorError):
    """
    Raised when health check fails for a service.
    
    This occurs when:
    - Service is unavailable
    - Service returns unhealthy status
    - Response format is unexpected
    """
    pass


class ProcessingError(ConnectorError):
    """
    Raised when processing/execution fails.
    
    This occurs when:
    - The actual service processing fails
    - Response parsing fails
    - Output validation fails
    - Service returns an error
    """
    pass
