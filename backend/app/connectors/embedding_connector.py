"""
Embedding service connector for vector generation.

Provides unified interface for multiple embedding providers.
Currently supports:
- HuggingFace Text Embeddings Inference (TEI)
- OpenAI Embeddings
- Ollama Embeddings
- Azure OpenAI Embeddings
- Cohere Embeddings
"""

import logging
from typing import Any, Dict, List

from .base import BaseConnector
from .errors import ProviderNotFoundError


class EmbeddingConnector(BaseConnector):
    """
    Embedding service connector for generating text embeddings.

    Supports multiple embedding providers through a unified interface.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize embedding connector.

        Args:
            config: Configuration dictionary with provider settings
        """
        super().__init__(config)
        self.logger = logging.getLogger(__name__)

    def _init_provider(self) -> Any:
        """
        Initialize embedding provider based on configuration.

        Returns:
            Initialized embedding provider instance

        Raises:
            ProviderNotFoundError: If provider is not recognized
        """
        provider_type = self.provider_type.lower()

        provider_map = {
            'openai': self._init_openai,
            'huggingface': self._init_huggingface,
            'ollama': self._init_ollama,
            'azure': self._init_azure,
            'cohere': self._init_cohere,
        }

        init_func = provider_map.get(provider_type)
        if not init_func:
            available = ', '.join(provider_map.keys())
            raise ProviderNotFoundError(
                f"Unknown embedding provider: {provider_type}. "
                f"Available: {available}"
            )

        return init_func()

    def _init_openai(self) -> Any:
        """Initialize OpenAI embedding provider."""
        from .providers.embedding.openai_embed import OpenAIEmbedding

        provider_config = self.config.get('openai', {})
        return OpenAIEmbedding(provider_config)

    def _init_huggingface(self) -> Any:
        """Initialize HuggingFace embedding provider."""
        from .providers.embedding.huggingface_embed import HuggingFaceEmbedding

        provider_config = self.config.get('huggingface', {})
        return HuggingFaceEmbedding(provider_config)

    def _init_ollama(self) -> Any:
        """Initialize Ollama embedding provider."""
        from .providers.embedding.ollama_embed import OllamaEmbedding

        provider_config = self.config.get('ollama', {})
        return OllamaEmbedding(provider_config)

    def _init_azure(self) -> Any:
        """Initialize Azure OpenAI embedding provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "Azure embedding provider not yet implemented. "
            "Please use 'huggingface' provider or check back later."
        )

    def _init_cohere(self) -> Any:
        """Initialize Cohere embedding provider."""
        # To be implemented in Phase 2
        raise ProviderNotFoundError(
            "Cohere provider not yet implemented. "
            "Please use 'huggingface' provider or check back later."
        )

    def process(self, texts: List[str], **kwargs) -> List[List[float]]:
        """
        Generate embeddings for texts.

        Args:
            texts: List of input texts to embed
            **kwargs: Additional provider-specific parameters
                - batch_size: Number of texts to process at once
                - normalize: Whether to normalize embeddings

        Returns:
            List of embedding vectors (each vector is a list of floats)

        Raises:
            ProcessingError: If embedding generation fails
        """
        return self.provider.embed(texts, **kwargs)

    def get_dimension(self) -> int:
        """
        Get embedding dimension.

        Returns:
            Dimension of the embedding vectors
        """
        return self.provider.get_dimension()
