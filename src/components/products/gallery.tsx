"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  url: string;
  alt: string | null;
}

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div className="card flex aspect-square items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-6xl font-bold text-zinc-600">
        {productName.charAt(0)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card aspect-square overflow-hidden">
        <img
          src={active.url}
          alt={active.alt ?? productName}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border transition-colors",
                index === activeIndex
                  ? "border-amber-400"
                  : "border-zinc-800 hover:border-zinc-600",
              )}
            >
              <img
                src={image.url}
                alt={image.alt ?? `${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
