"use client";

import React from "react";
import { Server, Plus, Wallet, LayoutList, KeyRound, BarChart2 } from "lucide-react";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  message: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Server size={20} />,
    title: "Мои серверы",
    description: "Список всех серверов",
    message: "Покажи все мои серверы",
  },
  {
    icon: <Plus size={20} />,
    title: "Создать сервер",
    description: "Новый VPS за пару шагов",
    message: "Создай сервер",
  },
  {
    icon: <Wallet size={20} />,
    title: "Баланс",
    description: "Текущий баланс аккаунта",
    message: "Какой у меня баланс?",
  },
  {
    icon: <LayoutList size={20} />,
    title: "Тарифы",
    description: "Доступные конфигурации",
    message: "Покажи тарифы",
  },
  {
    icon: <KeyRound size={20} />,
    title: "SSH-ключи",
    description: "Управление ключами",
    message: "Покажи мои SSH-ключи",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Статистика",
    description: "Мониторинг сервера",
    message: "Покажи статистику сервера",
  },
];

interface QuickActionsGridProps {
  onAction: (message: string) => void;
}

export function QuickActionsGrid({ onAction }: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-lg">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.message}
          onClick={() => onAction(action.message)}
          className="flex flex-col gap-2 p-4 bg-[#2a2a2a] hover:bg-[#313131] border border-[#3a3a3a] hover:border-[#10a37f]/40 rounded-2xl text-left transition-all group"
        >
          <span className="text-[#10a37f] group-hover:scale-110 transition-transform inline-block">
            {action.icon}
          </span>
          <div>
            <div className="text-sm font-semibold text-[#ececec] leading-tight">
              {action.title}
            </div>
            <div className="text-xs text-[#8e8ea0] mt-0.5 leading-tight">
              {action.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
