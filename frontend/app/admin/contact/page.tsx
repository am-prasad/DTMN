"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, CheckCircle2, Trash2, Eye, RefreshCw } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Modal } from "@/components/admin/Modal";
import { api } from "@/lib/api";
import type { ContactSubmission } from "@/types";

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [activeMessage, setActiveMessage] = useState<ContactSubmission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const isReadParam = filter === "all" ? undefined : filter === "read";
      const data = await api.admin.listContactSubmissions(1, isReadParam);
      setMessages(data);
      setError(null);
    } catch (e: any) {
      setError(e?.detail || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const handleMarkRead = async (msg: ContactSubmission, isRead: boolean) => {
    setActionLoading(true);
    try {
      await api.admin.updateContactSubmission(msg.id, { is_read: isRead });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: isRead } : m))
      );
      if (activeMessage?.id === msg.id) {
        setActiveMessage({ ...activeMessage, is_read: isRead });
      }
    } catch (e: any) {
      alert(e?.detail || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (msg: ContactSubmission) => {
    if (!confirm(`Delete message from "${msg.name}"?`)) return;
    setActionLoading(true);
    try {
      await api.admin.deleteContactSubmission(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      if (activeMessage?.id === msg.id) {
        setActiveMessage(null);
      }
    } catch (e: any) {
      alert(e?.detail || "Failed to delete message.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell title="Contact Messages">
      <div className="max-w-5xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Contact Inbox</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Messages submitted through the public website contact form.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5 text-xs">
              {(["all", "unread", "read"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded font-medium capitalize transition-colors ${
                    filter === f ? "bg-primary text-white" : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={loadMessages}
              disabled={loading}
              className="btn-secondary btn-sm"
              title="Refresh inbox"
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
            <table className="table" aria-label="Contact submissions">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Sender</th>
                  <th>Contact</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-neutral-400 py-8">
                      No messages in this view.
                    </td>
                  </tr>
                )}
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    className={`cursor-pointer hover:bg-neutral-50/80 transition-colors ${
                      !m.is_read ? "font-medium bg-blue-50/30" : ""
                    }`}
                    onClick={() => setActiveMessage(m)}
                  >
                    <td>
                      <span className={`badge ${m.is_read ? "badge-gray" : "badge-blue"}`}>
                        {m.is_read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="text-neutral-900">{m.name}</td>
                    <td className="text-xs">
                      <div>{m.email}</div>
                      {m.phone && <div className="text-neutral-400">{m.phone}</div>}
                    </td>
                    <td className="text-neutral-900 max-w-xs truncate">{m.subject}</td>
                    <td className="text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setActiveMessage(m)}
                          className="p-1 text-neutral-500 hover:text-primary rounded"
                          title="View Message"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMarkRead(m, !m.is_read)}
                          className="p-1 text-neutral-500 hover:text-green-600 rounded"
                          title={m.is_read ? "Mark as unread" : "Mark as read"}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1 text-neutral-500 hover:text-red-600 rounded"
                          title="Delete message"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Message Detail Modal */}
        <Modal
          open={!!activeMessage}
          onClose={() => setActiveMessage(null)}
          title={activeMessage?.subject || "Message Details"}
        >
          {activeMessage && (
            <div className="space-y-4">
              <div className="bg-neutral-50 p-4 rounded-lg space-y-2 text-sm border border-neutral-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-neutral-900">{activeMessage.name}</span>
                    <div className="text-neutral-600">{activeMessage.email}</div>
                    {activeMessage.phone && (
                      <div className="text-neutral-500 text-xs">Phone: {activeMessage.phone}</div>
                    )}
                  </div>
                  <span className={`badge ${activeMessage.is_read ? "badge-gray" : "badge-blue"}`}>
                    {activeMessage.is_read ? "Read" : "Unread"}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 pt-1">
                  Received: {new Date(activeMessage.created_at).toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Message Content
                </h4>
                <div className="p-4 bg-white border border-neutral-200 rounded-lg text-neutral-800 text-sm whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {activeMessage.message}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(activeMessage)}
                  disabled={actionLoading}
                  className="btn-danger btn-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkRead(activeMessage, !activeMessage.is_read)}
                    disabled={actionLoading}
                    className="btn-secondary btn-sm"
                  >
                    {activeMessage.is_read ? "Mark Unread" : "Mark Read"}
                  </button>
                  <a
                    href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(
                      activeMessage.subject
                    )}`}
                    className="btn-primary btn-sm"
                  >
                    <Mail className="h-4 w-4 mr-1.5" />
                    Reply by Email
                  </a>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
