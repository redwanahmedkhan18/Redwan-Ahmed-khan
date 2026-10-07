from fastapi import APIRouter

from . import auth, dashboard, inbox, media, resources

router = APIRouter(prefix="/admin")
router.include_router(auth.router)
router.include_router(resources.router)
router.include_router(dashboard.router)
router.include_router(media.router)
router.include_router(inbox.router)

__all__ = ["router"]
