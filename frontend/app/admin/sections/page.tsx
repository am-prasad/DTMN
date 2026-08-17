"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { AcademicSection } from "@/types";
import { Pencil, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2).max(255),
  tagline: z.string().optional(),
  description: z.string().optional(),
  programs: z.string().optional(),
  curriculum: z.string().optional(),
  achievements: z.string().optional(),
  head_name: z.string().optional(),
  head_designation: z.string().optional(),
  head_message: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AcademicSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = async () => {
    setLoading(true);
    try { setSections(await api.sections.list()); }
    catch { setSections([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (s: AcademicSection) => {
    setEditing(s);
    reset({ name: s.name, tagline: s.tagline || "", description: s.description || "", programs: s.programs || "", curriculum: s.curriculum || "", achievements: s.achievements || "", head_name: s.head_name || "", head_designation: s.head_designation || "", head_message: s.head_message || "" });
    setSaveError(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!editing) return;
    setSaving(true); setSaveError(null);
    try { await api.admin.updateSection(editing.slug, data); setEditing(null); await load(); }
    catch (e: any) { setSaveError(e?.detail || "Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <AdminShell title="Academic Sections">
      <div className="space-y-4 max-w-4xl">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Academic Sections</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Edit each section's description, programs, and head's message.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="space-y-3">
            {sections.map((s) => (
              <div key={s.slug} className="card p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-neutral-900">{s.name}</div>
                  {s.tagline && <div className="text-sm text-neutral-500 mt-0.5">{s.tagline}</div>}
                </div>
                <button onClick={() => openEdit(s)} className="btn-secondary btn-sm flex-shrink-0">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit: ${editing?.name}`} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sec-name" className="form-label">Section Name *</label>
              <input id="sec-name" type="text" {...register("name")} className="form-input" />
            </div>
            <div>
              <label htmlFor="sec-tag" className="form-label">Tagline</label>
              <input id="sec-tag" type="text" {...register("tagline")} className="form-input" />
            </div>
          </div>
          <div>
            <label htmlFor="sec-desc" className="form-label">Description</label>
            <textarea id="sec-desc" rows={4} {...register("description")} className="form-textarea" />
          </div>
          <div>
            <label htmlFor="sec-prog" className="form-label">Programmes / Classes</label>
            <textarea id="sec-prog" rows={3} {...register("programs")} className="form-textarea" />
          </div>
          <div className="border-t border-neutral-200 pt-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Section Head</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sec-hname" className="form-label">Head Name</label>
                <input id="sec-hname" type="text" {...register("head_name")} className="form-input" />
              </div>
              <div>
                <label htmlFor="sec-hdesg" className="form-label">Head Designation</label>
                <input id="sec-hdesg" type="text" {...register("head_designation")} className="form-input" />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="sec-hmsg" className="form-label">Head's Message</label>
              <textarea id="sec-hmsg" rows={5} {...register("head_message")} className="form-textarea" />
            </div>
          </div>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
