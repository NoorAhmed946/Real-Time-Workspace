"""Document-related Pydantic schemas."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models import DocumentRole


class DocumentCreate(BaseModel):
    """Schema for creating a new document."""
    title: str = Field(default="Untitled Document", max_length=500)
    description: Optional[str] = None
    is_public: bool = False


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata."""
    title: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None
    is_archived: Optional[bool] = None
    is_public: Optional[bool] = None


class DocumentRead(BaseModel):
    """Schema for reading document data (API responses)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    owner_id: UUID
    title: str
    description: Optional[str] = None
    is_archived: bool
    is_public: bool
    crdt_version: int
    created_at: datetime
    updated_at: datetime
    last_edited_at: Optional[datetime] = None


class DocumentPermissionCreate(BaseModel):
    """Schema for granting document permissions."""
    user_id: UUID
    role: DocumentRole = DocumentRole.VIEWER


class DocumentPermissionRead(BaseModel):
    """Schema for reading document permissions."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    document_id: UUID
    user_id: UUID
    role: DocumentRole
    granted_at: datetime
    granted_by_id: Optional[UUID] = None


class DocumentPermissionWithUser(DocumentPermissionRead):
    """Permission with embedded user info."""
    user_email: str
    user_display_name: str


class DocumentWithPermissions(DocumentRead):
    """Document with its permission list."""
    permissions: List[DocumentPermissionRead] = []
    user_role: Optional[DocumentRole] = None  # Current user's role


class DocumentListResponse(BaseModel):
    """Paginated document list response."""
    documents: List[DocumentRead]
    total: int
    page: int
    page_size: int
    has_more: bool
