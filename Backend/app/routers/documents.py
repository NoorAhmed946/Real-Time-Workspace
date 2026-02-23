"""
Document CRUD and permission routes.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import (
    CurrentUser,
    DbSession,
    OptionalUser,
    require_viewer,
    require_editor,
    require_owner,
)
from app.models import DocumentRole
from app.schemas.document import (
    DocumentCreate,
    DocumentRead,
    DocumentUpdate,
    DocumentWithPermissions,
    DocumentPermissionCreate,
    DocumentPermissionRead,
    DocumentListResponse,
)
from app.services.document import document_service

router = APIRouter()


# ==================
# Document CRUD
# ==================

@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def create_document(
    document_data: DocumentCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Create a new document.
    
    The current user becomes the owner with full permissions.
    """
    document = await document_service.create_document(
        db,
        owner_id=current_user.id,
        title=document_data.title,
        description=document_data.description,
        is_public=document_data.is_public,
    )
    return document


@router.get("", response_model=DocumentListResponse)
async def list_my_documents(
    current_user: CurrentUser,
    db: DbSession,
    include_shared: bool = Query(True, description="Include documents shared with you"),
    include_archived: bool = Query(False, description="Include archived documents"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List documents accessible by the current user.
    
    Returns owned documents and optionally shared documents.
    """
    documents, total = await document_service.get_user_documents(
        db,
        user_id=current_user.id,
        include_shared=include_shared,
        include_archived=include_archived,
        page=page,
        page_size=page_size,
    )
    
    return DocumentListResponse(
        documents=[DocumentRead.model_validate(d) for d in documents],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/search", response_model=DocumentListResponse)
async def search_documents(
    current_user: CurrentUser,
    db: DbSession,
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Search documents by title or description.
    """
    documents, total = await document_service.search_documents(
        db,
        user_id=current_user.id,
        query=q,
        page=page,
        page_size=page_size,
    )
    
    return DocumentListResponse(
        documents=[DocumentRead.model_validate(d) for d in documents],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/{document_id}", response_model=DocumentWithPermissions)
async def get_document(
    document_id: UUID,
    current_user: OptionalUser,
    db: DbSession,
):
    """
    Get a document by ID.
    
    Public documents can be viewed without authentication.
    Private documents require viewer permission.
    """
    document = await document_service.get_document_with_permissions(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Check access
    user_role = None
    if current_user:
        user_role = await document_service.get_user_role(db, document_id, current_user.id)
    
    if not document.is_public and user_role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this document",
        )
    
    # Build response
    response = DocumentWithPermissions.model_validate(document)
    response.user_role = user_role
    response.permissions = [
        DocumentPermissionRead.model_validate(p) for p in document.permissions
    ]
    
    return response


@router.patch("/{document_id}", response_model=DocumentRead)
async def update_document(
    document_id: UUID,
    updates: DocumentUpdate,
    current_user: CurrentUser,
    db: DbSession,
    _: None = Depends(require_editor),
):
    """
    Update document metadata.
    
    Requires EDITOR or OWNER role.
    """
    document = await document_service.get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    updated = await document_service.update_document(
        db,
        document,
        title=updates.title,
        description=updates.description,
        is_archived=updates.is_archived,
        is_public=updates.is_public,
    )
    
    return updated


@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    permanent: bool = Query(False, description="Permanently delete instead of archive"),
    _: None = Depends(require_owner),
):
    """
    Delete (archive) a document.
    
    Requires OWNER role.
    Use permanent=true for hard delete.
    """
    document = await document_service.get_document_by_id(
        db, document_id, include_archived=True
    )
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    await document_service.delete_document(db, document, soft_delete=not permanent)
    
    return {
        "success": True,
        "message": "Document deleted permanently" if permanent else "Document archived",
    }


# ==================
# Permission Management
# ==================

@router.get("/{document_id}/permissions", response_model=list[DocumentPermissionRead])
async def list_document_permissions(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    _: None = Depends(require_viewer),
):
    """
    List all permissions for a document.
    """
    permissions = await document_service.get_document_collaborators(db, document_id)
    return [DocumentPermissionRead.model_validate(p) for p in permissions]


@router.post("/{document_id}/permissions", response_model=DocumentPermissionRead)
async def grant_permission(
    document_id: UUID,
    permission_data: DocumentPermissionCreate,
    current_user: CurrentUser,
    db: DbSession,
    _: None = Depends(require_owner),
):
    """
    Grant permission to a user.
    
    Requires OWNER role.
    """
    # Cannot grant OWNER role
    if permission_data.role == DocumentRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot grant OWNER role. Use transfer ownership instead.",
        )
    
    permission = await document_service.grant_permission(
        db,
        document_id=document_id,
        user_id=permission_data.user_id,
        role=permission_data.role,
        granted_by_id=current_user.id,
    )
    
    return DocumentPermissionRead.model_validate(permission)


@router.delete("/{document_id}/permissions/{user_id}")
async def revoke_permission(
    document_id: UUID,
    user_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    _: None = Depends(require_owner),
):
    """
    Revoke a user's permission.
    
    Requires OWNER role.
    Cannot revoke owner's permission.
    """
    revoked = await document_service.revoke_permission(db, document_id, user_id)
    
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke permission. User may be the owner or not have permission.",
        )
    
    return {"success": True, "message": "Permission revoked"}


# ==================
# CRDT State (for WebSocket sync)
# ==================

@router.get("/{document_id}/state")
async def get_document_state(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    _: None = Depends(require_viewer),
):
    """
    Get document CRDT state for initial sync.
    
    Returns the binary CRDT state encoded as base64.
    """
    import base64
    
    result = await document_service.get_crdt_state(db, document_id)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    crdt_state, version = result
    
    return {
        "document_id": str(document_id),
        "version": version,
        "state": base64.b64encode(crdt_state).decode() if crdt_state else None,
    }
