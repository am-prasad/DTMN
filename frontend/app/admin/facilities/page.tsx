"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { Facility } from "@/types";

const schema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().min(0).default(0),
  is_active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<Facility>[] = [
  { key: "name", label: "Facility" },
  { key: "category", label: "Category", render: (r) => r.category || "—" },
  { key: "sort_order", label: "Order" },
  { key: "is_active", label: "Status", render: (r) => <span className={`badge ${r.is_active ? "badge-green" : "badge-gray"}`}>{r.is_active ? "Active" : "Hidden"}</span> },
];

export default function AdminFacilitiesPage() {
  const [items, setItems] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, sort_order: 0 },
  });

  const load = async () => {
    setLoading(true);
    try { setItems(await api.admin.listFacilities()); setError(null); }
    catch (e: any) { setError(e?.detail || "Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ is_active: true, sort_order: 0 }); setSaveError(null); setModalOpen(true); };
  const openEdit = (r: Facility) => { setEditing(r); reset({ name: r.name, description: r.description || "", category: r.category || "", icon: r.icon || "", sort_order: r.sort_order, is_active: r.is_active }); setSaveError(null); setModalOpen(true); };
  const onSubmit = async (data: FormData) => {
    setSaving(true); setSaveError(null);
    try {
      if (editing) await api.admin.updateFacility(editing.id, data);
      else await api.admin.createFacility(data);
      setModalOpen(false); await load();
    } catch (e: any) { setSaveError(e?.detail || "Failed to save."); }
    finally { setSaving(false); }
  };
  const handleDelete = async (r: Facility) => { await api.admin.deleteFacility(r.id); await load(); };

  return (
    <AdminShell title="Facilities">
      <AdminTable title="Facilities" description="Manage campus facilities displayed on the Facilities page." columns={COLUMNS} rows={items} loading={loading} error={error} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Facility" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Facility" : "Add Facility"}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="fc-name" className="form-label">Facility Name *</label>
            <input id="fc-name" type="text" {...register("name")} className="form-input" />
          </div>
          <div>
            <label htmlFor="fc-desc" className="form-label">Description</label>
            <textarea id="fc-desc" rows={3} {...register("description")} className="form-textarea" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fc-cat" className="form-label">Category</label>
              <input id="fc-cat" type="text" {...register("category")} className="form-input" placeholder="e.g. Academic, Sports" />
            </div>
            <div>
              <label htmlFor="fc-icon" className="form-label">Icon Name (lucide-react)</label>
              <input id="fc-icon" type="text" {...register("icon")} className="form-input" placeholder="e.g. BookOpen, Trophy" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fc-sort" className="form-label">Sort Order</label>
              <input id="fc-sort" type="number" min={0} {...register("sort_order", { valueAsNumber: true })} className="form-input" />
            </div>
            <div className="flex items-end pb-0.5">
              <div className="flex items-center gap-2">
                <input id="fc-active" type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-neutral-300" />
                <label htmlFor="fc-active" className="text-sm font-medium text-neutral-700">Active / Visible</label>
              </div>
            </div>
          </div>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? "Saving…" : editing ? "Save Changes" : "Add Facility"}</button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
