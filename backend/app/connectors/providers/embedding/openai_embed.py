"""OpenAI embedding provider"""

from typing import List, Optional
import logging


class OpenAIEmbedding:
    """
    OpenAI embedding provider
    
    Uses OpenAI API to generate embeddings.
    """
    
    # Model dimension mappings
    MODEL_DIMENSIONS = {
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072,
        'text-embedding-ada-002': 1536,
    }
    
    def __init__(self, config: dict):
        """
        Initialize OpenAI embedding provider
        
        Args:
            config: Configuration dictionary with:
                - api_key: OpenAI API key (required)
                - model_name: Model name (default: text-embedding-3-small)
                - base_url: Base URL (default: https://api.openai.com/v1)
                - timeout: Request timeout in seconds (default: 60)
        """
        self.api_key = config.get('api_key')
        if not self.api_key:
            raise ValueError("api_key is required for OpenAI embedding")
        
        self.model_name = config.get('model_name', 'text-embedding-3-small')
        self.base_url = config.get('base_url', 'https://api.openai.com/v1')
        self.timeout = config.get('timeout', 60)
        self.batch_size = config.get('batch_size', 16)
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Initialize OpenAI client
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=self.timeout
            )
        except ImportError:
            raise ImportError("openai package is required. Install with: pip install openai")
    
    def embed(self, texts: List[str], **kwargs) -> List[List[float]]:
        """
        Generate embeddings for texts using OpenAI
        
        Args:
            texts: List of input texts
            **kwargs: Additional parameters
        
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        # Validate and clean inputs
        texts = [str(t).strip() for t in texts if t]
        if not texts:
            raise ValueError("No valid texts provided for embedding")
        
        try:
            all_embeddings = []
            
            # Process in batches
            for i in range(0, len(texts), self.batch_size):
                batch = texts[i:i + self.batch_size]
                batch_embeddings = self._embed_batch(batch)
                all_embeddings.extend(batch_embeddings)
            
            self.logger.info(f"Generated embeddings for {len(texts)} texts using {self.model_name}")
            return all_embeddings
            
        except Exception as e:
            self.logger.error(f"Embedding generation failed: {str(e)}")
            raise Exception(f"Failed to generate embeddings: {str(e)}")
    
    def _embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a batch of texts
        
        Args:
            texts: Batch of texts
        
        Returns:
            List of embedding vectors
        """
        try:
            response = self.client.embeddings.create(
                model=self.model_name,
                input=texts
            )
            
            # Extract embeddings from response
            embeddings = [
                [float(x) for x in item.embedding]
                for item in sorted(response.data, key=lambda x: x.index)
            ]
            
            return embeddings
            
        except Exception as e:
            self.logger.error(f"OpenAI API error: {str(e)}")
            raise Exception(f"OpenAI API call failed: {str(e)}")
    
    def get_dimension(self) -> int:
        """
        Get embedding dimension for the current model
        
        Returns:
            Dimension of embedding vectors
        """
        if self.model_name in self.MODEL_DIMENSIONS:
            return self.MODEL_DIMENSIONS[self.model_name]
        
        # Try to get dimension from a test embedding
        try:
            embeddings = self._embed_batch(["test"])
            if embeddings and len(embeddings) > 0:
                dimension = len(embeddings[0])
                self.logger.info(f"Embedding dimension for {self.model_name}: {dimension}")
                return dimension
        except Exception as e:
            self.logger.warning(f"Failed to determine embedding dimension: {str(e)}")
        
        # Default to 1536 (size of ada-002 and 3-small)
        return 1536
    
    def health_check(self) -> bool:
        """
        Health check for OpenAI API
        
        Returns:
            True if service is accessible
        """
        try:
            # Try to generate an embedding as a health check
            self._embed_batch(["health check"])
            return True
        except Exception as e:
            self.logger.warning(f"OpenAI health check failed: {str(e)}")
            return False
