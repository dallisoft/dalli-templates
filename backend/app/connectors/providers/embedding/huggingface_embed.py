"""HuggingFace Text Embeddings Inference provider"""

from typing import List, Optional
import requests
import logging
import numpy as np


class HuggingFaceEmbedding:
    """
    HuggingFace Text Embeddings Inference (TEI) provider
    
    Connects to a HuggingFace TEI service via HTTP.
    """
    
    def __init__(self, config: dict):
        """
        Initialize HuggingFace embedding provider
        
        Args:
            config: Configuration dictionary with:
                - base_url: TEI service URL (default: http://localhost:8080)
                - model_name: Model name (default: BAAI/bge-large-en-v1.5)
                - batch_size: Batch size for processing (default: 16)
                - timeout: Request timeout in seconds (default: 60)
        """
        self.base_url = config.get('base_url', 'http://localhost:8080')
        self.model_name = config.get('model_name', 'BAAI/bge-large-en-v1.5')
        self.batch_size = config.get('batch_size', 16)
        self.timeout = config.get('timeout', 60)
        self.api_key = config.get('api_key')  # Optional API key
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Embedding dimension cache
        self._dimension = None
    
    def embed(self, texts: List[str], **kwargs) -> List[List[float]]:
        """
        Generate embeddings for texts
        
        Args:
            texts: List of input texts
            **kwargs: Additional parameters
        
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        # Validate inputs
        texts = [str(t).strip() for t in texts if t]
        if not texts:
            raise ValueError("No valid texts provided for embedding")
        
        try:
            # Process in batches
            all_embeddings = []
            
            for i in range(0, len(texts), self.batch_size):
                batch = texts[i:i + self.batch_size]
                batch_embeddings = self._embed_batch(batch)
                all_embeddings.extend(batch_embeddings)
            
            self.logger.info(f"Generated embeddings for {len(texts)} texts")
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
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['Authorization'] = f"Bearer {self.api_key}"
        
        payload = {
            'inputs': texts,
            'normalize': True
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/embed",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Handle different response formats
            if isinstance(result, list):
                embeddings = result
            elif isinstance(result, dict) and 'embeddings' in result:
                embeddings = result['embeddings']
            else:
                raise ValueError("Unexpected response format from TEI service")
            
            # Ensure embeddings are proper format
            embeddings = [
                [float(x) for x in emb] 
                for emb in embeddings
            ]
            
            return embeddings
            
        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"Failed to connect to TEI service: {str(e)}")
            raise Exception(f"TEI service unavailable: {str(e)}")
        except requests.exceptions.Timeout as e:
            self.logger.error(f"TEI service request timeout: {str(e)}")
            raise Exception(f"TEI service timeout: {str(e)}")
    
    def get_dimension(self) -> int:
        """
        Get embedding dimension
        
        Returns:
            Dimension of embedding vectors
        """
        if self._dimension is not None:
            return self._dimension
        
        try:
            # Get dimension by embedding a test text
            test_embedding = self._embed_batch(["test"])
            if test_embedding and len(test_embedding) > 0:
                self._dimension = len(test_embedding[0])
                self.logger.info(f"Embedding dimension: {self._dimension}")
                return self._dimension
            else:
                raise ValueError("Failed to determine embedding dimension")
                
        except Exception as e:
            self.logger.error(f"Failed to get embedding dimension: {str(e)}")
            # Default to 1024 for BAAI/bge models
            self._dimension = 1024
            return self._dimension
    
    def health_check(self) -> bool:
        """
        Health check for TEI service
        
        Returns:
            True if service is healthy
        """
        try:
            response = requests.get(
                f"{self.base_url}/health",
                timeout=5
            )
            is_healthy = response.status_code == 200
            
            if not is_healthy:
                self.logger.warning(f"TEI health check returned status {response.status_code}")
            
            return is_healthy
            
        except Exception as e:
            self.logger.warning(f"TEI health check failed: {str(e)}")
            return False
