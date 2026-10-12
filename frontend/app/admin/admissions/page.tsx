"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, MessageSquare, Save } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { AdmissionEnquiry } from "@/types";

const STATUS_OPTIONS = [
  { value: "new", label: "New", badge: "badge-amber" },
  { value: "reviewed", label: "Reviewed", badge: "badge-blue" },
  { value: "responded", label: "Responded", badge: "badge-green" },
  { value: "closed", label: "Closed", badge: "badge-gray" },
];

export default function AdminAdmissionsPage() {
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeEnquiry, setActiveEnquiry] = useState<AdmissionEnquiry | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalStatus, setModalStatus] = useState("new");
  const [saving, setSaving] = useState(false);

  const loadEnquiries = async () => {
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
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const handleStatusChange = async (enquiryId: number, newStatus: string) => {
    try {
      const updated = await api.admin.updateEnquiry(enquiryId, { status: newStatus });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status: updated.status } : e))
      );
      if (activeEnquiry?.id === enquiryId) {
        setActiveEnquiry({ ...activeEnquiry, status: updated.status });
      }
    } catch (e: any) {
      alert(e?.detail || "Failed to update status.");
    }
  };

  const openDetails = (e: AdmissionEnquiry) => {
    setActiveEnquiry(e);
    setModalStatus(e.status);
    setModalNotes(e.notes || "");
  };

  const handleSaveModal = async () => {
    if (!activeEnquiry) return;
    setSaving(true);
    try {
      const updated = await api.admin.updateEnquiry(activeEnquiry.id, {
        status: modalStatus,
        notes: modalNotes,
      });
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === activeEnquiry.id
            ? { ...e, status: updated.status, notes: updated.notes }
            : e
        )
      );
      setActiveEnquiry(null);
    } catch (e: any) {
      alert(e?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    if (statusFilter === "all") return true;
    return e.status === statusFilter;
  });

  return (
    <AdminShell title="Admissions">
      <div className="max-w-5xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Admission Enquiries</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Enquiries submitted through the admissions form.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-xs py-1.5"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={loadEnquiries}
              disabled={loading}
              className="btn-secondary btn-sm"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
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
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-neutral-400 py-8">
                      No enquiries found.
                    </td>
                  </tr>
                )}
                {filteredEnquiries.map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium text-neutral-900">{e.student_name}</td>
                    <td>{e.parent_name}</td>
                    <td className="text-xs">
                      <div>{e.email}</div>
                      <div className="text-neutral-400">{e.phone}</div>
                    </td>
                    <td>
                      <span className="badge badge-blue capitalize">
                        {e.section.replace("-", " ")}
                      </span>
                    </td>
                    <td>
                      <select
                        value={e.status}
                        onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                        className={`text-xs font-semibold rounded px-2 py-1 border transition-colors cursor-pointer ${
                          e.status === "new"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : e.status === "responded"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : e.status === "closed"
                            ? "bg-neutral-100 text-neutral-600 border-neutral-300"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => openDetails(e)}
                        className="btn-secondary btn-xs inline-flex items-center gap-1"
                        title="View details & admin notes"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Details & Notes Modal */}
        <Modal
          open={!!activeEnquiry}
          onClose={() => setActiveEnquiry(null)}
          title={`Enquiry: ${activeEnquiry?.student_name || ""}`}
        >
          {activeEnquiry && (
            <div className="space-y-4">
              <div className="bg-neutral-50 p-4 rounded-lg space-y-2 text-sm border border-neutral-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-neutral-500">Student Name:</span>
                    <div className="font-semibold text-neutral-900">{activeEnquiry.student_name}</div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500">Parent Name:</span>
                    <div className="font-semibold text-neutral-900">{activeEnquiry.parent_name}</div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500">Section:</span>
                    <div className="capitalize text-neutral-800">
                      {activeEnquiry.section.replace("-", " ")}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500">Submitted:</span>
                    <div className="text-neutral-800">
                      {new Date(activeEnquiry.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500">Email:</span>
                    <div>
                      <a href={`mailto:${activeEnquiry.email}`} className="text-primary hover:underline">
                        {activeEnquiry.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500">Phone:</span>
                    <div>
                      <a href={`tel:${activeEnquiry.phone}`} className="text-primary hover:underline">
                        {activeEnquiry.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {activeEnquiry.message && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Parent's Message
                  </h4>
                  <div className="p-3 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 whitespace-pre-wrap">
                    {activeEnquiry.message}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="modal-status" className="form-label">
                    Enquiry Status
                  </label>
                  <select
                    id="modal-status"
                    value={modalStatus}
                    onChange={(ev) => setModalStatus(ev.target.value)}
                    className="form-select"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-notes" className="form-label">
                    Internal Admin Notes
                  </label>
                  <textarea
                    id="modal-notes"
                    rows={3}
                    value={modalNotes}
                    onChange={(ev) => setModalNotes(ev.target.value)}
                    className="form-textarea"
                    placeholder="Record contact attempts, scheduled visits, or assessment outcome..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEnquiry(null)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={saving}
                  className="btn-primary btn-sm inline-flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
