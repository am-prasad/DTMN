"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface AdminTableProps<T extends { id: number }> {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => Promise<void>;
  addLabel?: string;
}

export function AdminTable<T extends { id: number }>({
  title,
  description,
  columns,
  rows,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  addLabel = "Add New",
}: AdminTableProps<T>) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleDelete = useCallback(
    async (row: T) => {
      if (confirmId !== row.id) {
        setConfirmId(row.id);
        return;
      }
      setDeleting(row.id);
      setDeleteError(null);
      try {
        await onDelete!(row);
        setConfirmId(null);
      } catch (e: any) {
        setDeleteError(e?.detail || "Failed to delete. Please try again.");
      } finally {
        setDeleting(null);
      }
    },
    [confirmId, onDelete]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
        </div>
        {onAdd && (
          <button onClick={onAdd} className="btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {addLabel}
          </button>
        )}
      </div>

      {/* Error */}
      {(error || deleteError) && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error || deleteError}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" aria-label="Loading" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-neutral-400">No records found.</div>
        ) : (
          <table className="table" aria-label={title}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={col.className}>{col.label}</th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="w-20">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? "—")}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td>
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 rounded text-neutral-400 hover:text-primary hover:bg-primary-50 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deleting === row.id}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              confirmId === row.id
                                ? "text-red-600 bg-red-50 hover:bg-red-100"
                                : "text-neutral-400 hover:text-red-600 hover:bg-red-50"
                            )}
                            aria-label={confirmId === row.id ? "Confirm delete" : "Delete"}
                          >
                            {deleting === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        {confirmId === row.id && (
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs text-neutral-400 hover:text-neutral-600 px-1"
                            aria-label="Cancel delete"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
