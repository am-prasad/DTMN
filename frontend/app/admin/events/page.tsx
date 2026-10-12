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
import type { EventCategory, EventListItem } from "@/types";

const schema = z.object({
  title: z.string().min(2, "Title is required").max(500),
  description: z.string().optional(),
  category_id: z.number().nullable().optional(),
  event_date: z.string().min(1, "Date is required"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  venue: z.string().optional(),
  registration_url: z.string().url().optional().or(z.literal("")),
  is_published: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<EventListItem>[] = [
  { key: "title", label: "Title" },
  {
    key: "category",
    label: "Category",
    render: (row) => row.category?.name || "—",
  },
  {
    key: "event_date",
    label: "Date",
    render: (row) => formatDate(row.event_date),
    className: "whitespace-nowrap",
  },
  {
    key: "venue",
    label: "Venue",
    render: (row) => row.venue || "—",
  },
  {
    key: "is_published",
    label: "Status",
    render: (row) => (
      <span className={`badge ${row.is_published ? "badge-green" : "badge-gray"}`}>
        {row.is_published ? "Published" : "Draft"}
      </span>
    ),
  },
];

function EventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventListItem | null>(null);
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
    setError(null);
    try {
      const [eventsData, catData] = await Promise.all([
        api.admin.listEvents(),
        api.admin.listEventCategories().catch(() => []),
      ]);
      setEvents(eventsData);
      setCategories(catData);
    } catch (e: any) {
      setError(e?.detail || "Failed to load events.");
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
      event_date: new Date().toISOString().slice(0, 10),
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (row: EventListItem) => {
    setEditing(row);
    reset({
      title: row.title,
      event_date: row.event_date,
      start_time: row.start_time || "",
      venue: row.venue || "",
      category_id: row.category?.id || null,
      is_published: row.is_published,
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
      if (editing) {
        await api.admin.updateEvent(editing.id, payload);
      } else {
        await api.admin.createEvent(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.detail || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: EventListItem) => {
    await api.admin.deleteEvent(row.id);
    await load();
  };

  return (
    <AdminShell title="Events">
      <AdminTable
        title="Events"
        description="Manage academic, sports, and cultural events."
        columns={COLUMNS}
        rows={events}
        loading={loading}
        error={error}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Event"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Event" : "Add Event"}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ev-title" className="form-label">
              Title *
            </label>
            <input id="ev-title" type="text" {...register("title")} className="form-input" />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="ev-desc" className="form-label">
              Description
            </label>
            <textarea id="ev-desc" rows={3} {...register("description")} className="form-textarea" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-date" className="form-label">
                Date *
              </label>
              <input id="ev-date" type="date" {...register("event_date")} className="form-input" />
              {errors.event_date && <p className="form-error">{errors.event_date.message}</p>}
            </div>
            <div>
              <label htmlFor="ev-cat" className="form-label">
                Category
              </label>
              <select
                id="ev-cat"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ev-venue" className="form-label">
                Venue
              </label>
              <input id="ev-venue" type="text" {...register("venue")} className="form-input" />
            </div>
            <div>
              <label htmlFor="ev-start" className="form-label">
                Start Time
              </label>
              <input id="ev-start" type="time" {...register("start_time")} className="form-input" />
            </div>
            <div>
              <label htmlFor="ev-end" className="form-label">
                End Time
              </label>
              <input id="ev-end" type="time" {...register("end_time")} className="form-input" />
            </div>
          </div>

          <div>
            <label htmlFor="ev-reg" className="form-label">
              Registration URL
            </label>
            <input id="ev-reg" type="url" {...register("registration_url")} className="form-input" />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ev-pub"
              type="checkbox"
              {...register("is_published")}
              className="h-4 w-4 rounded border-neutral-300 text-primary"
            />
            <label htmlFor="ev-pub" className="text-sm font-medium text-neutral-700">
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
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Loading events…</div>}>
      <EventsContent />
    </Suspense>
  );
}
