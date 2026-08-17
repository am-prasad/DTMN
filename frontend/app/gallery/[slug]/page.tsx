import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { GalleryAlbumClient } from "./GalleryAlbumClient";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  try {
    const album = await api.gallery.getAlbum(params.slug);
    return { title: album.title, description: album.description };
  } catch {
    return { title: "Album Not Found" };
  }
}

export default async function GalleryAlbumPage({ params }: Props) {
  let album;
  try { album = await api.gallery.getAlbum(params.slug); } catch { notFound(); }
  return <GalleryAlbumClient album={album} />;
}
