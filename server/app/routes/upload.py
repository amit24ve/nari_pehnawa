"""
Image upload route — saves files to /uploads/ and serves via FastAPI StaticFiles.
"""

import os
import uuid
from pathlib import Path

from app.security import require_admin
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

router = APIRouter(prefix="/upload", tags=["Upload"])

# Directory relative to where uvicorn is started (server/)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}
MAX_SIZE_MB = 10


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
):
    """
    Upload an image file (JPEG / PNG / WebP / GIF).
    Returns { url, filename } where url is the public path to the image.
    """
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WebP, GIF.",
        )

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_SIZE_MB} MB.",
        )

    # Derive extension from mime type (safer than trusting filename)
    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
    }
    ext = ext_map.get(file.content_type, "jpg")
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / filename

    with open(dest, "wb") as f:
        f.write(content)

    return {
        "url": f"/uploads/{filename}",
        "filename": filename,
        "size_kb": round(len(content) / 1024, 1),
    }
