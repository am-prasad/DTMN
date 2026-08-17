import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      <div className="mb-4 text-neutral-300">
        {icon || <AlertCircle className="h-10 w-10" />}
      </div>
      <h3 className="font-medium text-neutral-700">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading..." />
    </div>
  );
}

export function ErrorState({ message = "Something went wrong. Please try again." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}
