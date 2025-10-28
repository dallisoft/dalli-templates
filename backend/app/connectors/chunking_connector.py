"""
Chunking service connector for text segmentation.

Provides unified interface for multiple text chunking providers.
Currently supports:
- Internal (token-based chunking)
- LangChain TextSplitter
- LlamaIndex Chunking
- Semantic Chunking API
"""

import logging
from typing import Any, Dict, List

from .base import BaseConnector
from .errors import ProviderNotFoundError


class ChunkingConnector(BaseConnector):
    """
    Chunking service connector for text segmentation.

    Supports multiple chunking providers through a unified interface.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize chunking connector.

        Args:
            config: Configuration dictionary with provider settings
        """
        super().__init__(config)
        self.logger = logging.getLogger(__name__)

    def _init_provider(self) -> Any:
        """
        Initialize chunking provider based on configuration.

        Returns:
            Initialized chunking provider instance

        Raises:
            ProviderNotFoundError: If provider is not recognized
        """
        provider_type = self.provider_type.lower()

        provider_map = {
            'internal': self._init_internal,
            'langchain': self._init_langchain,
            'llamaindex': self._init_llamaindex,
            'semantic': self._init_semantic,
        }

        init_func = provider_map.get(provider_type)
        if not init_func:
            available = ', '.join(provider_map.keys())
            raise ProviderNotFoundError(
                f"Unknown chunking provider: {provider_type}. "
                f"Available: {available}"
            )

        return init_func()

    def _init_internal(self) -> Any:
        """Initialize internal chunking provider."""
        from .providers.chunking.internal import InternalChunker

        provider_config = self.config.get('internal', {})
        return InternalChunker(provider_config)

    def _init_langchain(self) -> Any:
        """Initialize LangChain chunking provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "LangChain provider not yet implemented. "
            "Please use 'internal' provider or check back later."
        )

    def _init_llamaindex(self) -> Any:
        """Initialize LlamaIndex chunking provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "LlamaIndex provider not yet implemented. "
            "Please use 'internal' provider or check back later."
        )

    def _init_semantic(self) -> Any:
        """Initialize Semantic chunking provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "Semantic chunking provider not yet implemented. "
            "Please use 'internal' provider or check back later."
        )

    def process(self, text: str, **kwargs) -> List[str]:
        """
        Split text into chunks.

        Args:
            text: Input text to chunk
            **kwargs: Additional provider-specific parameters
                - chunk_size: Size of each chunk
                - chunk_overlap: Overlap between chunks
                - separator: Custom separator

        Returns:
            List of text chunks

        Raises:
            ProcessingError: If chunking fails
        """
        return self.provider.chunk_text(text, **kwargs)
