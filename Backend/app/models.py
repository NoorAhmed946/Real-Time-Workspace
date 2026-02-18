
import enum
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func

class Base(DeclarativeBase):
    """Base class for all models with common configurations."""
    pass

# ENUMS
class DocumentRole(str, enum.Enum):
    """Role-Based Access Control roles for document permissions."""
    OWNER = "OWNER"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"


class InvitationStatus(str, enum.Enum):
    """Status tracking for document invitations."""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"



# TABLE 1: USERS
class User(Base):
    """
    Master user profile linked to Google OAuth 2.0.
    No local password storage - authentication exclusively via Google.
    """
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique user identifier (UUID v4)"
    )
    google_sub: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Google OAuth 'sub' claim - unique identifier from Google"
    )
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
        comment="User email address from Google profile"
    )
    display_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="User display name from Google profile"
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="URL to user's Google profile picture"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Soft-delete flag for account deactivation"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Account creation timestamp"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Last profile update timestamp"
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Most recent login timestamp"
    )

    # Relationships
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    permissions: Mapped[List["DocumentPermission"]] = relationship(
        "DocumentPermission",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    login_history: Mapped[List["LoginHistory"]] = relationship(
        "LoginHistory",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    invitations_sent: Mapped[List["Invitation"]] = relationship(
        "Invitation",
        foreign_keys="Invitation.invited_by_id",
        back_populates="invited_by",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    invitations_received: Mapped[List["Invitation"]] = relationship(
        "Invitation",
        foreign_keys="Invitation.invitee_id",
        back_populates="invitee",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"


# TABLE 2: DOCUMENTS
class Document(Base):
    """
    Document metadata and binary CRDT state storage.
    The crdt_state stores the serialized Y.Doc as a BYTEA blob.
    """
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique document identifier (UUID v4)"
    )
    owner_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Document owner (creator) foreign key"
    )
    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        default="Untitled Document",
        comment="Document title"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Optional document description"
    )
    crdt_state: Mapped[Optional[bytes]] = mapped_column(
        LargeBinary,
        nullable=True,
        comment="Binary CRDT state vector (Y.Doc serialized as Uint8Array)"
    )
    crdt_version: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="CRDT state version counter for conflict detection"
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Soft-delete flag for document archival"
    )
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Public access flag (anyone with link can view)"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Document creation timestamp"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Last modification timestamp"
    )
    last_edited_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last content edit timestamp (for activity tracking)"
    )

    # Relationships
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="documents",
        lazy="joined"
    )
    permissions: Mapped[List["DocumentPermission"]] = relationship(
        "DocumentPermission",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    invitations: Mapped[List["Invitation"]] = relationship(
        "Invitation",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Indexes for common query patterns
    __table_args__ = (
        Index("ix_documents_owner_archived", "owner_id", "is_archived"),
        Index("ix_documents_updated_at", "updated_at"),
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title={self.title})>"



# TABLE 3: DOCUMENT_PERMISSIONS
class DocumentPermission(Base):
    """
    RBAC engine for document access control.
    Defines user roles (OWNER, EDITOR, VIEWER) per document.
    """
    __tablename__ = "document_permissions"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique permission record identifier"
    )
    document_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Document foreign key"
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User foreign key"
    )
    role: Mapped[DocumentRole] = mapped_column(
        Enum(DocumentRole, name="document_role_enum"),
        nullable=False,
        default=DocumentRole.VIEWER,
        comment="User role for this document"
    )
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Permission grant timestamp"
    )
    granted_by_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="User who granted this permission"
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="permissions",
        lazy="joined"
    )
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="permissions",
        lazy="joined"
    )
    granted_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[granted_by_id],
        lazy="joined"
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("document_id", "user_id", name="uq_document_user_permission"),
        Index("ix_permissions_user_role", "user_id", "role"),
    )

    def __repr__(self) -> str:
        return f"<DocumentPermission(document={self.document_id}, user={self.user_id}, role={self.role})>"



