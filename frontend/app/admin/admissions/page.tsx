"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import type { AdmissionEnquiry } from "@/types";

export default function AdminAdmissionsPage() {
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.admin.listEnquiries();
        setEnquiries(data);
        setError(null);
      } catch (e: any) {
        setError(e?.detail || "Failed to load enquiries.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminShell title="Admissions">
      <div className="max-w-5xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Admission Enquiries</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Enquiries submitted through the admissions form.</p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="table-container">
            <table className="table" aria-label="Admission enquiries">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Parent</th>
                  <th>Contact</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-neutral-400 py-8">No enquiries yet.</td></tr>
                )}
                {enquiries.map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium text-neutral-900">{e.student_name}</td>
                    <td>{e.parent_name}</td>
                    <td className="text-xs">
                      <div>{e.email}</div>
                      <div className="text-neutral-400">{e.phone}</div>
                    </td>
                    <td><span className="badge badge-blue capitalize">{e.section.replace("-", " ")}</span></td>
                    <td><span className={`badge ${e.status === "new" ? "badge-amber" : e.status === "responded" ? "badge-green" : e.status === "closed" ? "badge-gray" : "badge-blue"}`}>{e.status}</span></td>
                    <td className="text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
