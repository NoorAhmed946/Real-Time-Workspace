"""
Document service handling CRUD operations and permissions.
"""
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Document, DocumentPermission, DocumentRole, User


class DocumentService:
    """Service for document operations."""

    # ==================
    # Document CRUD
    # ==================
    
    async def create_document(
        self,
        db: AsyncSession,
        owner_id: UUID,
        title: str = "Untitled Document",
        description: Optional[str] = None,
        is_public: bool = False,
    ) -> Document:
        """
        Create a new document and grant owner permission.
        """
        document = Document(
            owner_id=owner_id,
            title=title,
            description=description,
            is_public=is_public,
        )
        db.add(document)
        await db.flush()  # Get the document ID
        
        # Create owner permission
        owner_permission = DocumentPermission(
            document_id=document.id,
            user_id=owner_id,
            role=DocumentRole.OWNER,
            granted_by_id=owner_id,
        )
        db.add(owner_permission)
        
        await db.commit()
        await db.refresh(document)
        return document

    async def get_document_by_id(
        self,
        db: AsyncSession,
        document_id: UUID,
        include_archived: bool = False,
    ) -> Optional[Document]:
        """Get document by ID."""
        stmt = select(Document).where(Document.id == document_id)
        
        if not include_archived:
            stmt = stmt.where(Document.is_archived == False)
            
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_document_with_permissions(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> Optional[Document]:
        """Get document with all permissions loaded."""
        stmt = (
            select(Document)
            .options(selectinload(Document.permissions))
            .where(Document.id == document_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_document(
        self,
        db: AsyncSession,
        document: Document,
        title: Optional[str] = None,
        description: Optional[str] = None,
        is_archived: Optional[bool] = None,
        is_public: Optional[bool] = None,
    ) -> Document:
        """Update document metadata."""
        if title is not None:
            document.title = title
        if description is not None:
            document.description = description
        if is_archived is not None:
            document.is_archived = is_archived
        if is_public is not None:
            document.is_public = is_public
            
        await db.commit()
        await db.refresh(document)
        return document

    async def delete_document(
        self,
        db: AsyncSession,
        document: Document,
        soft_delete: bool = True,
    ) -> bool:
        """
        Delete a document.
        
        Args:
            soft_delete: If True, archive instead of hard delete.
        """
        if soft_delete:
            document.is_archived = True
            await db.commit()
        else:
            await db.delete(document)
            await db.commit()
        return True

    # ==================
    # Document Listing
    # ==================
    
    async def get_user_documents(
        self,
        db: AsyncSession,
        user_id: UUID,
        include_shared: bool = True,
        include_archived: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Document], int]:
        """
        Get documents accessible by a user.
        
        Returns:
            Tuple of (documents, total_count)
        """
        # Base condition: user owns the document OR has permission
        if include_shared:
            # Subquery for documents user has permissions to
            perm_subquery = (
                select(DocumentPermission.document_id)
                .where(DocumentPermission.user_id == user_id)
                .scalar_subquery()
            )
            condition = or_(
                Document.owner_id == user_id,
                Document.id.in_(perm_subquery)
            )
        else:
            condition = Document.owner_id == user_id
            
        # Build query
        stmt = select(Document).where(condition)
        
        if not include_archived:
            stmt = stmt.where(Document.is_archived == False)
            
        # Count total
        count_stmt = select(func.count()).select_from(
            stmt.subquery()
        )
        total_result = await db.execute(count_stmt)
        total = total_result.scalar()
        
        # Apply pagination and ordering
        stmt = stmt.order_by(Document.updated_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(stmt)
        documents = list(result.scalars().all())
        
        return documents, total

    async def search_documents(
        self,
        db: AsyncSession,
        user_id: UUID,
        query: str,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Document], int]:
        """Search documents by title or description."""
        search_term = f"%{query}%"
        
        # User must have access
        perm_subquery = (
            select(DocumentPermission.document_id)
            .where(DocumentPermission.user_id == user_id)
            .scalar_subquery()
        )
        
        stmt = select(Document).where(
            and_(
                or_(
                    Document.owner_id == user_id,
                    Document.id.in_(perm_subquery)
                ),
                Document.is_archived == False,
                or_(
                    Document.title.ilike(search_term),
                    Document.description.ilike(search_term)
                )
            )
        )
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar()
        
        # Paginate
        stmt = stmt.order_by(Document.updated_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(stmt)
        documents = list(result.scalars().all())
        
        return documents, total

    # ==================
    # Permission Management
    # ==================
    
    async def get_user_permission(
        self,
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> Optional[DocumentPermission]:
        """Get a user's permission for a document."""
        stmt = select(DocumentPermission).where(
            DocumentPermission.document_id == document_id,
            DocumentPermission.user_id == user_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_role(
        self,
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> Optional[DocumentRole]:
        """Get a user's role for a document."""
        permission = await self.get_user_permission(db, document_id, user_id)
        return permission.role if permission else None

    async def check_access(
        self,
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        required_role: DocumentRole = DocumentRole.VIEWER,
    ) -> bool:
        """
        Check if user has at least the required role.
        
        Role hierarchy: OWNER > EDITOR > VIEWER
        """
        role = await self.get_user_role(db, document_id, user_id)
        
        if role is None:
            # Check if document is public (viewer access)
            doc = await self.get_document_by_id(db, document_id)
            if doc and doc.is_public and required_role == DocumentRole.VIEWER:
                return True
            return False
            
        role_hierarchy = {
            DocumentRole.VIEWER: 1,
            DocumentRole.EDITOR: 2,
            DocumentRole.OWNER: 3,
        }
        
        return role_hierarchy.get(role, 0) >= role_hierarchy.get(required_role, 0)

    async def grant_permission(
        self,
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        role: DocumentRole,
        granted_by_id: UUID,
    ) -> DocumentPermission:
        """Grant or update permission for a user."""
        # Check if permission already exists
        existing = await self.get_user_permission(db, document_id, user_id)
        
        if existing:
            existing.role = role
            existing.granted_by_id = granted_by_id
            existing.granted_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            permission = DocumentPermission(
                document_id=document_id,
                user_id=user_id,
                role=role,
                granted_by_id=granted_by_id,
            )
            db.add(permission)
            await db.commit()
            await db.refresh(permission)
            return permission

    async def revoke_permission(
        self,
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> bool:
        """Revoke a user's permission. Cannot revoke owner."""
        permission = await self.get_user_permission(db, document_id, user_id)
        
        if not permission:
            return False
            
        # Cannot revoke owner permission
        if permission.role == DocumentRole.OWNER:
            return False
            
        await db.delete(permission)
        await db.commit()
        return True

    async def get_document_collaborators(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> List[DocumentPermission]:
        """Get all permissions for a document."""
        stmt = (
            select(DocumentPermission)
            .options(selectinload(DocumentPermission.user))
            .where(DocumentPermission.document_id == document_id)
            .order_by(DocumentPermission.granted_at)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    # ==================
    # CRDT State Management
    # ==================
    
    async def update_crdt_state(
        self,
        db: AsyncSession,
        document_id: UUID,
        crdt_state: bytes,
        expected_version: Optional[int] = None,
    ) -> Optional[Document]:
        """
        Update document CRDT state with optional optimistic locking.
        
        Args:
            expected_version: If provided, only update if current version matches.
            
        Returns:
            Updated document or None if version mismatch.
        """
        document = await self.get_document_by_id(db, document_id)
        
        if not document:
            return None
            
        if expected_version is not None and document.crdt_version != expected_version:
            return None  # Version conflict
            
        document.crdt_state = crdt_state
        document.crdt_version += 1
        document.last_edited_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(document)
        return document

    async def get_crdt_state(
        self,
        db: AsyncSession,
        document_id: UUID,
    ) -> Optional[Tuple[bytes, int]]:
        """
        Get document CRDT state and version.
        
        Returns:
            Tuple of (crdt_state, version) or None if not found.
        """
        document = await self.get_document_by_id(db, document_id)
        
        if not document:
            return None
            
        return document.crdt_state, document.crdt_version


# Singleton instance
document_service = DocumentService()
