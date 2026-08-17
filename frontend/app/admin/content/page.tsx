"use client";

import { useState, useEffect } from "react";
import { Loader2, Pencil, CheckCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { SiteContent } from "@/types";

export default function AdminContentPage() {
  const [items, setItems] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SiteContent | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.content.list()); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item: SiteContent) => {
    setEditing(item);
    setValue(item.value || "");
    setSaveError(null);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true); setSaveError(null); setSaved(false);
    try {
      await api.admin.updateContent(editing.key, value);
      setSaved(true);
      setItems((prev) => prev.map((i) => i.key === editing.key ? { ...i, value } : i));
      setTimeout(() => { setEditing(null); setSaved(false); }, 800);
    } catch (e: any) {
      setSaveError(e?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // Group by group field
  const groups = Array.from(new Set(items.map((i) => i.group || "general")));

  return (
    <AdminShell title="Site Content">
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Site Content</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Edit placeholder text, contact info, and institutional content displayed on the website.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
        ) : (
          groups.map((group) => (
            <section key={group} className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-200 pb-1.5">
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </h3>
              {items.filter((i) => (i.group || "general") === group).map((item) => (
                <div key={item.key} className="card p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-neutral-500">{item.label || item.key}</div>
                    <div className="text-sm text-neutral-800 mt-1 line-clamp-2 whitespace-pre-line">{item.value || <span className="text-neutral-300 italic">Empty</span>}</div>
                  </div>
                  <button onClick={() => openEdit(item)} className="btn-ghost btn-sm flex-shrink-0">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              ))}
            </section>
          ))
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit: ${editing?.label || editing?.key}`}>
        <div className="space-y-4">
          <div>
            <label htmlFor="ct-value" className="form-label">{editing?.label || editing?.key}</label>
            {editing?.content_type === "html" ? (
              <textarea id="ct-value" rows={8} value={value} onChange={(e) => setValue(e.target.value)} className="form-textarea font-mono text-xs" />
            ) : (
              <textarea id="ct-value" rows={5} value={value} onChange={(e) => setValue(e.target.value)} className="form-textarea" />
            )}
            {editing?.content_type === "html" && (
              <p className="text-xs text-neutral-400 mt-1">HTML is allowed. Content is sanitised before display.</p>
            )}
          </div>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          {saved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" /> Saved successfully.
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}
