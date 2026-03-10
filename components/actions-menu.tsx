"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  Server,
  CreditCard,
  KeyRound,
  Shield,
  HardDrive,
  BarChart2,
  Zap,
  Globe,
  Database,
  Package,
  ChevronRight,
  Container,
  Network,
  Cloud,
  Layers,
  FolderKanban,
  AppWindow,
  ServerCog,
  Disc3,
  Image,
  Mail,
  MapPin,
  Key,
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
    icon: <Server size={13} />,
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
    icon: <CreditCard size={13} />,
    title: "Аккаунт",
    actions: [
      { label: "Баланс", message: "Мой баланс" },
    ],
  },
  {
    icon: <KeyRound size={13} />,
    title: "SSH-ключи",
    actions: [
      { label: "Список SSH-ключей", message: "Покажи мои SSH-ключи" },
      { label: "Добавить SSH-ключ", message: "Добавь SSH-ключ" },
      { label: "Удалить SSH-ключ", message: "Удали SSH-ключ" },
    ],
  },
  {
    icon: <HardDrive size={13} />,
    title: "Бэкапы",
    actions: [
      { label: "Список бэкапов", message: "Покажи бэкапы сервера" },
      { label: "Создать бэкап", message: "Создай бэкап сервера" },
      { label: "Восстановить из бэкапа", message: "Восстанови сервер из бэкапа" },
    ],
  },
  {
    icon: <BarChart2 size={13} />,
    title: "Мониторинг",
    actions: [
      { label: "Статистика сервера", message: "Покажи статистику сервера" },
    ],
  },
  {
    icon: <Shield size={13} />,
    title: "Безопасность",
    actions: [
      { label: "Группы безопасности", message: "Покажи группы безопасности" },
      { label: "Создать группу", message: "Создай группу безопасности" },
      { label: "Добавить правило", message: "Добавь правило в группу безопасности" },
      { label: "Привязать к серверу", message: "Привяжи группу безопасности к серверу" },
    ],
  },
  {
    icon: <Zap size={13} />,
    title: "Действия",
    actions: [
      { label: "Перезагрузить сервер", message: "Перезагрузи сервер" },
      { label: "Жёсткая перезагрузка", message: "Жёсткая перезагрузка сервера" },
      { label: "Запустить сервер", message: "Запусти сервер" },
      { label: "Выключить сервер", message: "Выключи сервер" },
      { label: "Удалить сервер", message: "Удали сервер" },
      { label: "Сбросить пароль", message: "Сбрось пароль сервера" },
    ],
  },
  {
    icon: <Globe size={13} />,
    title: "Домены",
    actions: [
      { label: "Список доменов", message: "Покажи мои домены" },
    ],
  },
  {
    icon: <Database size={13} />,
    title: "Базы данных",
    actions: [
      { label: "Список баз данных", message: "Покажи мои базы данных" },
      { label: "Создать базу данных", message: "Создай базу данных" },
    ],
  },
  {
    icon: <Package size={13} />,
    title: "Хранилище",
    actions: [
      { label: "Список бакетов", message: "Покажи мои S3-бакеты" },
    ],
  },
  {
    icon: <Container size={13} />,
    title: "Kubernetes",
    actions: [
      { label: "Список кластеров", message: "Покажи мои кластеры Kubernetes" },
      { label: "Создать кластер", message: "Создай кластер Kubernetes" },
      { label: "Версии K8s", message: "Покажи доступные версии Kubernetes" },
    ],
  },
  {
    icon: <Network size={13} />,
    title: "Сеть",
    actions: [
      { label: "Балансировщики", message: "Покажи балансировщики нагрузки" },
      { label: "Плавающие IP", message: "Покажи плавающие IP" },
      { label: "VPC", message: "Покажи мои VPC" },
    ],
  },
  {
    icon: <FolderKanban size={13} />,
    title: "Проекты",
    actions: [
      { label: "Список проектов", message: "Покажи мои проекты" },
      { label: "Создать проект", message: "Создай проект" },
    ],
  },
  {
    icon: <AppWindow size={13} />,
    title: "Приложения",
    actions: [
      { label: "Список приложений", message: "Покажи мои приложения" },
      { label: "Запустить деплой", message: "Запусти деплой приложения" },
    ],
  },
  {
    icon: <ServerCog size={13} />,
    title: "Выделенные серверы",
    actions: [
      { label: "Список серверов", message: "Покажи выделенные серверы" },
    ],
  },
  {
    icon: <Disc3 size={13} />,
    title: "Диски и образы",
    actions: [
      { label: "Сетевые диски", message: "Покажи сетевые диски" },
      { label: "Образы", message: "Покажи мои образы" },
    ],
  },
  {
    icon: <Cloud size={13} />,
    title: "Реестр контейнеров",
    actions: [
      { label: "Список реестров", message: "Покажи реестры контейнеров" },
    ],
  },
  {
    icon: <Mail size={13} />,
    title: "Почта",
    actions: [
      { label: "Почтовые домены", message: "Покажи почтовые домены" },
      { label: "Почтовые ящики", message: "Покажи почтовые ящики" },
    ],
  },
  {
    icon: <Layers size={13} />,
    title: "Прочее",
    actions: [
      { label: "Локации", message: "Покажи доступные локации" },
      { label: "API-ключи", message: "Покажи мои API-ключи" },
      { label: "Статус аккаунта", message: "Покажи статус аккаунта" },
      { label: "Уведомления", message: "Покажи настройки уведомлений" },
    ],
  },
];

interface ActionsMenuProps {
  onAction: (text: string) => void;
  disabled?: boolean;
}

export function ActionsMenu({ onAction, disabled }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрываем по клику вне меню
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveCategory(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Закрываем по Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setActiveCategory(null); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleAction = (message: string) => {
    onAction(message);
    setOpen(false);
    setActiveCategory(null);
  };

  return (
    <div ref={menuRef} className="relative flex-shrink-0">
      {/* Кнопка-бургер */}
      <button
        type="button"
        onClick={() => { if (!disabled) { setOpen((v) => !v); setActiveCategory(null); } }}
        disabled={disabled}
        className={`mb-1 p-2 rounded-xl transition-colors flex-shrink-0 ${
          open
            ? "bg-[#1a3a30] text-[#10a37f]"
            : "text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#3a3a3a]"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Все действия"
      >
        <LayoutGrid size={18} />
      </button>

      {/* Панель */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-50 flex gap-1">
          {/* Список категорий */}
          <div className="w-48 bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl shadow-2xl overflow-hidden py-1">
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setActiveCategory(i)}
                onClick={() => setActiveCategory(activeCategory === i ? null : i)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
                  activeCategory === i
                    ? "bg-[#2a2a2a] text-[#ececec]"
                    : "text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#252525]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={activeCategory === i ? "text-[#10a37f]" : ""}>{cat.icon}</span>
                  {cat.title}
                </span>
                <ChevronRight size={11} className="text-[#555]" />
              </button>
            ))}
          </div>

          {/* Действия выбранной категории */}
          {activeCategory !== null && (
            <div className="w-52 bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl shadow-2xl overflow-hidden py-1">
              <div className="px-3 py-1.5 text-[10px] text-[#555] uppercase tracking-wider font-medium">
                {CATEGORIES[activeCategory].title}
              </div>
              {CATEGORIES[activeCategory].actions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAction(action.message)}
                  className="w-full text-left px-3 py-2 text-sm text-[#c0c0c8] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
