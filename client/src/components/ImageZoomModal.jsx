import React, { useState, useRef, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ImageZoomModal — full-screen product image viewer with:
 *  - Zoom in / zoom out buttons (+ scroll wheel / pinch)
 *  - Drag to pan when zoomed in
 *  - Double-click / double-tap to toggle zoom
 *  - Prev/next arrows to move through all product images
 */
const ImageZoomModal = ({ images, activeIndex, onClose, onChangeIndex }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const MIN_SCALE = 1;
  const MAX_SCALE = 3.5;

  const resetView = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.5).toFixed(2)));
  const zoomOut = () =>
    setScale((s) => {
      const next = Math.max(MIN_SCALE, +(s - 0.5).toFixed(2));
      if (next === MIN_SCALE) setPos({ x: 0, y: 0 });
      return next;
    });

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handleDoubleClick = () => {
    if (scale > 1) resetView();
    else setScale(2);
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  };
  const handleMouseMove = (e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
  };
  const handleMouseUp = () => {
    dragState.current.dragging = false;
  };

  // Basic touch support (pinch handled by browser via touch-action, drag = single finger pan)
  const touchState = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const handleTouchStart = (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    touchState.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      origX: pos.x,
      origY: pos.y,
    };
  };
  const handleTouchMove = (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchState.current.startX;
    const dy = e.touches[0].clientY - touchState.current.startY;
    setPos({ x: touchState.current.origX + dx, y: touchState.current.origY + dy });
  };

  const goPrev = () => {
    resetView();
    onChangeIndex((activeIndex - 1 + images.length) % images.length);
  };
  const goNext = () => {
    resetView();
    onChangeIndex((activeIndex + 1) % images.length);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/70 text-sm font-medium">
          {activeIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-white/70 text-xs w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            disabled={scale === MIN_SCALE}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image viewport */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: scale > 1 ? "grab" : "zoom-in" }}
      >
        <img
          src={images[activeIndex]}
          alt={`Product view ${activeIndex + 1}`}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transitionDuration: dragState.current.dragging ? "0ms" : "150ms",
          }}
        />

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                resetView();
                onChangeIndex(i);
              }}
              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-white/40 text-[11px] pb-3 flex-shrink-0">
        Scroll or use +/− to zoom · Drag to pan · Double-tap to toggle zoom
      </p>
    </div>
  );
};

export default ImageZoomModal;
