"use client";

import React from "react";
import { Server, Plus, List, CreditCard, Box, Cpu } from "lucide-react";

interface SidebarProps {
  onNewChat: () => void;
  onQuickAction: (text: string) => void;
}

export function Sidebar({ onNewChat, onQuickAction }: SidebarProps) {
  return (
    <div className="w-64 bg-[#171717] h-full flex flex-col p-3 text-[#ececec] border-r border-[#3a3a3a] flex-shrink-0">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <Server className="text-[#10a37f]" size={24} />
        <span className="font-bold text-lg">Timeweb Manager</span>
      </div>

      <button
        onClick={onNewChat}
        className="flex items-center gap-2 w-full bg-[#2f2f2f] hover:bg-[#3a3a3a] text-sm font-medium py-2 px-3 rounded-lg transition-colors mb-6"
      >
        <Plus size={16} />
        Новый чат
      </button>

      <div className="flex flex-col gap-1 flex-1">
        <span className="text-xs font-semibold text-[#8e8ea0] px-2 mb-2">Быстрые действия</span>
        
        <button
          onClick={() => onQuickAction("Покажи все мои серверы")}
          className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-sm py-2 px-3 rounded-lg transition-colors text-left"
        >
          <List size={16} className="text-[#8e8ea0]" />
          Показать все серверы
        </button>
        
        <button
          onClick={() => onQuickAction("Какой у меня баланс?")}
          className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-sm py-2 px-3 rounded-lg transition-colors text-left"
        >
          <CreditCard size={16} className="text-[#8e8ea0]" />
          Мой баланс
        </button>

        <button
          onClick={() => onQuickAction("Какие есть тарифы?")}
          className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-sm py-2 px-3 rounded-lg transition-colors text-left"
        >
          <Box size={16} className="text-[#8e8ea0]" />
          Список тарифов
        </button>

        <button
          onClick={() => onQuickAction("Создай сервер Ubuntu 2GB")}
          className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-sm py-2 px-3 rounded-lg transition-colors text-left"
        >
          <Cpu size={16} className="text-[#8e8ea0]" />
          Создать сервер
        </button>
      </div>
    </div>
  );
}
