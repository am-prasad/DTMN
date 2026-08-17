"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Images } from "lucide-react";
import { Lightbox } from "@/components/common/Lightbox";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/StateComponents";
import { getImageUrl } from "@/lib/api";
import type { GalleryAlbum } from "@/types";

export function GalleryAlbumClient({ album }: { album: GalleryAlbum }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        title={album.title}
        description={album.description || undefined}
        breadcrumbs={[{ label: "Gallery", href: "/gallery" }, { label: album.title }]}
      />

      <div className="section bg-white">
        <div className="container-site">
          {album.images.length === 0 ? (
            <EmptyState title="No images in this album yet" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {album.images.map((img, i) => {
                const url = getImageUrl(img.image_path);
                return (
                  <button
                    key={img.id}
                    className="relative aspect-square bg-neutral-100 rounded overflow-hidden group focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
                    onClick={() => setLightboxIndex(i)}
                    aria-label={img.caption || `Image ${i + 1}`}
                  >
                    {url ? (
                      <Image
                        src={url}
                        alt={img.caption || ""}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Images className="h-8 w-8 text-neutral-300" />
                      </div>
                    )}
                    {img.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.caption}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={album.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
