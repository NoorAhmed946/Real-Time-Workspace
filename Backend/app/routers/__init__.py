"""API routers."""
from .auth import router as auth_router
from .users import router as users_router
from .documents import router as documents_router
from .invitations import router as invitations_router
from .realtime import router as realtime_router

__all__ = [
    "auth_router",
    "users_router",
    "documents_router",
    "invitations_router",
    "realtime_router",
]
