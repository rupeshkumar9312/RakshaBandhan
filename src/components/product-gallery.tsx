"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CloseIcon, ChevronLeft, ChevronRight } from "@/components/icons";

type GalleryImage = { id: string; url: string; alt: string };

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-xl2 bg-cream-200 text-sm text-ink-muted">
        No image available
      </div>
    );
  }

  const current = images[active];
  const step = (delta: number) =>
    setActive((i) => (i + delta + images.length) % images.length);

  return (
    <>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar sm:flex-col sm:overflow-visible">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:size-20",
                  i === active
                    ? "border-maroon-700 shadow-[var(--shadow-soft)]"
                    : "border-cream-300 opacity-65 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main image — hover to zoom on desktop, tap to open lightbox */}
        <div
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(
              `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
            );
          }}
          onMouseLeave={() => setOrigin("50% 50%")}
          onClick={() => setLightbox(true)}
          className="group relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-xl2 border border-cream-300 bg-cream-200"
        >
          <Image
            src={current.url}
            alt={current.alt || productName}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 45vw"
            style={{ transformOrigin: origin }}
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-180"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 chip bg-ink/70 text-cream-50 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            Click to expand
          </span>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image viewer`}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-ink/92 p-4 backdrop-blur-sm"
        >
          <button
            onClick={() => setLightbox(false)}
            aria-label="Close viewer"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-cream-50 transition-colors hover:bg-white/20"
          >
            <CloseIcon className="size-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
                className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-cream-50 transition-colors hover:bg-white/20 sm:left-8"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
                className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-cream-50 transition-colors hover:bg-white/20 sm:right-8"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-square w-full max-w-3xl overflow-hidden rounded-xl2"
          >
            <Image
              src={current.url}
              alt={current.alt || productName}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          <p className="absolute bottom-6 text-sm text-cream-200/70 tabular-nums">
            {active + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