# TABLE 4: REFRESH_TOKENS
class RefreshToken(Base):
    """
    Persistent session management for Google-authenticated users.
    Stores refresh tokens for maintaining long-lived sessions.
    """
    __tablename__ = "refresh_tokens"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique token record identifier"
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User foreign key"
    )
    token_hash: Mapped[str] = mapped_column(
        String(512),
        unique=True,
        nullable=False,
        index=True,
        comment="SHA-256 hash of the refresh token (never store plaintext)"
    )
    device_fingerprint: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Device/browser fingerprint for session tracking"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Browser user agent string"
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        INET,
        nullable=True,
        comment="IP address at token creation"
    )
    is_revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Token revocation flag"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Token creation timestamp"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        comment="Token expiration timestamp"
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last token usage timestamp"
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Token revocation timestamp"
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="refresh_tokens",
        lazy="joined"
    )

    # Indexes for token management
    __table_args__ = (
        Index("ix_refresh_tokens_user_active", "user_id", "is_revoked", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user={self.user_id}, revoked={self.is_revoked})>"


# TABLE 5: LOGIN_HISTORY
class LoginHistory(Base):
    """
    Security audit logs tracking all authentication events.
    Used for user location tracking and anomaly detection.
    """
    __tablename__ = "login_history"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique login record identifier"
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User foreign key"
    )
    login_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Login event timestamp"
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        INET,
        nullable=True,
        index=True,
        comment="Client IP address"
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Browser user agent string"
    )
    country_code: Mapped[Optional[str]] = mapped_column(
        String(3),
        nullable=True,
        comment="ISO 3166-1 alpha-2 country code from IP geolocation"
    )
    city: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="City from IP geolocation"
    )
    region: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Region/state from IP geolocation"
    )
    is_suspicious: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Flag for suspicious login attempts"
    )
    login_method: Mapped[str] = mapped_column(
        String(50),
        default="google_oauth",
        nullable=False,
        comment="Authentication method used"
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="login_history",
        lazy="joined"
    )

    # Indexes for security queries
    __table_args__ = (
        Index("ix_login_history_user_time", "user_id", "login_at"),
        Index("ix_login_history_suspicious", "is_suspicious", "login_at"),
    )

    def __repr__(self) -> str:
        return f"<LoginHistory(id={self.id}, user={self.user_id}, at={self.login_at})>"


# TABLE 6: INVITATIONS
class Invitation(Base):
    """
    Email-based pending invitations for document sharing.
    Supports inviting both existing users and new users via email.
    """
    __tablename__ = "invitations"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Unique invitation identifier"
    )
    document_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Document foreign key"
    )
    invited_by_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User who sent the invitation"
    )
    invitee_email: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        index=True,
        comment="Email address of the invitee"
    )
    invitee_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="User ID if invitee already has an account"
    )
    role: Mapped[DocumentRole] = mapped_column(
        Enum(DocumentRole, name="document_role_enum", create_type=False),
        nullable=False,
        default=DocumentRole.VIEWER,
        comment="Role to grant upon acceptance"
    )
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus, name="invitation_status_enum"),
        nullable=False,
        default=InvitationStatus.PENDING,
        index=True,
        comment="Current invitation status"
    )
    token_hash: Mapped[str] = mapped_column(
        String(512),
        unique=True,
        nullable=False,
        index=True,
        comment="SHA-256 hash of invitation token for secure link"
    )
    message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Optional personal message from inviter"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Invitation creation timestamp"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        comment="Invitation expiration timestamp"
    )
    responded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Invitation response timestamp"
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="invitations",
        lazy="joined"
    )
    invited_by: Mapped["User"] = relationship(
        "User",
        foreign_keys=[invited_by_id],
        back_populates="invitations_sent",
        lazy="joined"
    )
    invitee: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[invitee_id],
        back_populates="invitations_received",
        lazy="joined"
    )

    # Constraints and indexes
    __table_args__ = (
        Index(
            "uq_document_invitee_email_pending",
            "document_id", "invitee_email",
            unique=True,
            postgresql_where="status = 'PENDING'"
        ),
        Index("ix_invitations_pending_expiry", "status", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"<Invitation(id={self.id}, document={self.document_id}, email={self.invitee_email})>"
