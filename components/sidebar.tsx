"use client";

import React, { useState } from "react";
import {
  Server,
  Plus,
  Key,
  X,
  CreditCard,
  KeyRound,
  Shield,
  HardDrive,
  BarChart2,
  Zap,
  Globe,
  Database,
  Package,
  ShoppingBag,
  Container,
  Network,
  FolderKanban,
  AppWindow,
  ServerCog,
  Disc3,
  Cloud,
  Mail,
  Layers,
  ChevronDown,
  MessageSquare,
  Trash2,
} from "lucide-react";
import type { ChatSession } from "@/lib/chat-store";
import { relativeTime } from "@/lib/chat-store";

interface Action {
  label: string;
  message: string;
}

interface Category {
  icon: React.ReactNode;
  title: string;
  actions: Action[];
}

const CATEGORIES: Category[] = [
  {
    icon: <Server size={15} />,
    title: "Серверы",
    actions: [
      { label: "Список серверов", message: "Покажи мои серверы" },
      { label: "Создать сервер", message: "Создай сервер" },
      { label: "Доступные тарифы", message: "Покажи тарифы" },
      { label: "Список ОС", message: "Покажи список ОС" },
      { label: "Изменить конфигурацию", message: "Хочу изменить конфигурацию сервера" },
    ],
  },
  {
    icon: <ShoppingBag size={15} />,
    title: "Маркетплейс",
    actions: [
      { label: "Всё ПО", message: "Покажи ПО из маркетплейса" },
      { label: "Docker", message: "Создай сервер с Docker" },
      { label: "WordPress", message: "Создай сервер с WordPress" },
      { label: "GitLab", message: "Создай сервер с GitLab" },
      { label: "PostgreSQL", message: "Создай сервер с PostgreSQL" },
      { label: "Node.js", message: "Создай сервер с Node.js" },
      { label: "Nginx", message: "Создай сервер с Nginx" },
      { label: "Redis", message: "Создай сервер с Redis" },
    ],
  },
  {
    icon: <Zap size={15} />,
    title: "Действия",
    actions: [
      { label: "Перезагрузить", message: "Перезагрузи сервер" },
      { label: "Жёсткая перезагрузка", message: "Жёсткая перезагрузка сервера" },
      { label: "Запустить", message: "Запусти сервер" },
      { label: "Выключить", message: "Выключи сервер" },
      { label: "Удалить", message: "Удали сервер" },
      { label: "Сбросить пароль", message: "Сбрось пароль сервера" },
    ],
  },
  {
    icon: <BarChart2 size={15} />,
    title: "Мониторинг",
    actions: [
      { label: "Статистика сервера", message: "Покажи статистику сервера" },
    ],
  },
  {
    icon: <HardDrive size={15} />,
    title: "Бэкапы",
    actions: [
      { label: "Список бэкапов", message: "Покажи бэкапы сервера" },
      { label: "Создать бэкап", message: "Создай бэкап сервера" },
      { label: "Восстановить", message: "Восстанови сервер из бэкапа" },
    ],
  },
  {
    icon: <KeyRound size={15} />,
    title: "SSH-ключи",
    actions: [
      { label: "Список ключей", message: "Покажи мои SSH-ключи" },
      { label: "Добавить ключ", message: "Добавь SSH-ключ" },
      { label: "Удалить ключ", message: "Удали SSH-ключ" },
    ],
  },
  {
    icon: <Shield size={15} />,
    title: "Безопасность",
    actions: [
      { label: "Группы безопасности", message: "Покажи группы безопасности" },
      { label: "Создать группу", message: "Создай группу безопасности" },
      { label: "Добавить правило", message: "Добавь правило в группу безопасности" },
      { label: "Привязать к серверу", message: "Привяжи группу безопасности к серверу" },
    ],
  },
  {
    icon: <Container size={15} />,
    title: "Kubernetes",
    actions: [
      { label: "Кластеры", message: "Покажи мои кластеры Kubernetes" },
      { label: "Создать кластер", message: "Создай кластер Kubernetes" },
      { label: "Версии K8s", message: "Покажи доступные версии Kubernetes" },
    ],
  },
  {
    icon: <Network size={15} />,
    title: "Сеть",
    actions: [
      { label: "Балансировщики", message: "Покажи балансировщики нагрузки" },
      { label: "Плавающие IP", message: "Покажи плавающие IP" },
      { label: "VPC", message: "Покажи мои VPC" },
    ],
  },
  {
    icon: <FolderKanban size={15} />,
    title: "Проекты",
    actions: [
      { label: "Список проектов", message: "Покажи мои проекты" },
      { label: "Создать проект", message: "Создай проект" },
    ],
  },
  {
    icon: <AppWindow size={15} />,
    title: "Приложения",
    actions: [
      { label: "Список приложений", message: "Покажи мои приложения" },
      { label: "Запустить деплой", message: "Запусти деплой приложения" },
    ],
  },
  {
    icon: <ServerCog size={15} />,
    title: "Выделенные серверы",
    actions: [
      { label: "Список серверов", message: "Покажи выделенные серверы" },
    ],
  },
  {
    icon: <Globe size={15} />,
    title: "Домены",
    actions: [
      { label: "Список доменов", message: "Покажи мои домены" },
    ],
  },
  {
    icon: <Database size={15} />,
    title: "Базы данных",
    actions: [
      { label: "Список БД", message: "Покажи мои базы данных" },
      { label: "Создать БД", message: "Создай базу данных" },
    ],
  },
  {
    icon: <Package size={15} />,
    title: "Хранилище",
    actions: [
      { label: "S3-бакеты", message: "Покажи мои S3-бакеты" },
    ],
  },
  {
    icon: <Disc3 size={15} />,
    title: "Диски и образы",
    actions: [
      { label: "Сетевые диски", message: "Покажи сетевые диски" },
      { label: "Образы", message: "Покажи мои образы" },
    ],
  },
  {
    icon: <Cloud size={15} />,
    title: "Реестр контейнеров",
    actions: [
      { label: "Список реестров", message: "Покажи реестры контейнеров" },
    ],
  },
  {
    icon: <Mail size={15} />,
    title: "Почта",
    actions: [
      { label: "Почтовые домены", message: "Покажи почтовые домены" },
      { label: "Почтовые ящики", message: "Покажи почтовые ящики" },
    ],
  },
  {
    icon: <Layers size={15} />,
    title: "Прочее",
    actions: [
      { label: "Баланс", message: "Какой у меня баланс?" },
      { label: "Локации", message: "Покажи доступные локации" },
      { label: "API-ключи", message: "Покажи мои API-ключи" },
      { label: "Статус аккаунта", message: "Покажи статус аккаунта" },
      { label: "Уведомления", message: "Покажи настройки уведомлений" },
    ],
  },
];

