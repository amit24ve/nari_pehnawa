import time
import asyncio
import logging
from functools import wraps
from typing import Optional, Dict, Tuple, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger("api_cache")
logger.setLevel(logging.INFO)

# Global in-memory cache store
# Key: request_path_with_query_params
# Value: (cached_data, expiry_timestamp)
_cache_store: Dict[str, Tuple[Any, float]] = {}

def clear_api_cache():
    """Clear all cached API responses (called when admin modifies catalog data)"""
    _cache_store.clear()
    logger.info("API Cache cleared successfully")

def cache_response(expire_seconds: int = 300):
    """
    Decorator to cache FastAPI GET responses in-memory.
    Bypasses caching if Authorization header is present (e.g. admin requests)
    or if it's not a GET request.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Try to find Request parameter in kwargs or args
            request: Optional[Request] = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            # If request not present or not GET, skip cache
            if not request or request.method != "GET":
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                return func(*args, **kwargs)
                
            # If authorization header is present (admin or customer logged-in state), skip cache to serve fresh data
            if "authorization" in request.headers:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                return func(*args, **kwargs)
                
            # Create a unique cache key based on the URL path and query parameters
            cache_key = f"{request.url.path}?{request.url.query}"
            
            # Check if cache hit and not expired
            now = time.time()
            if cache_key in _cache_store:
                cached_data, expiry = _cache_store[cache_key]
                if now < expiry:
                    logger.debug("Cache hit for: %s", cache_key)
                    # Add X-Cache header to signify cache hit
                    headers = {"X-Cache": "HIT"}
                    return JSONResponse(content=cached_data, headers=headers)
            
            # Execute the original endpoint function
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # If the result is a standard dict, list, or Pydantic model response
            # we cache it. If it's a direct Response object, we cache its content if possible.
            try:
                serializable_data = None
                if isinstance(result, Response):
                    # We don't cache direct non-JSON responses
                    return result
                elif hasattr(result, "model_dump"):
                    # Pydantic v2
                    serializable_data = result.model_dump()
                elif hasattr(result, "dict"):
                    # Pydantic v1
                    serializable_data = result.dict()
                elif isinstance(result, (dict, list)):
                    serializable_data = result
                else:
                    # Let FastAPI handle serialization or fallback
                    serializable_data = result
                
                # Cache the JSON-serializable data
                if serializable_data is not None:
                    encoded_data = jsonable_encoder(serializable_data)
                    _cache_store[cache_key] = (encoded_data, now + expire_seconds)
                    logger.debug("Cached response for: %s", cache_key)
            except Exception as e:
                logger.warning("Failed to cache response for %s: %s", cache_key, e)
                
            return result
        return wrapper
    return decorator
