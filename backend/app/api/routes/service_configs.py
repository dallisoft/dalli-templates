"""
Service Configuration API routes.

Provides endpoints for managing user service configurations including:
- Creating, updating, and deleting service configurations
- Testing service connections
- Retrieving service configuration details
"""

import json
import logging
import time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, ServiceConfig as ServiceConfigModel
from app.schemas import ServiceConfig, ServiceConfigCreate, ServiceConfigUpdate
from app.connectors.factory import ServiceConnectorFactory
from app.connectors.errors import (
    ConnectorError,
    ProviderNotFoundError,
    ConfigurationError,
)

# Import authentication dependency from your auth module
# from app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# Temporary mock function - replace with actual auth dependency
async def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user.
    
    This is a placeholder. Replace with actual authentication dependency
    from your project's authentication module.
    """
    # In production, this should verify JWT token and return actual user
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.get("/", response_model=List[ServiceConfig])
async def get_user_service_configs(
    service_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ServiceConfig]:
    """
    Get all service configurations for the current user.
    
    Optionally filter by service type (ocr, chunking, embedding).
    
    Args:
        service_type: Optional service type filter
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of service configurations
    """
    query = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.user_id == current_user.id
    )

    if service_type:
        query = query.filter(ServiceConfigModel.service_name == service_type)

    configs = query.all()
    
    # Parse JSON config fields
    for config in configs:
        if config.config_data:
            try:
                # config.config will be parsed by pydantic
                pass
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse config for {config.id}")

    return configs


@router.post("/", response_model=ServiceConfig, status_code=status.HTTP_201_CREATED)
async def create_service_config(
    config_data: ServiceConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ServiceConfig:
    """
    Create a new service configuration.
    
    Args:
        config_data: Service configuration data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created service configuration
        
    Raises:
        HTTPException: If configuration already exists or is invalid
    """
    # Check if config already exists for this service type
    existing = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.user_id == current_user.id,
        ServiceConfigModel.service_name == config_data.type,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Configuration for {config_data.type} already exists",
        )

    # Create new config
    new_config = ServiceConfigModel(
        user_id=current_user.id,
        service_name=config_data.type,
        config_data=json.dumps(config_data.config),
    )

    try:
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        logger.info(f"Created service config {new_config.id} for user {current_user.id}")
        return new_config
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create service config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create configuration",
        ) from e


@router.get("/{config_id}", response_model=ServiceConfig)
async def get_service_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ServiceConfig:
    """
    Get a specific service configuration.
    
    Args:
        config_id: Configuration ID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Service configuration
        
    Raises:
        HTTPException: If configuration not found
    """
    config = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.id == config_id,
        ServiceConfigModel.user_id == current_user.id,
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found",
        )

    return config


@router.put("/{config_id}", response_model=ServiceConfig)
async def update_service_config(
    config_id: int,
    config_data: ServiceConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ServiceConfig:
    """
    Update a service configuration.
    
    Args:
        config_id: Configuration ID
        config_data: Updated configuration data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated service configuration
        
    Raises:
        HTTPException: If configuration not found
    """
    config = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.id == config_id,
        ServiceConfigModel.user_id == current_user.id,
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found",
        )

    # Update fields
    if config_data.name is not None:
        config.service_name = config_data.name
    if config_data.config is not None:
        config.config_data = json.dumps(config_data.config)

    try:
        db.commit()
        db.refresh(config)
        logger.info(f"Updated service config {config_id}")
        return config
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update service config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update configuration",
        ) from e


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a service configuration.
    
    Args:
        config_id: Configuration ID
        db: Database session
        current_user: Authenticated user
        
    Raises:
        HTTPException: If configuration not found
    """
    config = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.id == config_id,
        ServiceConfigModel.user_id == current_user.id,
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found",
        )

    try:
        db.delete(config)
        db.commit()
        logger.info(f"Deleted service config {config_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete service config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete configuration",
        ) from e


@router.post("/test/connection")
async def test_service_connection(
    service_type: str = Query(...),
    provider: str = Query(...),
    config: dict = Query(...),
):
    """
    Test connection to external service.
    
    This endpoint tests whether a service configuration is valid
    and the service is accessible.
    
    Args:
        service_type: Service type (ocr, chunking, embedding)
        provider: Provider name
        config: Provider configuration
        
    Returns:
        Test result with connection status and response time
        
    Raises:
        HTTPException: If test fails
    """
    try:
        start_time = time.time()

        # Create temporary connector with provided config
        test_config = {
            'provider': provider,
            provider: config,
            'timeout': 10,
            'max_retries': 1
        }

        connector = ServiceConnectorFactory.get_connector(
            service_type.lower(),
            test_config
        )

        # Run health check
        is_healthy = connector.health_check()
        response_time = time.time() - start_time

        if is_healthy:
            provider_info = connector.get_provider_info()
            logger.info(f"Service test passed: {service_type}/{provider}")
            return {
                'success': True,
                'message': f'Successfully connected to {provider}',
                'response_time': response_time,
                'provider_info': provider_info,
            }
        else:
            logger.warning(f"Service health check failed: {service_type}/{provider}")
            return {
                'success': False,
                'message': f'Service health check failed for {provider}',
                'response_time': response_time,
            }

    except ProviderNotFoundError as e:
        logger.error(f"Provider not found: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider not found: {str(e)}",
        ) from e

    except ConfigurationError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Configuration error: {str(e)}",
        ) from e

    except ConnectorError as e:
        logger.error(f"Connector error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service error: {str(e)}",
        ) from e

    except Exception as e:
        logger.error(f"Unexpected error in connection test: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Connection test failed",
        ) from e
