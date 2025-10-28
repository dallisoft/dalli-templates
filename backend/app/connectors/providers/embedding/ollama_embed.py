"""Ollama embedding provider"""

from typing import List, Optional
import requests
import logging


class OllamaEmbedding:
    """
    Ollama local embedding provider
    
    Connects to a local Ollama service via HTTP.
    """
    
    def __init__(self, config: dict):
        """
        Initialize Ollama embedding provider
        
        Args:
            config: Configuration dictionary with:
                - base_url: Ollama service URL (default: http://localhost:11434)
                - model_name: Model name (default: nomic-embed-text)
                - batch_size: Batch size for processing (default: 16)
                - timeout: Request timeout in seconds (default: 60)
                - keep_alive: Model keep-alive time (default: -1, unlimited)
        """
        self.base_url = config.get('base_url', 'http://localhost:11434')
        self.model_name = config.get('model_name', 'nomic-embed-text')
        self.batch_size = config.get('batch_size', 16)
        self.timeout = config.get('timeout', 60)
        self.keep_alive = config.get('keep_alive', -1)
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Embedding dimension cache
        self._dimension = None
    
    def embed(self, texts: List[str], **kwargs) -> List[List[float]]:
        """
        Generate embeddings for texts using Ollama
        
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
        embeddings = []
        
        try:
            for text in texts:
                payload = {
                    'model': self.model_name,
                    'prompt': text,
                    'stream': False,
                    'keep_alive': self.keep_alive
                }
                
                response = requests.post(
                    f"{self.base_url}/api/embeddings",
                    json=payload,
                    timeout=self.timeout
                )
                response.raise_for_status()
                
                result = response.json()
                
                if 'embedding' not in result:
                    raise ValueError("No embedding in response from Ollama")
                
                embeddings.append([float(x) for x in result['embedding']])
            
            return embeddings
            
        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"Failed to connect to Ollama service: {str(e)}")
            raise Exception(f"Ollama service unavailable: {str(e)}")
        except requests.exceptions.Timeout as e:
            self.logger.error(f"Ollama service request timeout: {str(e)}")
            raise Exception(f"Ollama service timeout: {str(e)}")
    
    def get_dimension(self) -> int:
        """
        Get embedding dimension
        
        Returns:
            Dimension of embedding vectors
        """
        if self._dimension is not None:
            return self._dimension
        
        try:
            embeddings = self._embed_batch(["test"])
            if embeddings and len(embeddings) > 0:
                self._dimension = len(embeddings[0])
                self.logger.info(f"Embedding dimension: {self._dimension}")
                return self._dimension
            else:
                raise ValueError("Failed to determine embedding dimension")
                
        except Exception as e:
            self.logger.error(f"Failed to get embedding dimension: {str(e)}")
            # Default to 768 for nomic-embed-text
            self._dimension = 768
            return self._dimension
    
    def health_check(self) -> bool:
        """
        Health check for Ollama service
        
        Returns:
            True if service is healthy
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            is_healthy = response.status_code == 200
            
            if is_healthy:
                result = response.json()
                models = result.get('models', [])
                model_names = [m.get('name', '') for m in models]
                
                # Check if our model is available
                if not any(self.model_name in name for name in model_names):
                    self.logger.warning(f"Model {self.model_name} not found in Ollama")
                    # Still return True as service is up, model just needs to be pulled
                    return True
            
            return is_healthy
            
        except Exception as e:
            self.logger.warning(f"Ollama health check failed: {str(e)}")
            return False 