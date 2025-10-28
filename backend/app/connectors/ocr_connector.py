"""
OCR (Optical Character Recognition) service connector.

Provides unified interface for multiple OCR providers.
Currently supports:
- Tesseract (local)
- Google Vision API
- Azure Computer Vision
- AWS Textract
"""

import logging
from typing import Any, Dict

from .base import BaseConnector
from .errors import ProviderNotFoundError


class OCRConnector(BaseConnector):
    """
    OCR service connector for text extraction from images.

    Supports multiple OCR providers through a unified interface.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize OCR connector.

        Args:
            config: Configuration dictionary with provider settings
        """
        super().__init__(config)
        self.logger = logging.getLogger(__name__)

    def _init_provider(self) -> Any:
        """
        Initialize OCR provider based on configuration.

        Returns:
            Initialized OCR provider instance

        Raises:
            ProviderNotFoundError: If provider is not recognized
        """
        provider_type = self.provider_type.lower()

        # Lazy import to avoid circular dependencies
        provider_map = {
            'tesseract': self._init_tesseract,
            'google': self._init_google_vision,
            'azure': self._init_azure_cv,
            'aws': self._init_aws_textract,
        }

        init_func = provider_map.get(provider_type)
        if not init_func:
            available = ', '.join(provider_map.keys())
            raise ProviderNotFoundError(
                f"Unknown OCR provider: {provider_type}. "
                f"Available: {available}"
            )

        return init_func()

    def _init_tesseract(self) -> Any:
        """Initialize Tesseract OCR provider."""
        from .providers.ocr.local_tesseract import LocalTesseractProvider

        provider_config = self.config.get('tesseract', {})
        return LocalTesseractProvider(provider_config)

    def _init_google_vision(self) -> Any:
        """Initialize Google Vision API provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "Google Vision provider not yet implemented. "
            "Please use 'tesseract' provider or check back later."
        )

    def _init_azure_cv(self) -> Any:
        """Initialize Azure Computer Vision provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "Azure Computer Vision provider not yet implemented. "
            "Please use 'tesseract' provider or check back later."
        )

    def _init_aws_textract(self) -> Any:
        """Initialize AWS Textract provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "AWS Textract provider not yet implemented. "
            "Please use 'tesseract' provider or check back later."
        )

    def process(self, image_data: bytes, **kwargs) -> str:
        """
        Extract text from image.

        Args:
            image_data: Image file bytes
            **kwargs: Additional provider-specific parameters
                - language: Language code or list of codes
                - confidence_threshold: Minimum confidence score

        Returns:
            Extracted text from image

        Raises:
            ProcessingError: If extraction fails
        """
        return self.provider.extract_text(image_data, **kwargs)
