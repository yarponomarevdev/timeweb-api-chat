"use client";

import React, { useEffect } from "react";
import { Server, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  serverName: string;
  status: string;
  statusLabel: string;
  timestamp: number;
}

interface ServerNotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_TTL = 5000;

export function ServerNotificationToast({ toasts, onDismiss }: ServerNotificationToastProps) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      for (const t of toasts) {
        if (now - t.timestamp >= TOAST_TTL) onDismiss(t.id);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const color =
    toast.status === "on"
      ? "border-[#2d5a2d] bg-[#1a2a1a] text-green-300"
      : toast.status === "off"
      ? "border-[#5a2d2d] bg-[#2a1a1a] text-red-300"
      : "border-[#5a4a1a] bg-[#2a2318] text-yellow-300";

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${color} backdrop-blur-sm shadow-lg text-sm max-w-xs animate-in slide-in-from-right`}
    >
      <Server size={14} className="flex-shrink-0" />
      <span className="flex-1">
        <span className="font-medium">{toast.serverName}</span>
        {" — "}
        {toast.statusLabel}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}
