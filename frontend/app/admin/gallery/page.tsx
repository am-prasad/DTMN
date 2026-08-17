"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { GalleryAlbumListItem } from "@/types";

const schema = z.object({
  title: z.string().min(2).max(500),
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
  { key: "is_published", label: "Status", render: (r) => <span className={`badge ${r.is_published ? "badge-green" : "badge-gray"}`}>{r.is_published ? "Published" : "Draft"}</span> },
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryAlbumListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryAlbumListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false, sort_order: 0 },
  });

  const load = async () => {
    setLoading(true);
    try { setItems(await api.admin.listAlbums()); setError(null); }
    catch (e: any) { setError(e?.detail || "Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ is_published: false, sort_order: 0 }); setSaveError(null); setModalOpen(true); };
  const openEdit = (r: GalleryAlbumListItem) => { setEditing(r); reset({ title: r.title, description: r.description || "", category: r.category || "", is_published: r.is_published, sort_order: 0 }); setSaveError(null); setModalOpen(true); };
  const onSubmit = async (data: FormData) => {
    setSaving(true); setSaveError(null);
    try {
      if (editing) await api.admin.updateAlbum(editing.id, data);
      else await api.admin.createAlbum(data);
      setModalOpen(false); await load();
    } catch (e: any) { setSaveError(e?.detail || "Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <AdminShell title="Gallery">
      <AdminTable title="Gallery Albums" description="Manage photo albums. Use the upload tool to add images to albums." columns={COLUMNS} rows={items} loading={loading} error={error} onAdd={openCreate} onEdit={openEdit} addLabel="Add Album" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Album" : "Add Album"}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ga-title" className="form-label">Album Title *</label>
            <input id="ga-title" type="text" {...register("title")} className="form-input" />
          </div>
          <div>
            <label htmlFor="ga-desc" className="form-label">Description</label>
            <textarea id="ga-desc" rows={3} {...register("description")} className="form-textarea" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ga-cat" className="form-label">Category</label>
              <input id="ga-cat" type="text" {...register("category")} className="form-input" placeholder="e.g. Events, Campus" />
            </div>
            <div>
              <label htmlFor="ga-sort" className="form-label">Sort Order</label>
              <input id="ga-sort" type="number" min={0} {...register("sort_order", { valueAsNumber: true })} className="form-input" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="ga-pub" type="checkbox" {...register("is_published")} className="h-4 w-4 rounded border-neutral-300" />
            <label htmlFor="ga-pub" className="text-sm font-medium text-neutral-700">Published</label>
          </div>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? "Saving…" : editing ? "Save Changes" : "Create Album"}</button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
