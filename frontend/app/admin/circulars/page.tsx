"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Circular } from "@/types";

const CATEGORIES = ["general", "admissions", "examination", "holidays", "events", "academic", "administration"];

const schema = z.object({
  title: z.string().min(2).max(500),
  description: z.string().optional(),
  category: z.enum(["general", "admissions", "examination", "holidays", "events", "academic", "administration"]),
  is_published: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<Circular>[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category", render: (r) => <span className="badge badge-blue capitalize">{r.category}</span> },
  { key: "published_at", label: "Published", render: (r) => r.published_at ? formatDate(r.published_at, "d MMM yyyy") : "—", className: "whitespace-nowrap" },
  { key: "is_published", label: "Status", render: (r) => <span className={`badge ${r.is_published ? "badge-green" : "badge-gray"}`}>{r.is_published ? "Live" : "Draft"}</span> },
];

export default function AdminCircularsPage() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Circular | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "general", is_published: false },
  });

  const load = async () => {
    setLoading(true);
    try { setCirculars(await api.admin.listCirculars()); setError(null); }
    catch (e: any) { setError(e?.detail || "Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ category: "general", is_published: false }); setSaveError(null); setModalOpen(true); };
  const openEdit = (r: Circular) => { setEditing(r); reset({ title: r.title, description: r.description || "", category: r.category as any, is_published: r.is_published }); setSaveError(null); setModalOpen(true); };
  const onSubmit = async (data: FormData) => {
    setSaving(true); setSaveError(null);
    try {
      if (editing) await api.admin.updateCircular(editing.id, data);
      else await api.admin.createCircular(data);
      setModalOpen(false); await load();
    } catch (e: any) { setSaveError(e?.detail || "Failed to save."); }
    finally { setSaving(false); }
  };
  const handleDelete = async (r: Circular) => { await api.admin.deleteCircular(r.id); await load(); };

  return (
    <AdminShell title="Circulars">
      <AdminTable title="Circulars & Notices" description="Official announcements and downloadable circulars." columns={COLUMNS} rows={circulars} loading={loading} error={error} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Circular" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Circular" : "Add Circular"}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ci-title" className="form-label">Title *</label>
            <input id="ci-title" type="text" {...register("title")} className="form-input" />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="ci-desc" className="form-label">Description / Summary</label>
            <textarea id="ci-desc" rows={3} {...register("description")} className="form-textarea" />
          </div>
          <div>
            <label htmlFor="ci-cat" className="form-label">Category *</label>
            <select id="ci-cat" {...register("category")} className="form-select">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="ci-pub" type="checkbox" {...register("is_published")} className="h-4 w-4 rounded border-neutral-300" />
            <label htmlFor="ci-pub" className="text-sm font-medium text-neutral-700">Published</label>
          </div>
          <p className="text-xs text-neutral-400">To attach a PDF, use the "Upload Document" button after saving and update the circular with the returned path.</p>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? "Saving…" : editing ? "Save Changes" : "Create Circular"}</button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
