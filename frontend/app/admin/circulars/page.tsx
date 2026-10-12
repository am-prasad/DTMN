"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { FileText } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Circular } from "@/types";

const CATEGORIES = [
  "general",
  "admissions",
  "examination",
  "holidays",
  "events",
  "academic",
  "administration",
];

const schema = z.object({
  title: z.string().min(2, "Title is required").max(500),
  description: z.string().optional(),
  category: z.enum([
    "general",
    "admissions",
    "examination",
    "holidays",
    "events",
    "academic",
    "administration",
  ]),
  published_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_published: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<Circular>[] = [
  { key: "title", label: "Title" },
  {
    key: "category",
    label: "Category",
    render: (r) => <span className="badge badge-blue capitalize">{r.category}</span>,
  },
  {
    key: "published_at",
    label: "Published",
    render: (r) => (r.published_at ? formatDate(r.published_at, "d MMM yyyy") : "—"),
    className: "whitespace-nowrap",
  },
  {
    key: "expires_at",
    label: "Expires",
    render: (r) => (r.expires_at ? formatDate(r.expires_at, "d MMM yyyy") : "—"),
    className: "whitespace-nowrap",
  },
  {
    key: "attachment_filename",
    label: "Attachment",
    render: (r) =>
      r.attachment_path ? (
        <a
          href={api.circulars.downloadUrl(r.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-xs flex items-center gap-1 font-medium"
        >
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate max-w-[120px]">{r.attachment_filename || "PDF"}</span>
        </a>
      ) : (
        <span className="text-neutral-300">—</span>
      ),
  },
  {
    key: "is_published",
    label: "Status",
    render: (r) => (
      <span className={`badge ${r.is_published ? "badge-green" : "badge-gray"}`}>
        {r.is_published ? "Live" : "Draft"}
      </span>
    ),
  },
];

function CircularsContent() {
  const searchParams = useSearchParams();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Circular | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [attachmentPath, setAttachmentPath] = useState("");
  const [attachmentFilename, setAttachmentFilename] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "general",
      published_at: todayStr,
      expires_at: "",
      is_published: true,
    },
  });

  const load = async () => {
    setLoading(true);
    try {
      setCirculars(await api.admin.listCirculars());
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

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openCreate();
    }
  }, [searchParams]);

  const openCreate = () => {
    setEditing(null);
    setAttachmentPath("");
    setAttachmentFilename("");
    reset({
      category: "general",
      published_at: todayStr,
      expires_at: "",
      is_published: true,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (r: Circular) => {
    setEditing(r);
    setAttachmentPath(r.attachment_path || "");
    setAttachmentFilename(r.attachment_filename || "");
    reset({
      title: r.title,
      description: r.description || "",
      category: r.category as any,
      published_at: r.published_at || todayStr,
      expires_at: r.expires_at || "",
      is_published: r.is_published,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setSaveError(null);
    try {
      const res = await api.upload.document(file);
      setAttachmentPath(res.path);
      setAttachmentFilename(res.filename || file.name);
    } catch (err: any) {
      setSaveError(err?.detail || "Failed to upload PDF.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...data,
        attachment_path: attachmentPath || undefined,
        attachment_filename: attachmentFilename || undefined,
        published_at: data.published_at || todayStr,
        expires_at: data.expires_at || undefined,
      };
      if (editing) await api.admin.updateCircular(editing.id, payload);
      else await api.admin.createCircular(payload);
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Circular) => {
    await api.admin.deleteCircular(r.id);
    await load();
  };

  return (
    <AdminShell title="Circulars">
      <AdminTable
        title="Circulars & Notices"
        description="Official announcements and downloadable circulars."
        columns={COLUMNS}
        rows={circulars}
        loading={loading}
        error={error}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Circular"
      />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Circular" : "Add Circular"}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ci-title" className="form-label">
              Title *
            </label>
            <input id="ci-title" type="text" {...register("title")} className="form-input" />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="ci-desc" className="form-label">
              Description / Summary
            </label>
            <textarea id="ci-desc" rows={3} {...register("description")} className="form-textarea" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="ci-cat" className="form-label">
                Category *
              </label>
              <select id="ci-cat" {...register("category")} className="form-select">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ci-pub-date" className="form-label">
                Publish Date *
              </label>
              <input
                id="ci-pub-date"
                type="date"
                {...register("published_at")}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="ci-exp-date" className="form-label">
                Expiry Date (Optional)
              </label>
              <input
                id="ci-exp-date"
                type="date"
                {...register("expires_at")}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">PDF Document Attachment (Optional)</label>
            {attachmentFilename ? (
              <div className="flex items-center justify-between p-2.5 rounded border border-neutral-200 bg-neutral-50 text-sm">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate text-xs font-medium text-neutral-800">{attachmentFilename}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentPath("");
                    setAttachmentFilename("");
                  }}
                  className="text-red-600 hover:text-red-800 text-xs font-medium ml-2 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={uploadingDoc}
                  onChange={handleDocUpload}
                  className="block w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-800 cursor-pointer"
                />
                {uploadingDoc && <p className="text-xs text-neutral-400 mt-1">Uploading PDF document…</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="ci-pub"
              type="checkbox"
              {...register("is_published")}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <label htmlFor="ci-pub" className="text-sm font-medium text-neutral-700">
              Published (Visible on website)
            </label>
          </div>

          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Circular"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}

export default function AdminCircularsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Loading circulars…</div>}>
      <CircularsContent />
    </Suspense>
  );
}
