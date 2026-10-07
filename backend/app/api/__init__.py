from fastapi import APIRouter

from app.api import admin
from app.api.public import router as public_router

api_router = APIRouter()
api_router.include_router(public_router)
api_router.include_router(admin.router)

__all__ = ["api_router"]
