"use client";

import React from "react";
import { Server, Plus, List, CreditCard, Box, Cpu, X, Key } from "lucide-react";

interface SidebarProps {
  onNewChat: () => void;
  onQuickAction: (text: string) => void;
  onClose?: () => void;
  onChangeToken?: () => void;
}

export function Sidebar({ onNewChat, onQuickAction, onClose, onChangeToken }: SidebarProps) {
  return (
    <div className="w-64 bg-[#171717] h-full flex flex-col p-3 text-[#ececec] border-r border-[#3a3a3a] flex-shrink-0">
      <div className="flex items-center justify-between px-2 py-3 mb-4">
        <div className="flex items-center gap-2">
          <Server className="text-[#10a37f]" size={24} />
          <span className="font-bold text-lg">evolvin.cloud</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-[#2f2f2f] text-[#8e8ea0] hover:text-[#ececec] transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <button
        onClick={() => {
          onNewChat();
          onClose?.();
        }}
        className="flex items-center gap-2 w-full bg-[#2f2f2f] hover:bg-[#3a3a3a] text-sm font-medium py-2 px-3 rounded-lg transition-colors mb-6"
      >
        <Plus size={16} />
        Новый чат
      </button>

      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <span className="text-xs font-semibold text-[#8e8ea0] px-2 mb-2">Быстрые действия</span>

        {[
          { icon: List, label: "Показать все серверы", action: "Покажи все мои серверы" },
          { icon: CreditCard, label: "Мой баланс", action: "Какой у меня баланс?" },
          { icon: Box, label: "Список тарифов", action: "Какие есть тарифы?" },
          { icon: Cpu, label: "Создать сервер", action: "Создай сервер" },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={action}
            onClick={() => {
              onQuickAction(action);
              onClose?.();
            }}
            className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-sm py-2 px-3 rounded-lg transition-colors text-left"
          >
            <Icon size={16} className="text-[#8e8ea0]" />
            {label}
          </button>
        ))}
      </div>

      {onChangeToken && (
        <div className="mt-auto pt-3 border-t border-[#3a3a3a]">
          <button
            onClick={() => {
              onChangeToken();
              onClose?.();
            }}
            className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-sm py-2 px-3 rounded-lg transition-colors text-left text-[#8e8ea0] hover:text-[#ececec]"
          >
            <Key size={16} />
            Изменить API-ключ
          </button>
        </div>
      )}
    </div>
  );
}
