"""Local Tesseract OCR provider"""

from typing import Optional
import requests
import logging
from io import BytesIO
from PIL import Image


class LocalTesseractProvider:
    """
    Local Tesseract OCR provider
    
    Connects to a Tesseract OCR API service via HTTP.
    """
    
    def __init__(self, config: dict):
        """
        Initialize Tesseract OCR provider
        
        Args:
            config: Configuration dictionary with:
                - url: Tesseract API service URL (default: http://localhost:8080)
                - lang: Language(s) to recognize (default: eng+kor)
                - timeout: Request timeout in seconds (default: 30)
        """
        self.url = config.get('url', 'http://localhost:8080')
        self.lang = config.get('lang', 'eng+kor')
        self.timeout = config.get('timeout', 30)
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def extract_text(self, image_data: bytes, **kwargs) -> str:
        """
        Extract text from image using Tesseract
        
        Args:
            image_data: Image bytes
            **kwargs: Additional parameters (e.g., lang override)
        
        Returns:
            Extracted text
        """
        if not image_data:
            raise ValueError("image_data cannot be empty")
        
        try:
            # Validate image
            self._validate_image(image_data)
            
            # Allow runtime override of language
            lang = kwargs.get('lang', self.lang)
            
            # Prepare request
            files = {
                'image': ('image.jpg', BytesIO(image_data), 'image/jpeg')
            }
            params = {
                'lang': lang,
                'psm': kwargs.get('psm', 3)  # PSM (Page Segmentation Mode)
            }
            
            # Send request to Tesseract API
            response = requests.post(
                f"{self.url}/api/ocr",
                files=files,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            # Extract text from response
            result = response.json()
            extracted_text = result.get('text', '')
            
            self.logger.info(f"Extracted {len(extracted_text)} characters from image")
            return extracted_text
            
        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"Failed to connect to Tesseract API: {str(e)}")
            raise Exception(f"Tesseract service unavailable: {str(e)}")
        except requests.exceptions.Timeout as e:
            self.logger.error(f"Tesseract API request timeout: {str(e)}")
            raise Exception(f"Tesseract service timeout: {str(e)}")
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Tesseract API error: {str(e)}")
            raise Exception(f"OCR processing failed: {str(e)}")
    
    def _validate_image(self, image_data: bytes) -> bool:
        """
        Validate image data
        
        Args:
            image_data: Image bytes
        
        Returns:
            True if valid
        
        Raises:
            ValueError: If image is invalid
        """
        try:
            img = Image.open(BytesIO(image_data))
            img.verify()
            return True
        except Exception as e:
            raise ValueError(f"Invalid image data: {str(e)}")
    
    def health_check(self) -> bool:
        """
        Health check for Tesseract service
        
        Returns:
            True if service is healthy
        """
        try:
            response = requests.get(
                f"{self.url}/health",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            self.logger.warning(f"Tesseract health check failed: {str(e)}")
            return False
