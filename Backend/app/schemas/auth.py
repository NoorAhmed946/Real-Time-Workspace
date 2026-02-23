"""Authentication-related Pydantic schemas."""
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