interface SidebarProps {
  onAction: (text: string) => void;
  onNewChat: () => void;
  onChangeToken: () => void;
  onClose?: () => void;
  sessions?: ChatSession[];
  activeSessionId?: string | null;
  onSwitchSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

export function Sidebar({ onAction, onNewChat, onChangeToken, onClose, sessions, activeSessionId, onSwitchSession, onDeleteSession }: SidebarProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAction = (message: string) => {
    onAction(message);
    onClose?.();
  };

  const toggleCategory = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="w-64 bg-[#171717] h-full flex flex-col border-r border-[#2a2a2a] flex-shrink-0">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#10a37f]/15 rounded-lg flex items-center justify-center">
            <Server size={14} className="text-[#10a37f]" />
          </div>
          <span className="font-semibold text-sm text-[#ececec]">evolvin.cloud</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#2f2f2f] text-[#8e8ea0] hover:text-[#ececec] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Новый чат */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          onClick={() => { onNewChat(); onClose?.(); }}
          className="flex items-center gap-2 w-full bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Новый чат
        </button>
      </div>

      {/* История чатов */}
      {sessions && sessions.length > 0 && (
        <div className="px-2 pb-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-[#666] uppercase tracking-wider font-medium">
            <MessageSquare size={11} />
            История
          </div>
          <div className="max-h-48 overflow-y-auto sidebar-scroll">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                  activeSessionId === session.id
                    ? "bg-[#2a2a2a] text-[#ececec]"
                    : "text-[#a0a0b0] hover:text-[#ececec] hover:bg-[#232323]"
                }`}
                onClick={() => { onSwitchSession?.(session.id); onClose?.(); }}
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[13px]">{session.title}</div>
                  <div className="text-[11px] text-[#666]">{relativeTime(session.updatedAt)}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteSession?.(session.id); }}
                  className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#3a3a3a] text-[#666] hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="mx-2 my-1.5 border-b border-[#2a2a2a]" />
        </div>
      )}

      {/* Категории — скроллируемая область */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 py-1 sidebar-scroll">
        {CATEGORIES.map((cat, i) => (
          <div key={i} className="mb-0.5">
            <button
              onClick={() => toggleCategory(i)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                expandedIndex === i
                  ? "bg-[#2a2a2a] text-[#ececec]"
                  : "text-[#a0a0b0] hover:text-[#ececec] hover:bg-[#232323]"
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={`flex-shrink-0 ${expandedIndex === i ? "text-[#10a37f]" : ""}`}>
                  {cat.icon}
                </span>
                <span className="truncate">{cat.title}</span>
              </span>
              <ChevronDown
                size={12}
                className={`flex-shrink-0 text-[#555] transition-transform ${
                  expandedIndex === i ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedIndex === i && (
              <div className="ml-3 pl-4 border-l border-[#2a2a2a] mt-0.5 mb-1">
                {cat.actions.map((action, j) => (
                  <button
                    key={j}
                    onClick={() => handleAction(action.message)}
                    className="w-full text-left px-2 py-1.5 text-[12px] text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#252525] rounded-md transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Нижняя панель */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-[#2a2a2a]">
        <button
          onClick={() => { onChangeToken(); onClose?.(); }}
          className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-[13px] py-1.5 px-2.5 rounded-lg transition-colors text-[#8e8ea0] hover:text-[#ececec]"
        >
          <Key size={14} />
          Изменить API-ключ
        </button>
        <button
          onClick={() => { onAction("Какой у меня баланс?"); onClose?.(); }}
          className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-[13px] py-1.5 px-2.5 rounded-lg transition-colors text-[#8e8ea0] hover:text-[#ececec]"
        >
          <CreditCard size={14} />
          Баланс
        </button>
      </div>
    </div>
  );
}
