"""Pydantic schemas for API request/response validation."""
from .user import UserRead, UserUpdate
from .document import (
    DocumentCreate,
    DocumentRead,
    DocumentUpdate,
    DocumentWithPermissions,
    DocumentPermissionCreate,
    DocumentPermissionRead,
)
from .auth import (
    TokenResponse,
    GoogleAuthURL,
    GoogleAuthCallback,
)
from .invitation import (
    InvitationCreate,
    InvitationRead,
    InvitationResponse,
)

__all__ = [
    # User schemas
    "UserRead",
    "UserUpdate",
    # Document schemas
    "DocumentCreate",
    "DocumentRead",
    "DocumentUpdate",
    "DocumentWithPermissions",
    "DocumentPermissionCreate",
    "DocumentPermissionRead",
    # Auth schemas
    "TokenResponse",
    "GoogleAuthURL",
    "GoogleAuthCallback",
    # Invitation schemas
    "InvitationCreate",
    "InvitationRead",
    "InvitationResponse",
]
