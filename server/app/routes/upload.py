"""
Image and Video upload route — saves files to /uploads/ and serves via FastAPI StaticFiles.
"""

import os
import uuid
from pathlib import Path

from typing import List
from app.security import get_current_user, require_admin
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

router = APIRouter(prefix="/upload", tags=["Upload"])

# Directory relative to where uvicorn is started (server/)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME = {
    # Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    # Videos
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
}
MAX_SIZE_MB = 100


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
):
    """
    Upload an image or video file.
    Returns { url, filename } where url is the public path to the file.
    """
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime.",
        )

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_SIZE_MB} MB.",
        )

    is_image = file.content_type in {"image/jpeg", "image/png", "image/webp", "image/avif"}
    
    if is_image:
        try:
            import io
            from PIL import Image, ImageOps
            
            img = Image.open(io.BytesIO(content))
            img = ImageOps.exif_transpose(img)
            
            # Downscale if excessively large (e.g. raw 4K/6K camera upload)
            max_dimension = 2560
            if img.width > max_dimension or img.height > max_dimension:
                img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                
            filename = f"{uuid.uuid4().hex}.webp"
            dest = UPLOAD_DIR / filename
            
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                img.save(dest, "WEBP", quality=85, method=6)
            else:
                img = img.convert("RGB")
                img.save(dest, "WEBP", quality=85, method=6)
                
            file_size_kb = round(dest.stat().st_size / 1024, 1)
            return {
                "url": f"/api/uploads/{filename}",
                "filename": filename,
                "size_kb": file_size_kb,
            }
        except Exception as e:
            # Fallback to direct write if Pillow cannot process
            pass

    # Derive extension from mime type (safer than trusting filename)
    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/ogg": "ogg",
        "video/quicktime": "mov",
    }
    ext = ext_map.get(file.content_type, "jpg")
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / filename

    with open(dest, "wb") as f:
        f.write(content)

    return {
        "url": f"/api/uploads/{filename}",
        "filename": filename,
        "size_kb": round(len(content) / 1024, 1),
    }


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(require_admin),
):
    """
    Upload multiple product images at once.
    Returns { "urls": [ ... ] }
    """
    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/ogg": "ogg",
        "video/quicktime": "mov",
    }
    saved_urls = []
    for file in files:
        if file.content_type not in ALLOWED_MIME:
            continue
        content = await file.read()
        if len(content) > MAX_SIZE_MB * 1024 * 1024:
            continue
        ext = ext_map.get(file.content_type, "jpg")
        filename = f"{uuid.uuid4().hex}.{ext}"
        dest = UPLOAD_DIR / filename
        with open(dest, "wb") as f:
            f.write(content)
        saved_urls.append(f"/api/uploads/{filename}")

    return {"urls": saved_urls}


@router.post("/review-image")
async def upload_review_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Customer upload photo for product reviews."""
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Please upload JPG, PNG, or WebP.",
        )

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image too large. Maximum size is 15 MB.",
        )

    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
    }
    ext = ext_map.get(file.content_type, "jpg")
    filename = f"rev_{uuid.uuid4().hex[:12]}.{ext}"
    dest = UPLOAD_DIR / filename

    with open(dest, "wb") as f:
        f.write(content)

    return {
        "url": f"/uploads/{filename}",
        "filename": filename,
        "size_kb": round(len(content) / 1024, 1),
    }
