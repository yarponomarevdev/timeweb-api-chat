"use client";

import React, { useEffect } from "react";
import { X, RefreshCw } from "lucide-react";

interface QuickViewPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export function QuickViewPanel({
  title,
  isOpen,
  onClose,
  onRefresh,
  isLoading,
  error,
  children,
}: QuickViewPanelProps) {
  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex"
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      {/* Затемнение фона */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Панель — выезжает слева */}
      <div
        className="absolute left-0 top-0 h-full w-full sm:w-[400px] bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          boxShadow: isOpen ? "4px 0 32px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#2a2a2a] flex-shrink-0">
          <span className="font-semibold text-sm text-[#ececec]">{title}</span>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                onClick={() => onRefresh()}
                disabled={isLoading}
                className="p-2 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors disabled:opacity-40"
                title="Обновить"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-[#8e8ea0] text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Загрузка...
            </div>
          )}
          {!isLoading && error && (
            <div className="text-red-400 text-sm bg-[#2d1a1a] border border-[#5a2d2d] rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {!isLoading && !error && children}
        </div>
      </div>
    </div>
  );
}
