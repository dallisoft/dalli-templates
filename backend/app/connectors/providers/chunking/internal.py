"""Internal token-based chunking provider"""

from typing import List, Optional
import re
import logging


class InternalChunker:
    """
    Internal token-based text chunking provider
    
    Uses simple token-based splitting with configurable chunk size and overlap.
    """
    
    def __init__(self, config: dict):
        """
        Initialize internal chunker
        
        Args:
            config: Configuration dictionary with:
                - chunk_size: Number of tokens per chunk (default: 512)
                - chunk_overlap: Number of tokens overlap between chunks (default: 50)
                - delimiter: Delimiter pattern for splitting (default: regex)
        """
        self.chunk_size = config.get('chunk_size', 512)
        self.chunk_overlap = config.get('chunk_overlap', 50)
        self.delimiter = config.get('delimiter', r'[\n!?。；！？\.\s]+')
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def chunk_text(self, text: str, **kwargs) -> List[str]:
        """
        Split text into chunks
        
        Args:
            text: Input text to chunk
            **kwargs: Additional parameters (e.g., chunk_size override)
        
        Returns:
            List of text chunks
        """
        if not text or len(text.strip()) == 0:
            return []
        
        # Allow runtime override of chunk parameters
        chunk_size = kwargs.get('chunk_size', self.chunk_size)
        chunk_overlap = kwargs.get('chunk_overlap', self.chunk_overlap)
        
        # Validate parameters
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        if chunk_overlap < 0 or chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be >= 0 and < chunk_size")
        
        # Split text into tokens (words/sentences)
        tokens = self._tokenize(text)
        
        if len(tokens) <= chunk_size:
            return [' '.join(tokens)]
        
        # Create chunks with overlap
        chunks = []
        stride = chunk_size - chunk_overlap
        
        for i in range(0, len(tokens), stride):
            chunk_tokens = tokens[i:i + chunk_size]
            
            if chunk_tokens:  # Skip empty chunks
                chunk_text = ' '.join(chunk_tokens)
                chunks.append(chunk_text)
            
            # Stop if we've reached the end
            if i + chunk_size >= len(tokens):
                break
        
        return chunks
    
    def _tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words/tokens
        
        Simple whitespace-based tokenization.
        More sophisticated tokenization can be added later.
        
        Args:
            text: Input text
        
        Returns:
            List of tokens
        """
        # Split by whitespace and punctuation
        tokens = re.split(r'\s+', text.strip())
        # Filter empty tokens
        tokens = [t for t in tokens if t]
        return tokens
    
    def health_check(self) -> bool:
        """
        Health check for internal chunker
        
        Always returns True as this is a local service
        """
        return True
