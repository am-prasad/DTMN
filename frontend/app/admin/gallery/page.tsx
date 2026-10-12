"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { api, mediaUrl } from "@/lib/api";
import type { GalleryAlbumListItem, GalleryImage } from "@/types";

const schema = z.object({
  title: z.string().min(2, "Title is required").max(500),
  description: z.string().optional(),
  category: z.string().optional(),
  is_published: z.boolean(),
  sort_order: z.number().min(0).default(0),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<GalleryAlbumListItem>[] = [
  { key: "title", label: "Album Title" },
  { key: "category", label: "Category", render: (r) => r.category || "—" },
  { key: "image_count", label: "Photos" },
  {
    key: "is_published",
    label: "Status",
    render: (r) => (
      <span className={`badge ${r.is_published ? "badge-green" : "badge-gray"}`}>
        {r.is_published ? "Published" : "Draft"}
      </span>
    ),
  },
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryAlbumListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryAlbumListItem | null>(null);
  const [albumImages, setAlbumImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false, sort_order: 0 },
  });

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.admin.listAlbums());
      setError(null);
    } catch (e: any) {
      setError(e?.detail || "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setAlbumImages([]);
    reset({ is_published: false, sort_order: 0 });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = async (r: GalleryAlbumListItem) => {
    setEditing(r);
    setAlbumImages([]);
    reset({
      title: r.title,
      description: r.description || "",
      category: r.category || "",
      is_published: r.is_published,
      sort_order: 0,
    });
    setSaveError(null);
    setModalOpen(true);

    // Fetch album images
    setLoadingImages(true);
    try {
      const fullAlbum = await api.admin.getAlbum(r.id);
      setAlbumImages(fullAlbum.images || []);
    } catch {
      setAlbumImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleDelete = async (r: GalleryAlbumListItem) => {
    try {
      await api.admin.deleteAlbum(r.id);
      await load();
    } catch (e: any) {
      setError(e?.detail || "Failed to delete album.");
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    setSaveError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        await api.admin.uploadAlbumImage(editing.id, files[i]);
      }
      const full = await api.admin.getAlbum(editing.id);
      setAlbumImages(full.images || []);
      await load();
    } catch (err: any) {
      setSaveError(err?.detail || "Failed to upload photos.");
    } finally {
      setUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (imageId: number) => {
    try {
      await api.admin.deleteAlbumImage(imageId);
      setAlbumImages((prev) => prev.filter((img) => img.id !== imageId));
      await load();
    } catch (err: any) {
      setSaveError(err?.detail || "Failed to delete photo.");
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) await api.admin.updateAlbum(editing.id, data);
      else await api.admin.createAlbum(data);
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Gallery">
      <AdminTable
        title="Gallery Albums"
        description="Manage photo albums and upload images directly to albums."
        columns={COLUMNS}
        rows={items}
        loading={loading}
        error={error}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Album"
      />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Album: ${editing.title}` : "Add Album"}
        size="lg"
      >
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="ga-title" className="form-label">
                Album Title *
              </label>
              <input id="ga-title" type="text" {...register("title")} className="form-input" />
            </div>
            <div>
              <label htmlFor="ga-desc" className="form-label">
                Description
              </label>
              <textarea id="ga-desc" rows={3} {...register("description")} className="form-textarea" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ga-cat" className="form-label">
                  Category
                </label>
                <input
                  id="ga-cat"
                  type="text"
                  {...register("category")}
                  className="form-input"
                  placeholder="e.g. Events, Campus, Sports"
                />
              </div>
              <div>
                <label htmlFor="ga-sort" className="form-label">
                  Sort Order
                </label>
                <input
                  id="ga-sort"
                  type="number"
                  min={0}
                  {...register("sort_order", { valueAsNumber: true })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ga-pub"
                type="checkbox"
                {...register("is_published")}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="ga-pub" className="text-sm font-medium text-neutral-700">
                Published (Visible on website)
              </label>
            </div>
            {saveError && (
              <p className="form-error" role="alert">
                {saveError}
              </p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary btn-sm">
                {saving ? "Saving…" : editing ? "Save Details" : "Create Album"}
              </button>
            </div>
          </form>

          {/* Album Photos Section (Available when editing an album) */}
          {editing && (
            <div className="border-t border-neutral-200 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">
                    Album Photos ({albumImages.length})
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Upload images to this album. Supported formats: JPG, PNG, WebP.
                  </p>
                </div>
                <label className="btn-primary btn-sm cursor-pointer flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingPhotos ? "Uploading…" : "Upload Photos"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingPhotos}
                    onChange={handleUploadPhotos}
                    className="hidden"
                  />
                </label>
              </div>

              {loadingImages ? (
                <div className="flex items-center justify-center py-6 text-neutral-400 text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading photos…
                </div>
              ) : albumImages.length === 0 ? (
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center text-neutral-400 text-xs">
                  <ImageIcon className="h-8 w-8 mx-auto mb-1 text-neutral-300" />
                  No photos in this album yet. Click &ldquo;Upload Photos&rdquo; above to add images.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                  {albumImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl(img.image_path)}
                        alt={img.caption || "Album photo"}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(img.id)}
                        className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {img.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </AdminShell>
  );
}
