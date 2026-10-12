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
import type { Department, FacultyMember } from "@/types";

const SECTIONS = ["nursery", "primary", "high-school", "college"];

const schema = z.object({
  name: z.string().min(2, "Name is required").max(255),
  designation: z.string().min(2, "Designation is required").max(255),
  qualification: z.string().optional(),
  experience_years: z.number().min(0).max(99).optional(),
  bio: z.string().optional(),
  institutional_email: z.string().email().optional().or(z.literal("")),
  section: z.enum(["nursery", "primary", "high-school", "college"]),
  department_id: z.number().nullable().optional(),
  sort_order: z.number().min(0).default(0),
  is_active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const COLUMNS: Column<FacultyMember>[] = [
  { key: "name", label: "Name" },
  { key: "designation", label: "Designation" },
  {
    key: "section",
    label: "Section",
    render: (r) => <span className="capitalize">{r.section.replace("-", " ")}</span>,
  },
  {
    key: "department",
    label: "Department",
    render: (r) => r.department?.name || "—",
  },
  {
    key: "experience_years",
    label: "Exp (yrs)",
    render: (r) => (r.experience_years != null ? String(r.experience_years) : "—"),
  },
  {
    key: "is_active",
    label: "Status",
    render: (r) => (
      <span className={`badge ${r.is_active ? "badge-green" : "badge-gray"}`}>
        {r.is_active ? "Active" : "Inactive"}
      </span>
    ),
  },
];

function FacultyContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FacultyMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      section: "high-school",
      department_id: null,
      is_active: true,
      sort_order: 0,
    },
  });

  const selectedSection = watch("section");

  const load = async () => {
    setLoading(true);
    try {
      const [facultyData, deptData] = await Promise.all([
        api.admin.listFaculty(),
        api.admin.listDepartments().catch(() => []),
      ]);
      setItems(facultyData);
      setDepartments(deptData);
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
      section: "high-school",
      department_id: null,
      is_active: true,
      sort_order: 0,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (r: FacultyMember) => {
    setEditing(r);
    reset({
      name: r.name,
      designation: r.designation,
      qualification: r.qualification || "",
      experience_years: r.experience_years ?? undefined,
      bio: r.bio || "",
      institutional_email: r.institutional_email || "",
      section: r.section as any,
      department_id: r.department?.id || null,
      sort_order: r.sort_order,
      is_active: r.is_active,
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
        department_id: data.department_id ? Number(data.department_id) : null,
      };
      if (editing) await api.admin.updateFaculty(editing.id, payload);
      else await api.admin.createFaculty(payload);
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: FacultyMember) => {
    try {
      await api.admin.deleteFaculty(r.id);
      await load();
    } catch (e: any) {
      setError(e?.detail || "Failed to delete faculty member.");
    }
  };

  const filteredDepts = departments.filter((d) => !selectedSection || d.section === selectedSection);

  return (
    <AdminShell title="Faculty">
      <AdminTable
        title="Faculty & Staff"
        description="Manage teaching staff profiles across academic sections."
        columns={COLUMNS}
        rows={items}
        loading={loading}
        error={error}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Faculty Member"
      />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Faculty Member" : "Add Faculty Member"}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fa-name" className="form-label">
                Full Name *
              </label>
              <input id="fa-name" type="text" {...register("name")} className="form-input" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="fa-desig" className="form-label">
                Designation *
              </label>
              <input
                id="fa-desig"
                type="text"
                {...register("designation")}
                className="form-input"
                placeholder="e.g. Senior Teacher"
              />
              {errors.designation && <p className="form-error">{errors.designation.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fa-sec" className="form-label">
                Section *
              </label>
              <select id="fa-sec" {...register("section")} className="form-select">
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("-", " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fa-dept" className="form-label">
                Department
              </label>
              <select
                id="fa-dept"
                {...register("department_id", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
                className="form-select"
              >
                <option value="">No Department</option>
                {filteredDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.section})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fa-qual" className="form-label">
                Qualification
              </label>
              <input
                id="fa-qual"
                type="text"
                {...register("qualification")}
                className="form-input"
                placeholder="e.g. M.Sc. Physics, B.Ed."
              />
            </div>
            <div>
              <label htmlFor="fa-exp" className="form-label">
                Experience (Years)
              </label>
              <input
                id="fa-exp"
                type="number"
                min={0}
                max={60}
                {...register("experience_years", { valueAsNumber: true })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fa-email" className="form-label">
              Institutional Email
            </label>
            <input
              id="fa-email"
              type="email"
              {...register("institutional_email")}
              className="form-input"
              placeholder="faculty@institution.edu"
            />
          </div>

          <div>
            <label htmlFor="fa-bio" className="form-label">
              Short Biography
            </label>
            <textarea id="fa-bio" rows={3} {...register("bio")} className="form-textarea" />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center pt-1">
            <div>
              <label htmlFor="fa-sort" className="form-label">
                Sort Order
              </label>
              <input
                id="fa-sort"
                type="number"
                min={0}
                {...register("sort_order", { valueAsNumber: true })}
                className="form-input"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                id="fa-active"
                type="checkbox"
                {...register("is_active")}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="fa-active" className="text-sm font-medium text-neutral-700">
                Active Staff Member
              </label>
            </div>
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
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Faculty"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}

export default function AdminFacultyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Loading faculty…</div>}>
      <FacultyContent />
    </Suspense>
  );
}
