"use client";

import React, { useState } from "react";
import {
  Server,
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
  LayoutGrid,
  Wrench,
  ChevronDown,
  Plus,
} from "lucide-react";

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
  onChangeToken: () => void;
  onClose?: () => void;
  onOpenServers?: () => void;
  onOpenBalance?: () => void;
  onOpenPresets?: () => void;
  onOpenToolLog?: () => void;
  toolStats?: { total: number; errorCount: number; pendingCount: number };
}

export function Sidebar({ onAction, onChangeToken, onClose, onOpenServers, onOpenBalance, onOpenPresets, onOpenToolLog, toolStats }: SidebarProps) {
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
          <span className="font-extrabold text-lg tracking-tight"><span className="text-[#10a37f]">evolvin</span><span className="text-[#ececec]">.cloud</span></span>
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

      {/* Быстрый доступ */}
      {(onOpenServers || onOpenBalance || onOpenPresets) && (
        <div className="px-2 pt-2 pb-1 flex-shrink-0 border-b border-[#2a2a2a]">
          {onOpenServers && (
            <button
              onClick={onOpenServers}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-[#a0a0b0] hover:text-[#ececec] hover:bg-[#232323] transition-colors"
            >
              <Server size={15} className="text-[#10a37f] flex-shrink-0" />
              Мои серверы
            </button>
          )}
          {onOpenBalance && (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenBalance}
                className="flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-[#a0a0b0] hover:text-[#ececec] hover:bg-[#232323] transition-colors"
              >
                <CreditCard size={15} className="text-[#10a37f] flex-shrink-0" />
                Баланс
              </button>
              <a
                href="https://timeweb.cloud/my/finances/payment"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[12px] text-[#10a37f] hover:text-white hover:bg-[#10a37f] border border-[#10a37f22] hover:border-[#10a37f] transition-colors flex-shrink-0"
                title="Пополнить баланс на Timeweb"
              >
                <Plus size={12} />
                Пополнить
              </a>
            </div>
          )}
          {onOpenPresets && (
            <button
              onClick={onOpenPresets}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-[#a0a0b0] hover:text-[#ececec] hover:bg-[#232323] transition-colors"
            >
              <LayoutGrid size={15} className="text-[#10a37f] flex-shrink-0" />
              Тарифы
            </button>
          )}
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
                className={`flex-shrink-0 text-[#8e8ea0] transition-transform ${
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
      <div className="flex-shrink-0 px-3 py-3 border-t border-[#2a2a2a] flex flex-col gap-0.5">
        {onOpenToolLog && (
          <button
            onClick={() => { onOpenToolLog(); onClose?.(); }}
            className="flex items-center justify-between w-full hover:bg-[#2f2f2f] text-[13px] py-1.5 px-2.5 rounded-lg transition-colors text-[#8e8ea0] hover:text-[#ececec]"
          >
            <span className="flex items-center gap-2">
              <Wrench size={14} />
              Журнал вызовов
            </span>
            {toolStats && toolStats.total > 0 && (
              <span className="flex items-center gap-1.5">
                {toolStats.errorCount > 0 && (
                  <span className="text-[11px] text-red-400 bg-[#2d1a1a] border border-[#5a2d2d] px-1.5 py-0.5 rounded-full">
                    {toolStats.errorCount} ошибок
                  </span>
                )}
                {toolStats.pendingCount > 0 && (
                  <span className="text-[11px] text-[#10a37f] animate-pulse">
                    {toolStats.pendingCount}…
                  </span>
                )}
                <span className="text-[11px] text-[#555] bg-[#2a2a2a] px-1.5 py-0.5 rounded-full">
                  {toolStats.total}
                </span>
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => { onChangeToken(); onClose?.(); }}
          className="flex items-center gap-2 w-full hover:bg-[#2f2f2f] text-[13px] py-1.5 px-2.5 rounded-lg transition-colors text-[#8e8ea0] hover:text-[#ececec]"
        >
          <Key size={14} />
          Изменить API-ключ
        </button>
      </div>
    </div>
  );
}
