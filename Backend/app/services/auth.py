"""
Authentication service handling Google OAuth and JWT management.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import httpx
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import User, RefreshToken, LoginHistory

settings = get_settings()


class AuthService:
    """Service for authentication operations."""
    
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
    GOOGLE_SCOPES = [
        "openid",
        "email",
        "profile",
    ]

    # ==================
    # Token Utilities
    # ==================
    
    @staticmethod
    def hash_token(token: str) -> str:
        """SHA-256 hash for secure token storage."""
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def generate_refresh_token() -> str:
        """Generate cryptographically secure refresh token."""
        return secrets.token_urlsafe(64)

    @staticmethod
    def generate_state() -> str:
        """Generate OAuth state parameter for CSRF protection."""
        return secrets.token_urlsafe(32)

    # ==================
    # JWT Operations
    # ==================
    
    @staticmethod
    def create_access_token(user_id: UUID) -> tuple[str, datetime]:
        """
        Create a JWT access token.
        
        Returns:
            Tuple of (token_string, expiration_datetime)
        """
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_EXPIRATION_MINUTES
        )
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access"
        }
        token = jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return token, expire

    @staticmethod
    def decode_access_token(token: str) -> Optional[dict]:
        """
        Decode and validate a JWT access token.
        
        Returns:
            Token payload if valid, None if invalid/expired.
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            if payload.get("type") != "access":
                return None
            return payload
        except JWTError:
            return None

    # ==================
    # Google OAuth
    # ==================
    
    def get_google_auth_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL."""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(self.GOOGLE_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.GOOGLE_AUTH_URL}?{query_string}"

    async def exchange_google_code(self, code: str) -> dict:
        """
        Exchange Google authorization code for tokens.
        
        Args:
            code: Authorization code from Google callback.
            
        Returns:
            Dict containing access_token, refresh_token, etc.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            response.raise_for_status()
            return response.json()

    async def get_google_user_info(self, access_token: str) -> dict:
        """
        Fetch user profile from Google using access token.
        
        Returns:
            Dict with user info: sub, email, name, picture, etc.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            return response.json()

    # ==================
    # User Management
    # ==================
    
    async def get_or_create_user(
        self,
        db: AsyncSession,
        google_user: dict
    ) -> User:
        """
        Find existing user by Google sub or create new user.
        
        Args:
            db: Database session.
            google_user: User info from Google API.
            
        Returns:
            User model instance.
        """
        stmt = select(User).where(User.google_sub == google_user["sub"])
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            # Update last login
            user.last_login_at = datetime.now(timezone.utc)
            # Update profile info if changed
            user.email = google_user["email"]
            user.display_name = google_user.get("name", google_user["email"])
            user.avatar_url = google_user.get("picture")
        else:
            # Create new user
            user = User(
                google_sub=google_user["sub"],
                email=google_user["email"],
                display_name=google_user.get("name", google_user["email"]),
                avatar_url=google_user.get("picture"),
                last_login_at=datetime.now(timezone.utc),
            )
            db.add(user)

        await db.commit()
        await db.refresh(user)
        return user

    async def get_user_by_id(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Optional[User]:
        """Get user by ID."""
        stmt = select(User).where(User.id == user_id, User.is_active == True)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_email(
        self,
        db: AsyncSession,
        email: str
    ) -> Optional[User]:
        """Get user by email."""
        stmt = select(User).where(User.email == email, User.is_active == True)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    # ==================
    # Refresh Token Management
    # ==================
    
    async def create_refresh_token(
        self,
        db: AsyncSession,
        user_id: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_fingerprint: Optional[str] = None,
    ) -> str:
        """
        Create and store a new refresh token.
        
        Returns:
            The plaintext refresh token (store securely on client).
        """
        token = self.generate_refresh_token()
        token_hash = self.hash_token(token)
        
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint=device_fingerprint,
            expires_at=expires_at,
        )
        db.add(refresh_token)
        await db.commit()
        
        return token

    async def verify_refresh_token(
        self,
        db: AsyncSession,
        token: str
    ) -> Optional[RefreshToken]:
        """
        Verify a refresh token and return the token record if valid.
        """
        token_hash = self.hash_token(token)
        
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc)
        )
        result = await db.execute(stmt)
        refresh_token = result.scalar_one_or_none()
        
        if refresh_token:
            # Update last used timestamp
            refresh_token.last_used_at = datetime.now(timezone.utc)
            await db.commit()
            
        return refresh_token

    async def revoke_refresh_token(
        self,
        db: AsyncSession,
        token: str
    ) -> bool:
        """Revoke a refresh token."""
        token_hash = self.hash_token(token)
        
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash
        )
        result = await db.execute(stmt)
        refresh_token = result.scalar_one_or_none()
        
        if refresh_token:
            refresh_token.is_revoked = True
            refresh_token.revoked_at = datetime.now(timezone.utc)
            await db.commit()
            return True
            
        return False

    async def revoke_all_user_tokens(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> int:
        """Revoke all refresh tokens for a user. Returns count revoked."""
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        )
        result = await db.execute(stmt)
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            token.is_revoked = True
            token.revoked_at = datetime.now(timezone.utc)
            count += 1
            
        await db.commit()
        return count

    # ==================
    # Login History
    # ==================
    
    async def record_login(
        self,
        db: AsyncSession,
        user_id: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        country_code: Optional[str] = None,
        city: Optional[str] = None,
        region: Optional[str] = None,
        is_suspicious: bool = False,
    ) -> LoginHistory:
        """Record a login event for audit purposes."""
        login_record = LoginHistory(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            country_code=country_code,
            city=city,
            region=region,
            is_suspicious=is_suspicious,
            login_method="google_oauth",
        )
        db.add(login_record)
        await db.commit()
        return login_record


# Singleton instance
auth_service = AuthService()
