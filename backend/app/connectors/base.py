"""
Base connector class for external service integrations.

Provides common functionality including:
- Configuration management
- Retry logic with exponential backoff
- Timeout management
- Health checking
- Error handling
- Logging
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

from .errors import ConnectionError as ConnectorConnectionError, ProcessingError


class BaseConnector(ABC):
    """
    Abstract base class for all service connectors.

    Provides:
    - Retry logic with exponential backoff
    - Timeout management
    - Health checking
    - Error handling
    - Logging
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the connector with configuration.

        Args:
            config: Configuration dictionary containing:
                - provider: Provider type (e.g., 'tesseract', 'openai')
                - timeout: Request timeout in seconds (default: 30)
                - max_retries: Maximum number of retries (default: 3)
                - Additional provider-specific configuration
        """
        self.config = config
        self.provider_type = config.get('provider', 'default')
        self.timeout = config.get('timeout', 30)
        self.max_retries = config.get('max_retries', 3)
        self.logger = logging.getLogger(self.__class__.__name__)

        # Initialize provider
        self.provider = self._init_provider()

    @abstractmethod
    def _init_provider(self) -> Any:
        """
        Initialize the service provider.

        Must be implemented by subclasses to create provider-specific
        implementation based on configuration.

        Returns:
            Initialized provider instance

        Raises:
            ConfigurationError: If configuration is invalid
            ConnectionError: If provider initialization fails
        """
        pass

    @abstractmethod
    def process(self, *args, **kwargs) -> Any:
        """
        Main processing method.

        Must be implemented by subclasses with specific processing logic
        for the service type.

        Args:
            *args: Positional arguments (service-specific)
            **kwargs: Keyword arguments (service-specific)

        Returns:
            Processing result (service-specific)

        Raises:
            ProcessingError: If processing fails
        """
        pass

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((
            requests.exceptions.Timeout,
            requests.exceptions.ConnectionError
        )),
        reraise=True
    )
    def _call_api(
        self,
        endpoint: str,
        data: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
        method: str = 'POST'
    ) -> Dict[str, Any]:
        """
        Make API call with automatic retry logic.

        Implements exponential backoff retry logic for transient failures.
        Retries on timeout and connection errors up to max_retries times.

        Args:
            endpoint: API endpoint URL
            data: Request payload
            headers: Optional HTTP headers
            method: HTTP method (POST or GET)

        Returns:
            Response JSON data

        Raises:
            ConnectorConnectionError: If connection fails after retries
            ProcessingError: If response is invalid
        """
        try:
            if method.upper() == 'GET':
                response = requests.get(
                    endpoint,
                    params=data,
                    headers=headers or {},
                    timeout=self.timeout
                )
            else:
                response = requests.post(
                    endpoint,
                    json=data,
                    headers=headers or {},
                    timeout=self.timeout
                )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout as e:
            self.logger.error(f"API call timeout: {str(e)}")
            raise ConnectorConnectionError(f"Request timeout: {str(e)}") from e

        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"API connection failed: {str(e)}")
            raise ConnectorConnectionError(f"Connection failed: {str(e)}") from e

        except requests.exceptions.HTTPError as e:
            self.logger.error(f"API HTTP error: {str(e)}")
            raise ProcessingError(f"HTTP error: {str(e)}") from e

        except Exception as e:
            self.logger.error(f"API call failed: {str(e)}")
            raise ProcessingError(f"API call failed: {str(e)}") from e

    def health_check(self) -> bool:
        """
        Check if service is healthy and accessible.

        Attempts to verify that the underlying provider is operational.
        Should be implemented by subclasses for specific health check logic.

        Returns:
            True if healthy, False otherwise
        """
        try:
            if hasattr(self.provider, 'health_check'):
                return self.provider.health_check()
            # Default to True if provider doesn't implement health check
            self.logger.debug(f"{self.__class__.__name__} health check passed")
            return True

        except Exception as e:
            self.logger.warning(f"Health check failed: {str(e)}")
            return False

    def get_provider_info(self) -> Dict[str, Any]:
        """
        Get information about current provider configuration.

        Returns provider information while filtering out sensitive data
        like API keys and credentials.

        Returns:
            Dictionary containing:
                - type: Provider type
                - config: Provider configuration (without sensitive data)
                - timeout: Request timeout
                - max_retries: Maximum retry attempts
        """
        return {
            'type': self.provider_type,
            'config': {
                k: v for k, v in self.config.get(self.provider_type, {}).items()
                if k not in ['api_key', 'secret_key', 'password', 'token', 'access_token']
            },
            'timeout': self.timeout,
            'max_retries': self.max_retries
        }
