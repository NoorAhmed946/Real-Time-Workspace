"""
Invitation service handling document sharing invitations.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Invitation,
    InvitationStatus,
    Document,
    DocumentPermission,
    DocumentRole,
    User,
)


class InvitationService:
    """Service for invitation operations."""
    
    # Default invitation expiration (7 days)
    INVITATION_EXPIRE_DAYS = 7

    # ==================
    # Create Invitation
    # ==================
    
    async def create_invitation(
        self,
        db: AsyncSession,
        document_id: UUID,
        invited_by_id: UUID,
        invitee_email: str,
        role: DocumentRole = DocumentRole.VIEWER,
        message: Optional[str] = None,
        expire_days: int = None,
    ) -> Invitation:
        """
        Create a new invitation.
        
        If invitee is an existing user, links the invitation to their account.
        """
        expire_days = expire_days or self.INVITATION_EXPIRE_DAYS
        
        # Check if invitee is an existing user
        invitee_stmt = select(User).where(User.email == invitee_email)
        invitee_result = await db.execute(invitee_stmt)
        invitee = invitee_result.scalar_one_or_none()
        
        # Check for existing pending invitation
        existing_stmt = select(Invitation).where(
            Invitation.document_id == document_id,
            Invitation.invitee_email == invitee_email,
            Invitation.status == InvitationStatus.PENDING,
        )
        existing_result = await db.execute(existing_stmt)
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            # Update existing invitation
            existing.role = role
            existing.message = message
            existing.expires_at = datetime.now(timezone.utc) + timedelta(days=expire_days)
            existing.invited_by_id = invited_by_id
            await db.commit()
            await db.refresh(existing)
            return existing
        
        # Create new invitation
        invitation = Invitation(
            document_id=document_id,
            invited_by_id=invited_by_id,
            invitee_email=invitee_email,
            invitee_id=invitee.id if invitee else None,
            role=role,
            message=message,
            status=InvitationStatus.PENDING,
            expires_at=datetime.now(timezone.utc) + timedelta(days=expire_days),
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)
        return invitation

    # ==================
    # Get Invitations
    # ==================
    
    async def get_invitation_by_id(
        self,
        db: AsyncSession,
        invitation_id: UUID,
    ) -> Optional[Invitation]:
        """Get invitation by ID."""
        stmt = select(Invitation).where(Invitation.id == invitation_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_invitation_with_details(
        self,
        db: AsyncSession,
        invitation_id: UUID,
    ) -> Optional[Invitation]:
        """Get invitation with document and user details loaded."""
        stmt = (
            select(Invitation)
            .options(
                selectinload(Invitation.document),
                selectinload(Invitation.invited_by),
            )
            .where(Invitation.id == invitation_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_pending_invitations_for_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        user_email: str,
    ) -> List[Invitation]:
        """
        Get all pending invitations for a user.
        Matches by user_id or email (for pre-signup invitations).
        """
        stmt = (
            select(Invitation)
            .options(
                selectinload(Invitation.document),
                selectinload(Invitation.invited_by),
            )
            .where(
                Invitation.status == InvitationStatus.PENDING,
                Invitation.expires_at > datetime.now(timezone.utc),
                # Match by user_id or email
                ((Invitation.invitee_id == user_id) | (Invitation.invitee_email == user_email))
            )
            .order_by(Invitation.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_invitations_sent_by_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        document_id: Optional[UUID] = None,
        status: Optional[InvitationStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Invitation], int]:
        """Get invitations sent by a user with optional filters."""
        stmt = select(Invitation).where(Invitation.invited_by_id == user_id)
        
        if document_id:
            stmt = stmt.where(Invitation.document_id == document_id)
        if status:
            stmt = stmt.where(Invitation.status == status)
            
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar()
        
        # Paginate
        stmt = stmt.order_by(Invitation.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(stmt)
        invitations = list(result.scalars().all())
        
        return invitations, total

    async def get_document_invitations(
        self,
        db: AsyncSession,
        document_id: UUID,
        status: Optional[InvitationStatus] = None,
    ) -> List[Invitation]:
        """Get all invitations for a document."""
        stmt = select(Invitation).where(Invitation.document_id == document_id)
        
        if status:
            stmt = stmt.where(Invitation.status == status)
            
        stmt = stmt.order_by(Invitation.created_at.desc())
        
        result = await db.execute(stmt)
        return list(result.scalars().all())

    # ==================
    # Respond to Invitation
    # ==================
    
    async def accept_invitation(
        self,
        db: AsyncSession,
        invitation: Invitation,
        user_id: UUID,
    ) -> DocumentPermission:
        """
        Accept an invitation and grant document permission.
        
        Returns:
            The created DocumentPermission.
        """
        # Update invitation status
        invitation.status = InvitationStatus.ACCEPTED
        invitation.responded_at = datetime.now(timezone.utc)
        invitation.invitee_id = user_id
        
        # Create permission
        permission = DocumentPermission(
            document_id=invitation.document_id,
            user_id=user_id,
            role=invitation.role,
            granted_by_id=invitation.invited_by_id,
        )
        db.add(permission)
        
        await db.commit()
        await db.refresh(permission)
        return permission

    async def decline_invitation(
        self,
        db: AsyncSession,
        invitation: Invitation,
    ) -> Invitation:
        """Decline an invitation."""
        invitation.status = InvitationStatus.DECLINED
        invitation.responded_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(invitation)
        return invitation

    async def cancel_invitation(
        self,
        db: AsyncSession,
        invitation: Invitation,
    ) -> bool:
        """Cancel (delete) a pending invitation."""
        if invitation.status != InvitationStatus.PENDING:
            return False
            
        await db.delete(invitation)
        await db.commit()
        return True

    # ==================
    # Expiration Handling
    # ==================
    
    async def expire_old_invitations(
        self,
        db: AsyncSession,
    ) -> int:
        """
        Mark expired invitations as EXPIRED.
        
        Returns:
            Number of invitations expired.
        """
        stmt = select(Invitation).where(
            Invitation.status == InvitationStatus.PENDING,
            Invitation.expires_at <= datetime.now(timezone.utc),
        )
        result = await db.execute(stmt)
        invitations = result.scalars().all()
        
        count = 0
        for invitation in invitations:
            invitation.status = InvitationStatus.EXPIRED
            count += 1
            
        await db.commit()
        return count

    # ==================
    # Validation
    # ==================
    
    async def can_invite_to_document(
        self,
        db: AsyncSession,
        document_id: UUID,
        inviter_id: UUID,
    ) -> bool:
        """Check if user can invite others to a document (must be OWNER or EDITOR)."""
        from app.services.document import document_service
        
        role = await document_service.get_user_role(db, document_id, inviter_id)
        return role in (DocumentRole.OWNER, DocumentRole.EDITOR)

    async def is_already_collaborator(
        self,
        db: AsyncSession,
        document_id: UUID,
        email: str,
    ) -> bool:
        """Check if user with this email already has permission."""
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            return False
            
        perm_stmt = select(DocumentPermission).where(
            DocumentPermission.document_id == document_id,
            DocumentPermission.user_id == user.id,
        )
        perm_result = await db.execute(perm_stmt)
        return perm_result.scalar_one_or_none() is not None


# Singleton instance
invitation_service = InvitationService()
