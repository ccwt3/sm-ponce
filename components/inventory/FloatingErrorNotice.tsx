"use client";

import { AlertTriangle, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface FloatingErrorNoticeProps {
  message: string | null;
  onDismiss: () => void;
  className?: string;
}

export function FloatingErrorNotice({
  message,
  onDismiss,
  className,
}: FloatingErrorNoticeProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed right-4 top-4 z-[70] w-[calc(100vw-2rem)] max-w-md animate-fade-in rounded-md border border-brand-danger-border bg-background px-4 py-3 text-brand-danger shadow-modal sm:right-6 sm:top-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <p className="min-w-0 flex-1 text-sm font-medium leading-6">
          {message}
        </p>
        <button
          type="button"
          aria-label="Cerrar error"
          onClick={onDismiss}
          className="-mr-1 rounded p-1 text-brand-danger transition-colors hover:bg-brand-danger-hover-bg focus:outline-none focus:ring-1 focus:ring-brand-danger"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
