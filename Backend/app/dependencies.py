"""
Authentication dependencies for FastAPI.
"""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, DocumentRole
from app.services.auth import auth_service
from app.services.document import document_service


# Security scheme for JWT Bearer token
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Raises:
        HTTPException 401: If token is missing or invalid.
        HTTPException 401: If user not found or inactive.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = auth_service.decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await auth_service.get_user_by_id(db, UUID(user_id))
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """
    Dependency to optionally get the current user.
    Returns None if no token or invalid token (doesn't raise).
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = auth_service.decode_access_token(token)
    
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = await auth_service.get_user_by_id(db, UUID(user_id))
    
    if user is None or not user.is_active:
        return None
    
    return user


# Type alias for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[Optional[User], Depends(get_optional_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


class DocumentAccessChecker:
    """
    Dependency class to check document access permissions.
    
    Usage:
        @router.get("/documents/{document_id}")
        async def get_doc(
            document_id: UUID,
            _: None = Depends(DocumentAccessChecker(DocumentRole.VIEWER))
        ):
            ...
    """
    
    def __init__(self, required_role: DocumentRole = DocumentRole.VIEWER):
        self.required_role = required_role
    
    async def __call__(
        self,
        document_id: UUID,
        current_user: CurrentUser,
        db: DbSession,
    ) -> None:
        """Check if current user has required access to document."""
        has_access = await document_service.check_access(
            db, document_id, current_user.id, self.required_role
        )
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {self.required_role.value}",
            )


# Pre-configured access checkers
require_viewer = DocumentAccessChecker(DocumentRole.VIEWER)
require_editor = DocumentAccessChecker(DocumentRole.EDITOR)
require_owner = DocumentAccessChecker(DocumentRole.OWNER)
