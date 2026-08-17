"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminShell from "@/components/admin/AdminShell";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { AdminUser } from "@/types";

const ROLES = ["content_admin", "admission_admin", "readonly"];

const createSchema = z.object({
  full_name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(12, "Minimum 12 characters"),
  role: z.enum(["content_admin", "admission_admin", "readonly"]),
});

const editSchema = z.object({
  full_name: z.string().min(2).max(255),
  role: z.enum(["content_admin", "admission_admin", "readonly"]),
  is_active: z.boolean(),
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

const COLUMNS: Column<AdminUser>[] = [
  { key: "full_name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role", render: (r) => <span className="badge badge-blue capitalize">{r.role.replace(/_/g, " ")}</span> },
  { key: "is_active", label: "Status", render: (r) => <span className={`badge ${r.is_active ? "badge-green" : "badge-red"}`}>{r.is_active ? "Active" : "Suspended"}</span> },
  { key: "mfa_enabled", label: "MFA", render: (r) => <span className={`badge ${r.mfa_enabled ? "badge-green" : "badge-gray"}`}>{r.mfa_enabled ? "Enabled" : "Disabled"}</span> },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const createForm = useForm<CreateData>({ resolver: zodResolver(createSchema), defaultValues: { role: "content_admin" } });
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) });

  const load = async () => {
    setLoading(true);
    try { setUsers(await api.admin.listUsers()); setError(null); }
    catch (e: any) { setError(e?.detail || "Failed to load. (Super Admin access required)"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onCreateSubmit = async (data: CreateData) => {
    setSaving(true); setSaveError(null);
    try { await api.admin.createUser(data); setCreateOpen(false); createForm.reset(); await load(); }
    catch (e: any) { setSaveError(e?.detail || "Failed to create user."); }
    finally { setSaving(false); }
  };

  const onEditSubmit = async (data: EditData) => {
    if (!editing) return;
    setSaving(true); setSaveError(null);
    try { await api.admin.updateUser(editing.id, data); setEditing(null); await load(); }
    catch (e: any) { setSaveError(e?.detail || "Failed to update user."); }
    finally { setSaving(false); }
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    editForm.reset({ full_name: u.full_name, role: u.role as any, is_active: u.is_active });
    setSaveError(null);
  };

  return (
    <AdminShell title="Users">
      <div className="max-w-5xl">
        <div className="mb-4 p-3 rounded bg-amber-50 border border-amber-200 text-sm text-amber-800">
          This page is accessible to Super Admin users only. New users are issued a temporary password and must change it on first login.
        </div>

        <AdminTable
          title="Admin Users"
          description="Manage staff accounts and access levels."
          columns={COLUMNS}
          rows={users}
          loading={loading}
          error={error}
          onAdd={() => { setSaveError(null); createForm.reset({ role: "content_admin" }); setCreateOpen(true); }}
          onEdit={openEdit}
          addLabel="Create User"
        />
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Admin User">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="usr-name" className="form-label">Full Name *</label>
            <input id="usr-name" type="text" {...createForm.register("full_name")} className="form-input" />
            {createForm.formState.errors.full_name && <p className="form-error">{createForm.formState.errors.full_name.message}</p>}
          </div>
          <div>
            <label htmlFor="usr-email" className="form-label">Email *</label>
            <input id="usr-email" type="email" {...createForm.register("email")} className="form-input" />
            {createForm.formState.errors.email && <p className="form-error">{createForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="usr-pw" className="form-label">Temporary Password * (min 12 chars)</label>
            <input id="usr-pw" type="password" {...createForm.register("password")} className="form-input" autoComplete="new-password" />
            {createForm.formState.errors.password && <p className="form-error">{createForm.formState.errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="usr-role" className="form-label">Role *</label>
            <select id="usr-role" {...createForm.register("role")} className="form-select">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
            </select>
          </div>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? "Creating…" : "Create User"}</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit: ${editing?.full_name}`}>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="form-label">Full Name</label>
            <input id="edit-name" type="text" {...editForm.register("full_name")} className="form-input" />
          </div>
          <div>
            <label htmlFor="edit-role" className="form-label">Role</label>
            <select id="edit-role" {...editForm.register("role")} className="form-select">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="edit-active" type="checkbox" {...editForm.register("is_active")} className="h-4 w-4 rounded border-neutral-300" />
            <label htmlFor="edit-active" className="text-sm font-medium text-neutral-700">Account Active</label>
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
