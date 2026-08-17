"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import type { AuditLog } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = async (p: number) => {
    setLoading(true);
    try { setLogs(await api.admin.auditLogs(p)); setError(null); }
    catch (e: any) { setError(e?.detail || "Failed to load. (Super Admin only)"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  return (
    <AdminShell title="Audit Log">
      <div className="max-w-5xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Audit Log</h2>
          <p className="text-sm text-neutral-500 mt-0.5">All admin actions are recorded here. Accessible to Super Admin only.</p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
        ) : (
          <>
            <div className="table-container">
              <table className="table" aria-label="Audit log">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Resource</th>
                    <th>Result</th>
                    <th>IP</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-neutral-400 py-8">No audit records found.</td></tr>
                  )}
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="text-xs text-neutral-600">{log.user_email || "—"}</td>
                      <td className="text-xs text-neutral-600">
                        {log.resource_type ? `${log.resource_type}${log.resource_id ? ` #${log.resource_id}` : ""}` : "—"}
                      </td>
                      <td>
                        <span className={`badge ${log.result === "success" ? "badge-green" : "badge-red"}`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="text-xs font-mono text-neutral-400">{log.ip_address || "—"}</td>
                      <td className="text-xs text-neutral-500 whitespace-nowrap">
                        {formatDate(log.created_at, "d MMM yyyy, HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-3 justify-center">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-500">Page {page}</span>
              <button
                disabled={logs.length < 50}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
