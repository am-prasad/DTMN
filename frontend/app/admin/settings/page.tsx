"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { CheckCircle, Lock } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

const schema = z.object({
  current_password: z.string().min(1, "Required"),
  new_password: z.string().min(12, "Minimum 12 characters"),
  confirm: z.string().min(1, "Required"),
}).refine((d) => d.new_password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/v1/auth/password/change", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.detail || "Failed to change password.");
      }
      setSaved(true);
      reset();
    } catch (e: any) {
      setServerError(e?.message || "Failed to change password. Please verify your current password.");
    }
  };

  return (
    <AdminShell title="Account Settings">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Change Password</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Use a strong, unique password of at least 12 characters.</p>
        </div>

        <div className="card p-6">
          {saved ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
              <h3 className="font-semibold text-neutral-900">Password updated</h3>
              <p className="text-sm text-neutral-500 mt-1">Your password has been changed successfully.</p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <Link href="/admin/dashboard" className="btn-primary btn-sm">
                  Go to Dashboard
                </Link>
                <button onClick={() => setSaved(false)} className="btn-secondary btn-sm">
                  Change Again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label htmlFor="st-cur" className="form-label">Current Password *</label>
                <input id="st-cur" type="password" {...register("current_password")} className="form-input" autoComplete="current-password" />
                {errors.current_password && <p className="form-error">{errors.current_password.message}</p>}
              </div>
              <div>
                <label htmlFor="st-new" className="form-label">New Password * (min 12 chars)</label>
                <input id="st-new" type="password" {...register("new_password")} className="form-input" autoComplete="new-password" />
                {errors.new_password && <p className="form-error">{errors.new_password.message}</p>}
              </div>
              <div>
                <label htmlFor="st-conf" className="form-label">Confirm New Password *</label>
                <input id="st-conf" type="password" {...register("confirm")} className="form-input" autoComplete="new-password" />
                {errors.confirm && <p className="form-error">{errors.confirm.message}</p>}
              </div>
              {serverError && <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700" role="alert">{serverError}</div>}
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
                <Lock className="h-4 w-4" />
                {isSubmitting ? "Updating…" : "Change Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
