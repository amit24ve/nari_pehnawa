import os
from collections.abc import Iterator

from starlette.datastructures import Headers
from starlette.responses import FileResponse, Response, StreamingResponse
from starlette.staticfiles import StaticFiles


def parse_byte_range(value: str, size: int) -> tuple[int, int]:
    if size <= 0 or not value.startswith("bytes=") or "," in value:
        raise ValueError("Unsupported range")
    start_text, separator, end_text = value[6:].partition("-")
    if not separator:
        raise ValueError("Malformed range")
    if not start_text:
        suffix = int(end_text)
        if suffix <= 0:
            raise ValueError("Invalid suffix")
        return max(0, size - suffix), size - 1
    start = int(start_text)
    end = min(size - 1, int(end_text) if end_text else size - 1)
    if start < 0 or start >= size or end < start:
        raise ValueError("Unsatisfiable range")
    return start, end


def iter_file_range(path: str, start: int, end: int) -> Iterator[bytes]:
    remaining = end - start + 1
    with open(path, "rb") as stream:
        stream.seek(start)
        while remaining:
            chunk = stream.read(min(64 * 1024, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


class RangeStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: dict) -> Response:
        response = await super().get_response(path, scope)
        if not isinstance(response, FileResponse) or response.status_code != 200:
            return response

        response.headers.setdefault("Accept-Ranges", "bytes")
        response.headers.setdefault("Cache-Control", "public, max-age=86400")
        request_range = Headers(scope=scope).get("range")
        if not request_range or scope.get("method", "GET").upper() not in {"GET", "HEAD"}:
            return response

        size = os.path.getsize(response.path)
        try:
            start, end = parse_byte_range(request_range, size)
        except (TypeError, ValueError):
            return Response(status_code=416, headers={"Content-Range": f"bytes */{size}", "Accept-Ranges": "bytes"})

        headers = {
            "Accept-Ranges": "bytes",
            "Content-Range": f"bytes {start}-{end}/{size}",
            "Content-Length": str(end - start + 1),
            "Cache-Control": response.headers.get("Cache-Control", "public, max-age=86400"),
        }
        for name in ("etag", "last-modified"):
            if name in response.headers:
                headers[name] = response.headers[name]
        if scope.get("method", "GET").upper() == "HEAD":
            return Response(status_code=206, headers=headers, media_type=response.media_type)
        return StreamingResponse(
            iter_file_range(response.path, start, end),
            status_code=206,
            headers=headers,
            media_type=response.media_type,
        )
