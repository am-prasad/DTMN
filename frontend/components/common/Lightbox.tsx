"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import type { GalleryImage } from "@/types";

interface LightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    // Trap scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const image = images[current];
  const imageUrl = getImageUrl(image.image_path);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={onClose}
    >
      {/* Content — stop propagation so clicking the image doesn't close */}
      <div
        className="relative flex items-center justify-center w-full h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Prev */}
        {images.length > 1 && (
          <button
            className="absolute left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <div className="relative max-w-5xl max-h-[85vh] w-full h-full mx-16 flex items-center justify-center">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={image.caption || `Image ${current + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          )}
        </div>

        {/* Next */}
        {images.length > 1 && (
          <button
            className="absolute right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Caption + counter */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          {image.caption && (
            <p className="text-white text-sm mb-1">{image.caption}</p>
          )}
          <p className="text-neutral-400 text-xs">
            {current + 1} / {images.length}
          </p>
        </div>
      </div>
    </div>
  );
}
