"""Invitation-related Pydantic schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import DocumentRole, InvitationStatus


class InvitationCreate(BaseModel):
    """Schema for creating a new invitation."""
    document_id: UUID
    invitee_email: EmailStr
    role: DocumentRole = DocumentRole.VIEWER
    message: Optional[str] = None


class InvitationRead(BaseModel):
    """Schema for reading invitation data."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    document_id: UUID
    invited_by_id: UUID
    invitee_email: str
    invitee_id: Optional[UUID] = None
    role: DocumentRole
    status: InvitationStatus
    message: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    responded_at: Optional[datetime] = None


class InvitationWithDetails(InvitationRead):
    """Invitation with document and inviter details."""
    document_title: str
    invited_by_name: str
    invited_by_email: str


class InvitationResponse(BaseModel):
    """Schema for responding to an invitation."""
    accept: bool  # True to accept, False to decline


class InvitationListResponse(BaseModel):
    """List of invitations."""
    invitations: list[InvitationRead]
    total: int
