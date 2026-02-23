"""
Invitation routes for document sharing.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import CurrentUser, DbSession
from app.models import InvitationStatus
from app.schemas.invitation import (
    InvitationCreate,
    InvitationRead,
    InvitationResponse,
    InvitationWithDetails,
    InvitationListResponse,
)
from app.services.invitation import invitation_service
from app.services.document import document_service

router = APIRouter()


# ==================
# Send Invitations
# ==================

@router.post("", response_model=InvitationRead, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    invitation_data: InvitationCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Create a new invitation to share a document.
    
    Requires EDITOR or OWNER role on the document.
    """
    # Check if user can invite
    can_invite = await invitation_service.can_invite_to_document(
        db, invitation_data.document_id, current_user.id
    )
    
    if not can_invite:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to invite users to this document",
        )
    
    # Check if already a collaborator
    is_collaborator = await invitation_service.is_already_collaborator(
        db, invitation_data.document_id, invitation_data.invitee_email
    )
    
    if is_collaborator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a collaborator on this document",
        )
    
    # Can't invite yourself
    if invitation_data.invitee_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot invite yourself",
        )
    
    invitation = await invitation_service.create_invitation(
        db,
        document_id=invitation_data.document_id,
        invited_by_id=current_user.id,
        invitee_email=invitation_data.invitee_email,
        role=invitation_data.role,
        message=invitation_data.message,
    )
    
    return InvitationRead.model_validate(invitation)


# ==================
# View Invitations
# ==================

@router.get("/received", response_model=list[InvitationWithDetails])
async def get_my_invitations(
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Get all pending invitations received by the current user.
    """
    invitations = await invitation_service.get_pending_invitations_for_user(
        db, current_user.id, current_user.email
    )
    
    result = []
    for inv in invitations:
        inv_dict = InvitationWithDetails.model_validate(inv)
        inv_dict.document_title = inv.document.title if inv.document else "Unknown"
        inv_dict.invited_by_name = inv.invited_by.display_name if inv.invited_by else "Unknown"
        inv_dict.invited_by_email = inv.invited_by.email if inv.invited_by else "Unknown"
        result.append(inv_dict)
    
    return result


@router.get("/sent", response_model=InvitationListResponse)
async def get_sent_invitations(
    current_user: CurrentUser,
    db: DbSession,
    document_id: Optional[UUID] = Query(None, description="Filter by document"),
    status_filter: Optional[InvitationStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Get invitations sent by the current user.
    """
    invitations, total = await invitation_service.get_invitations_sent_by_user(
        db,
        user_id=current_user.id,
        document_id=document_id,
        status=status_filter,
        page=page,
        page_size=page_size,
    )
    
    return InvitationListResponse(
        invitations=[InvitationRead.model_validate(i) for i in invitations],
        total=total,
    )


@router.get("/{invitation_id}", response_model=InvitationWithDetails)
async def get_invitation(
    invitation_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Get invitation details.
    
    Only the inviter or invitee can view the invitation.
    """
    invitation = await invitation_service.get_invitation_with_details(db, invitation_id)
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    
    # Check access
    is_inviter = invitation.invited_by_id == current_user.id
    is_invitee = (
        invitation.invitee_id == current_user.id or
        invitation.invitee_email == current_user.email
    )
    
    if not is_inviter and not is_invitee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this invitation",
        )
    
    result = InvitationWithDetails.model_validate(invitation)
    result.document_title = invitation.document.title if invitation.document else "Unknown"
    result.invited_by_name = invitation.invited_by.display_name if invitation.invited_by else "Unknown"
    result.invited_by_email = invitation.invited_by.email if invitation.invited_by else "Unknown"
    
    return result


# ==================
# Respond to Invitations
# ==================

@router.post("/{invitation_id}/respond")
async def respond_to_invitation(
    invitation_id: UUID,
    response: InvitationResponse,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Accept or decline an invitation.
    """
    invitation = await invitation_service.get_invitation_by_id(db, invitation_id)
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    
    # Check if user is the invitee
    is_invitee = (
        invitation.invitee_id == current_user.id or
        invitation.invitee_email == current_user.email
    )
    
    if not is_invitee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is not for you",
        )
    
    # Check if already responded
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation has already been {invitation.status.value.lower()}",
        )
    
    if response.accept:
        permission = await invitation_service.accept_invitation(
            db, invitation, current_user.id
        )
        return {
            "success": True,
            "message": "Invitation accepted",
            "role": permission.role.value,
            "document_id": str(invitation.document_id),
        }
    else:
        await invitation_service.decline_invitation(db, invitation)
        return {
            "success": True,
            "message": "Invitation declined",
        }


@router.delete("/{invitation_id}")
async def cancel_invitation(
    invitation_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Cancel a pending invitation.
    
    Only the inviter can cancel.
    """
    invitation = await invitation_service.get_invitation_by_id(db, invitation_id)
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    
    # Check if user is the inviter
    if invitation.invited_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the inviter can cancel the invitation",
        )
    
    cancelled = await invitation_service.cancel_invitation(db, invitation)
    
    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel invitation. It may have already been responded to.",
        )
    
    return {"success": True, "message": "Invitation cancelled"}
