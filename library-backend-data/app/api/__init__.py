from fastapi import APIRouter
from .endpoints import search, content, documents, categories, users, content_library, file_serving

router = APIRouter()

# Flask Backend Compatible Endpoints
router.include_router(content_library.router, prefix="/content", tags=["content-library"])
router.include_router(file_serving.router, tags=["file-serving"])

# Original Library Server Endpoints
router.include_router(search.router, prefix="/v1/search", tags=["search"])
router.include_router(content.router, prefix="/v1/content", tags=["content"])
router.include_router(documents.router, prefix="/v1/documents", tags=["documents"])
router.include_router(categories.router, prefix="/v1/categories", tags=["categories"])
router.include_router(users.router, prefix="/v1/users", tags=["users"])