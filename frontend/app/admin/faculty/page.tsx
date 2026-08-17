"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { FacultyMember } from "@/types";

const SECTIONS = ["nursery", "primary", "high-school", "college"];

const schema = z.object({
  name: z.string().min(2).max(255),
  designation: z.string().min(2).max(255),
  qualification: z.string().optional(),
  experience_years: z.number().min(0).max(99).optional(),
  bio: z.string().optional(),
  institutional_email: z.string().email().optional().or(z.literal("")),
  section: z.enum(["nursery", "primary", "high-school", "college"]),
  sort_order: z.number().min(0).default(0),
  is_active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<FacultyMember>[] = [
  { key: "name", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "section", label: "Section", render: (r) => <span className="capitalize">{r.section.replace("-", " ")}</span> },
  { key: "experience_years", label: "Exp (yrs)", render: (r) => r.experience_years != null ? String(r.experience_years) : "—" },
  { key: "is_active", label: "Status", render: (r) => <span className={`badge ${r.is_active ? "badge-green" : "badge-gray"}`}>{r.is_active ? "Active" : "Inactive"}</span> },
];

export default function AdminFacultyPage() {
  const [items, setItems] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FacultyMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { section: "high-school", is_active: true, sort_order: 0 },
  });

  const load = async () => {
    setLoading(true);
    try { setItems(await api.admin.listFaculty()); setError(null); }
    catch (e: any) { setError(e?.detail || "Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ section: "high-school", is_active: true, sort_order: 0 }); setSaveError(null); setModalOpen(true); };
  const openEdit = (r: FacultyMember) => {
    setEditing(r);
    reset({ name: r.name, designation: r.designation, qualification: r.qualification || "", experience_years: r.experience_years ?? undefined, bio: r.bio || "", institutional_email: r.institutional_email || "", section: r.section as any, sort_order: r.sort_order, is_active: r.is_active });
    setSaveError(null); setModalOpen(true);
  };
  const onSubmit = async (data: FormData) => {
    setSaving(true); setSaveError(null);
    try {
      if (editing) await api.admin.updateFaculty(editing.id, data);
      else await api.admin.createFaculty(data);
      setModalOpen(false); await load();
    } catch (e: any) { setSaveError(e?.detail || "Failed to save."); }
    finally { setSaving(false); }
  };
  const handleDelete = async (r: FacultyMember) => { await api.admin.deleteFaculty(r.id); await load(); };

  return (
    <AdminShell title="Faculty">
      <AdminTable title="Faculty Directory" description="Manage teaching staff across all sections." columns={COLUMNS} rows={items} loading={loading} error={error} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Faculty Member" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Faculty Member" : "Add Faculty Member"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fa-name" className="form-label">Full Name *</label>
              <input id="fa-name" type="text" {...register("name")} className="form-input" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="fa-desg" className="form-label">Designation *</label>
              <input id="fa-desg" type="text" {...register("designation")} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fa-qual" className="form-label">Qualification</label>
              <input id="fa-qual" type="text" {...register("qualification")} className="form-input" />
            </div>
            <div>
              <label htmlFor="fa-exp" className="form-label">Years of Experience</label>
              <input id="fa-exp" type="number" min={0} max={99} {...register("experience_years", { valueAsNumber: true })} className="form-input" />
            </div>
          </div>
          <div>
            <label htmlFor="fa-bio" className="form-label">Short Bio</label>
            <textarea id="fa-bio" rows={3} {...register("bio")} className="form-textarea" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fa-email" className="form-label">Institutional Email</label>
              <input id="fa-email" type="email" {...register("institutional_email")} className="form-input" />
            </div>
            <div>
              <label htmlFor="fa-section" className="form-label">Section *</label>
              <select id="fa-section" {...register("section")} className="form-select">
                {SECTIONS.map((s) => <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fa-sort" className="form-label">Sort Order</label>
              <input id="fa-sort" type="number" min={0} {...register("sort_order", { valueAsNumber: true })} className="form-input" />
            </div>
            <div className="flex items-end pb-0.5">
              <div className="flex items-center gap-2">
                <input id="fa-active" type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-neutral-300" />
                <label htmlFor="fa-active" className="text-sm font-medium text-neutral-700">Active</label>
              </div>
            </div>
          </div>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? "Saving…" : editing ? "Save Changes" : "Add Faculty Member"}</button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
