"""User-related Pydantic schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    display_name: str
    avatar_url: Optional[str] = None


class UserRead(UserBase):
    """Schema for reading user data (API responses)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserBrief(BaseModel):
    """Brief user info for embedding in other responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: EmailStr
    display_name: str
    avatar_url: Optional[str] = None
