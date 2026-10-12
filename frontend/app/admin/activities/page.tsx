"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Activity, ActivityCategory } from "@/types";

const schema = z.object({
  title: z.string().min(2, "Title is required").max(500),
  description: z.string().optional(),
  category_id: z.number().nullable().optional(),
  activity_date: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal("")),
  is_published: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<Activity>[] = [
  { key: "title", label: "Title" },
  {
    key: "category",
    label: "Category",
    render: (r) =>
      r.category ? (
        <span className="badge badge-blue">{r.category.name}</span>
      ) : (
        <span className="text-neutral-400">—</span>
      ),
  },
  {
    key: "activity_date",
    label: "Date",
    render: (r) => (r.activity_date ? formatDate(r.activity_date) : "—"),
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

function ActivitiesContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false, category_id: null },
  });

  const load = async () => {
    setLoading(true);
    try {
      const [actData, catData] = await Promise.all([
        api.admin.listActivities(),
        api.admin.listActivityCategories().catch(() => []),
      ]);
      setItems(actData);
      setCategories(catData);
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
    reset({
      is_published: false,
      category_id: categories.length > 0 ? categories[0].id : null,
      activity_date: new Date().toISOString().slice(0, 10),
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (r: Activity) => {
    setEditing(r);
    reset({
      title: r.title,
      description: r.description || "",
      category_id: r.category?.id || null,
      activity_date: r.activity_date || "",
      video_url: r.video_url || "",
      is_published: r.is_published,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...data,
        category_id: data.category_id ? Number(data.category_id) : null,
      };
      if (editing) await api.admin.updateActivity(editing.id, payload);
      else await api.admin.createActivity(payload);
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Activity) => {
    await api.admin.deleteActivity(r.id);
    await load();
  };

  return (
    <AdminShell title="Activities">
      <AdminTable
        title="Student Activities"
        description="Sports tournaments, cultural events, clubs, and student initiatives."
        columns={COLUMNS}
        rows={items}
        loading={loading}
        error={error}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Activity"
      />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Activity" : "Add Activity"}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ac-title" className="form-label">
              Title *
            </label>
            <input id="ac-title" type="text" {...register("title")} className="form-input" />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="ac-desc" className="form-label">
              Description
            </label>
            <textarea id="ac-desc" rows={3} {...register("description")} className="form-textarea" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ac-cat" className="form-label">
                Category
              </label>
              <select
                id="ac-cat"
                {...register("category_id", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
                className="form-select"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ac-date" className="form-label">
                Activity Date
              </label>
              <input
                id="ac-date"
                type="date"
                {...register("activity_date")}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ac-video" className="form-label">
              Video URL (YouTube/Vimeo)
            </label>
            <input id="ac-video" type="url" {...register("video_url")} className="form-input" />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ac-pub"
              type="checkbox"
              {...register("is_published")}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <label htmlFor="ac-pub" className="text-sm font-medium text-neutral-700">
              Published
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
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Activity"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}

export default function AdminActivitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Loading activities…</div>}>
      <ActivitiesContent />
    </Suspense>
  );
}
