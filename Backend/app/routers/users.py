"""
User profile routes.
"""
from typing import List

from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser, DbSession
from app.schemas.user import UserRead, UserUpdate
from app.services.auth import auth_service

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_my_profile(current_user: CurrentUser):
    """
    Get the current user's profile.
    """
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_my_profile(
    updates: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Update the current user's profile.
    
    Only display_name and avatar_url can be updated.
    Email is managed by Google OAuth.
    """
    if updates.display_name is not None:
        current_user.display_name = updates.display_name
    if updates.avatar_url is not None:
        current_user.avatar_url = updates.avatar_url
        
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.delete("/me")
async def deactivate_my_account(
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Deactivate the current user's account (soft delete).
    
    This will:
    - Mark the account as inactive
    - Revoke all refresh tokens
    
    Documents owned by the user will be preserved.
    """
    # Deactivate account
    current_user.is_active = False
    
    # Revoke all tokens
    await auth_service.revoke_all_user_tokens(db, current_user.id)
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Account deactivated successfully",
    }


@router.get("/{user_id}", response_model=UserRead)
async def get_user_profile(
    user_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Get a user's public profile by ID.
    
    Only returns basic public information.
    """
    from uuid import UUID
    
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    
    user = await auth_service.get_user_by_id(db, uid)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user
