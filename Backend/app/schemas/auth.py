"""Authentication-related Pydantic schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class GoogleAuthURL(BaseModel):
    """Response containing Google OAuth authorization URL."""
    authorization_url: str
    state: str


class GoogleAuthCallback(BaseModel):
    """Request schema for Google OAuth callback."""
    code: str
    state: str | None = None


class TokenResponse(BaseModel):
    """JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Access token expiration in seconds


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token."""
    refresh_token: str


class TokenVerifyResponse(BaseModel):
    """Response for token verification."""
    valid: bool
    user_id: str | None = None
    expires_at: int | None = None


class LogoutResponse(BaseModel):
    """Standard response for logout operations."""
    success: bool
    message: str
    devices_logged_out: Optional[int] = None


class CurrentUserInfo(BaseModel):
    """Current authenticated user's basic profile."""
    id: UUID
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None
