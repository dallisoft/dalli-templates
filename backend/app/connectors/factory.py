"""
Service Connector Factory for managing connector instances.

Implements:
- Singleton pattern for connector instances
- Configuration-based initialization
- Thread-safe instance management
- Configuration caching and reloading
"""

import logging
import os
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

import yaml

from .errors import ConfigurationError, ProviderNotFoundError

# Will be imported in get_connector method to avoid circular imports
OCRConnector = None
ChunkingConnector = None
EmbeddingConnector = None


class ServiceConnectorFactory:
    """
    Centralized factory for managing service connectors.

    Features:
    - Singleton pattern for connector instances
    - Configuration-based initialization
    - Health check and reconnection
    - Thread-safe instance management
    - Configuration caching
    """

    _instances: Dict[str, Any] = {}
    _lock = Lock()
    _config_cache: Optional[Dict[str, Any]] = None
    _logger = logging.getLogger(__name__)

    @classmethod
    def get_connector(cls, service_type: str, config: Optional[Dict[str, Any]] = None) -> Any:
        """
        Get or create a service connector instance.

        Implements singleton pattern where same configuration returns same instance.

        Args:
            service_type: Service type - 'ocr', 'chunking', or 'embedding'
            config: Optional configuration override (defaults to service_conf.yaml)

        Returns:
            Configured connector instance

        Raises:
            ProviderNotFoundError: If service_type is not recognized
            ConfigurationError: If configuration is invalid
        """
        # Create cache key based on service type and config
        config_hash = hash(str(sorted(config.items()))) if config else 0
        cache_key = f"{service_type}_{config_hash}"

        if cache_key not in cls._instances:
            with cls._lock:
                # Double-check locking pattern
                if cache_key not in cls._instances:
                    cls._instances[cache_key] = cls._create_connector(
                        service_type, config
                    )
                    cls._logger.info(f"Created new connector instance: {cache_key}")

        return cls._instances[cache_key]

    @classmethod
    def _create_connector(cls, service_type: str, config: Optional[Dict[str, Any]]) -> Any:
        """
        Create new connector instance.

        Args:
            service_type: Service type
            config: Configuration dictionary

        Returns:
            Connector instance

        Raises:
            ProviderNotFoundError: If service_type is not supported
            ConfigurationError: If configuration is invalid
        """
        # Import here to avoid circular imports
        global OCRConnector, ChunkingConnector, EmbeddingConnector

        if OCRConnector is None:
            from .ocr_connector import OCRConnector as OCR
            from .chunking_connector import ChunkingConnector as Chunking
            from .embedding_connector import EmbeddingConnector as Embedding

            OCRConnector = OCR
            ChunkingConnector = Chunking
            EmbeddingConnector = Embedding

        connector_map = {
            'ocr': OCRConnector,
            'chunking': ChunkingConnector,
            'embedding': EmbeddingConnector
        }

        connector_class = connector_map.get(service_type.lower())
        if not connector_class:
            available = ', '.join(connector_map.keys())
            raise ProviderNotFoundError(
                f"Unknown service type: {service_type}. "
                f"Available: {available}"
            )

        # Load configuration if not provided
        final_config = config or cls._load_config(service_type)

        if not final_config:
            raise ConfigurationError(
                f"No configuration found for service type: {service_type}"
            )

        try:
            connector = connector_class(final_config)
            cls._logger.info(f"Successfully created {service_type} connector")
            return connector
        except Exception as e:
            cls._logger.error(f"Failed to create {service_type} connector: {str(e)}")
            raise ConfigurationError(
                f"Failed to initialize {service_type} connector: {str(e)}"
            ) from e

    @classmethod
    def _load_config(cls, service_type: str) -> Dict[str, Any]:
        """
        Load configuration from service_conf.yaml.

        If file doesn't exist, returns default configuration.

        Args:
            service_type: Service type to load config for

        Returns:
            Configuration dictionary
        """
        if cls._config_cache is None:
            config_path = Path(__file__).parent.parent.parent / 'config' / 'service_conf.yaml'

            if not config_path.exists():
                cls._logger.warning(
                    f"Configuration file not found at {config_path}, using defaults"
                )
                return cls._get_default_config(service_type)

            try:
                # Load and parse YAML, substituting environment variables
                with open(config_path, 'r') as f:
                    config_content = f.read()

                # Replace ${VAR_NAME} with environment variables
                for var_name, var_value in os.environ.items():
                    config_content = config_content.replace(f"${{{var_name}}}", var_value)

                cls._config_cache = yaml.safe_load(config_content)
                cls._logger.info(f"Loaded configuration from {config_path}")

            except Exception as e:
                cls._logger.error(f"Failed to load configuration: {str(e)}")
                return cls._get_default_config(service_type)

        # Return service-specific configuration
        service_key = f"{service_type.lower()}_service"
        return cls._config_cache.get(service_key, {})

    @classmethod
    def _get_default_config(cls, service_type: str) -> Dict[str, Any]:
        """
        Get default configuration when file doesn't exist.

        Args:
            service_type: Service type

        Returns:
            Default configuration dictionary
        """
        defaults = {
            'ocr': {
                'provider': 'tesseract',
                'tesseract': {
                    'url': 'http://localhost:8081',
                    'lang': 'eng+kor',
                    'timeout': 30
                },
                'timeout': 30,
                'max_retries': 3
            },
            'chunking': {
                'provider': 'internal',
                'internal': {
                    'chunk_size': 512,
                    'chunk_overlap': 50,
                    'delimiter': '\n!?。；！？'
                },
                'timeout': 30,
                'max_retries': 3
            },
            'embedding': {
                'provider': 'huggingface',
                'huggingface': {
                    'model_name': 'BAAI/bge-large-en-v1.5',
                    'base_url': 'http://localhost:8080',
                    'device': 'cpu'
                },
                'timeout': 60,
                'max_retries': 3
            }
        }

        config = defaults.get(service_type.lower())
        if config:
            cls._logger.info(f"Using default configuration for {service_type}")
        else:
            cls._logger.warning(f"No default configuration for {service_type}")

        return config or {}

    @classmethod
    def reload_config(cls) -> None:
        """
        Reload configuration and reset all connector instances.

        Useful when configuration file changes at runtime.
        """
        with cls._lock:
            cls._config_cache = None
            cls._instances.clear()
            cls._logger.info("Configuration reloaded and instances cleared")

    @classmethod
    def get_instance_count(cls) -> int:
        """
        Get number of cached connector instances.

        Returns:
            Number of active connector instances
        """
        return len(cls._instances)

    @classmethod
    def clear_instances(cls) -> None:
        """
        Clear all cached connector instances.

        Useful for cleanup or testing.
        """
        with cls._lock:
            cls._instances.clear()
            cls._logger.info("All connector instances cleared")
