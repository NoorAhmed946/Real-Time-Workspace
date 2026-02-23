"""
Authentication routes for Google OAuth 2.0.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies import CurrentUser, DbSession
from app.schemas.auth import (
    GoogleAuthURL,
    TokenResponse,
    RefreshTokenRequest,
)
from app.services.auth import auth_service

router = APIRouter()
settings = get_settings()


@router.get("/google/login", response_model=GoogleAuthURL)
async def google_login():
    """
    Get Google OAuth authorization URL.
    
    Returns the URL to redirect users to for Google login.
    """
    state = auth_service.generate_state()
    authorization_url = auth_service.get_google_auth_url(state)
    
    return GoogleAuthURL(
        authorization_url=authorization_url,
        state=state,
    )


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: Optional[str] = None,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth callback.
    
    Exchanges authorization code for tokens and creates/updates user.
    Returns JWT tokens for the authenticated user.
    """
    try:
        # Exchange code for Google tokens
        google_tokens = await auth_service.exchange_google_code(code)
        
        # Get user info from Google
        google_user = await auth_service.get_google_user_info(
            google_tokens["access_token"]
        )
        
        # Create or update user in database
        user = await auth_service.get_or_create_user(db, google_user)
        
        # Get client info for token storage
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
        
        # Create our JWT tokens
        access_token, expires = auth_service.create_access_token(user.id)
        refresh_token = await auth_service.create_refresh_token(
            db,
            user.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        # Record login for audit
        await auth_service.record_login(
            db,
            user.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_EXPIRATION_MINUTES * 60,
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with Google: {str(e)}",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: RefreshTokenRequest,
    db: DbSession,
):
    """
    Refresh access token using refresh token.
    
    Returns new access token (refresh token remains the same).
    """
    # Verify refresh token
    refresh_token_record = await auth_service.verify_refresh_token(
        db, request.refresh_token
    )
    
    if not refresh_token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # Create new access token
    access_token, expires = auth_service.create_access_token(
        refresh_token_record.user_id
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=request.refresh_token,
        expires_in=settings.JWT_EXPIRATION_MINUTES * 60,
    )


@router.post("/logout")
async def logout(
    request: RefreshTokenRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Logout by revoking the refresh token.
    """
    revoked = await auth_service.revoke_refresh_token(db, request.refresh_token)
    
    return {"success": revoked, "message": "Logged out successfully"}


@router.post("/logout/all")
async def logout_all_devices(
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Logout from all devices by revoking all refresh tokens.
    """
    count = await auth_service.revoke_all_user_tokens(db, current_user.id)
    
    return {
        "success": True,
        "message": f"Logged out from {count} devices",
        "devices_logged_out": count,
    }


@router.get("/me")
async def get_current_user_info(current_user: CurrentUser):
    """
    Get current authenticated user's information.
    """
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "display_name": current_user.display_name,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at.isoformat(),
        "last_login_at": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
    }
