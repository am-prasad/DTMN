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
import type { EventListItem } from "@/types";

const schema = z.object({
  title: z.string().min(2).max(500),
  description: z.string().optional(),
  event_date: z.string().min(1, "Date required"),
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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false },
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.listEvents();
      setEvents(data);
    } catch (e: any) {
      setError(e?.detail || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ is_published: false });
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
      is_published: row.is_published,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        await api.admin.updateEvent(editing.id, data);
      } else {
        await api.admin.createEvent(data);
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Event" : "Add Event"}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ev-title" className="form-label">Title *</label>
            <input id="ev-title" type="text" {...register("title")} className="form-input" />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="ev-desc" className="form-label">Description</label>
            <textarea id="ev-desc" rows={3} {...register("description")} className="form-textarea" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-date" className="form-label">Date *</label>
              <input id="ev-date" type="date" {...register("event_date")} className="form-input" />
              {errors.event_date && <p className="form-error">{errors.event_date.message}</p>}
            </div>
            <div>
              <label htmlFor="ev-venue" className="form-label">Venue</label>
              <input id="ev-venue" type="text" {...register("venue")} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-start" className="form-label">Start Time</label>
              <input id="ev-start" type="time" {...register("start_time")} className="form-input" />
            </div>
            <div>
              <label htmlFor="ev-end" className="form-label">End Time</label>
              <input id="ev-end" type="time" {...register("end_time")} className="form-input" />
            </div>
          </div>
          <div>
            <label htmlFor="ev-reg" className="form-label">Registration URL</label>
            <input id="ev-reg" type="url" {...register("registration_url")} className="form-input" />
          </div>
          <div className="flex items-center gap-2">
            <input id="ev-pub" type="checkbox" {...register("is_published")} className="h-4 w-4 rounded border-neutral-300 text-primary" />
            <label htmlFor="ev-pub" className="text-sm font-medium text-neutral-700">Published</label>
          </div>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
