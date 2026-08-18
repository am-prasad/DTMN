import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Images } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/StateComponents";
import { api, getImageUrl } from "@/lib/api";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo gallery of D T M N: campus, events, sports, cultural activities, and more.",
};

async function getAlbums() {
  try { return await api.gallery.listAlbums(); } catch { return []; }
}

export default async function GalleryPage() {
  const albums = await getAlbums();

  return (
    <>
      <PageHeader title="Gallery" description="Photographs from campus life, events, sports, and cultural activities." breadcrumbs={[{ label: "Gallery" }]} />

      <div className="section bg-white">
        <div className="container-site">
          {albums.length === 0 ? (
            <EmptyState title="Gallery is being updated" description="Photos will appear here soon." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albums.map((album) => {
                const coverUrl = getImageUrl(album.cover_image);
                return (
                  <Link key={album.id} href={`/gallery/${album.slug}`} className="card-hover group">
                    <div className="relative h-48 bg-neutral-100 overflow-hidden">
                      {coverUrl ? (
                        <Image src={coverUrl} alt={album.title} fill sizes="33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><Images className="h-10 w-10 text-neutral-300" /></div>
                      )}
                      {album.category && (
                        <div className="absolute top-3 left-3"><span className="badge badge-gray">{album.category}</span></div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">{album.title}</h3>
                      {album.description && <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{album.description}</p>}
                      <p className="text-xs text-neutral-400 mt-2">{album.image_count} {album.image_count === 1 ? "photo" : "photos"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
