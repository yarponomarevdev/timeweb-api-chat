"use client";

import React, { useState, useEffect } from "react";
import { isToolUIPart, getToolName, type UIMessage } from "ai";
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader, X, AlertTriangle } from "lucide-react";

// Человекочитаемые названия tools
const TOOL_LABELS: Record<string, string> = {
  list_servers: "Список серверов",
  get_server: "Детали сервера",
  create_server: "Создание сервера",
  delete_server: "Удаление сервера",
  server_action: "Действие с сервером",
  propose_server: "Подбор конфигурации",
  propose_marketplace_server: "Подбор ПО из маркетплейса",
  list_presets: "Список тарифов",
  list_os: "Список ОС",
  get_balance: "Баланс",
  list_ssh_keys: "SSH-ключи",
  create_ssh_key: "Добавление SSH-ключа",
  delete_ssh_key: "Удаление SSH-ключа",
  resize_server: "Изменение конфигурации",
  reboot_server_hard: "Жёсткая перезагрузка",
  get_server_stats: "Статистика сервера",
  list_backups: "Список бэкапов",
  create_backup: "Создание бэкапа",
  restore_backup: "Восстановление из бэкапа",
  list_firewalls: "Группы безопасности",
  create_firewall: "Создание firewall",
  delete_firewall: "Удаление firewall",
  add_firewall_rule: "Добавление правила",
  delete_firewall_rule: "Удаление правила",
  attach_firewall_to_server: "Привязка firewall",
  software: "Маркетплейс ПО",
  k8s_clusters: "Kubernetes",
  load_balancers: "Балансировщики",
  floating_ips: "Плавающие IP",
  vpcs: "VPC",
  projects: "Проекты",
  apps: "Приложения",
  dedicated_servers: "Выделенные серверы",
  domains: "Домены",
  databases: "Базы данных",
  buckets: "S3-бакеты",
  network_drives: "Сетевые диски",
  images: "Образы",
  registry: "Реестр контейнеров",
  mail: "Почта",
};

interface ToolCallEntry {
  id: string;
  toolName: string;
  label: string;
  state: string;
  input: Record<string, unknown> | null;
  output?: unknown;
  messageIndex: number;
}

function parseToolCalls(messages: UIMessage[]): ToolCallEntry[] {
  const calls: ToolCallEntry[] = [];
  messages.forEach((msg, mi) => {
    msg.parts?.forEach((part, pi) => {
      if (isToolUIPart(part)) {
        const toolName = getToolName(part);
        calls.push({
          id: `${mi}-${pi}`,
          toolName,
          label: TOOL_LABELS[toolName] ?? toolName,
          state: part.state,
          input: ("input" in part && part.input != null ? part.input as Record<string, unknown> : null),
          output: ("output" in part ? part.output : undefined),
          messageIndex: mi,
        });
      }
    });
  });
  return calls;
}

// Извлекаем читаемое сообщение об ошибке из output
function extractErrorMessage(output: unknown): string {
  if (!output) return "Неизвестная ошибка";
  if (typeof output === "string") return output;
  if (typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    if (typeof o.text === "string") return o.text;
  }
  return JSON.stringify(output);
}

interface ToolCallLogModalProps {
  messages: UIMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export function ToolCallLogModal({ messages, isOpen, onClose }: ToolCallLogModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "errors">("all");

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const calls = parseToolCalls(messages);
  const errors = calls.filter((c) => c.state === "output-error");

  if (!isOpen) return null;

  const visibleCalls = activeTab === "errors" ? errors : calls;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[80vh] bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl flex flex-col shadow-2xl">
        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Wrench size={15} className="text-[#10a37f]" />
            <span className="font-semibold text-sm text-[#ececec]">Журнал вызовов</span>
            <span className="text-xs text-[#8e8ea0] bg-[#2a2a2a] px-2 py-0.5 rounded-full">
              {calls.length}
            </span>
            {errors.length > 0 && (
              <span className="text-xs text-red-400 bg-[#2d1a1a] border border-[#5a2d2d] px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle size={10} />
                {errors.length} ошибок
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Вкладки */}
        {errors.length > 0 && (
          <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "all"
                  ? "bg-[#2a2a2a] text-[#ececec]"
                  : "text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#222]"
              }`}
            >
              Все ({calls.length})
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "errors"
                  ? "bg-[#2a1a1a] text-red-300 border border-[#5a2d2d]"
                  : "text-[#8e8ea0] hover:text-red-300 hover:bg-[#222]"
              }`}
            >
              <AlertTriangle size={10} />
              Ошибки ({errors.length})
            </button>
          </div>
        )}

        {/* Список */}
        <div className="flex-1 overflow-y-auto px-2 py-3 min-h-0">
          {visibleCalls.length === 0 && (
            <div className="text-center text-[#8e8ea0] text-sm py-8">
              {activeTab === "errors" ? "Ошибок нет" : "Вызовов нет"}
            </div>
          )}
          {visibleCalls.map((call) => (
            <div
              key={call.id}
              className={`rounded-xl mb-1 overflow-hidden border ${
                call.state === "output-error"
                  ? "border-[#5a2d2d] bg-[#231515]"
                  : "border-[#242424] bg-[#1e1e1e]"
              }`}
            >
              <button
                onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
              >
                <StatusIcon state={call.state} />
                <span className={`flex-1 ${call.state === "output-error" ? "text-red-300" : "text-[#c0c0c8]"}`}>
                  {call.label}
                </span>
                {call.state === "output-error" && (
                  <span className="text-[10px] text-red-400 bg-[#2a1a1a] px-1.5 py-0.5 rounded mr-1">
                    ошибка
                  </span>
                )}
                {expandedId === call.id ? (
                  <ChevronDown size={10} className="text-[#8e8ea0] flex-shrink-0" />
                ) : (
                  <ChevronRight size={10} className="text-[#8e8ea0] flex-shrink-0" />
                )}
              </button>

              {/* Развернутый вид */}
              {expandedId === call.id && (
                <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[#242424]">
                  {call.state === "output-error" && (
                    <div className="mt-2">
                      <div className="text-[10px] text-red-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <AlertTriangle size={9} /> Ошибка
                      </div>
                      <div className="text-xs text-red-300 bg-[#2d1a1a] border border-[#5a2d2d] rounded-lg p-2">
                        {extractErrorMessage(call.output)}
                      </div>
                    </div>
                  )}
                  {call.input && Object.keys(call.input).length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] text-[#8e8ea0] uppercase tracking-wide mb-1">
                        Параметры
                      </div>
                      <pre className="text-[11px] text-[#8e8ea0] bg-[#141414] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(call.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {call.output !== undefined && call.state !== "output-error" && (
                    <div>
                      <div className="text-[10px] text-[#8e8ea0] uppercase tracking-wide mb-1">
                        Результат
                      </div>
                      <pre className="text-[11px] text-[#8e8ea0] bg-[#141414] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap max-h-48">
                        {JSON.stringify(call.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Публичная функция для подсчёта статистики (используется сайдбаром)
export function getToolCallStats(messages: UIMessage[]) {
  const calls = parseToolCalls(messages);
  const errorCount = calls.filter((c) => c.state === "output-error").length;
  const pendingCount = calls.filter(
    (c) => c.state === "input-available" || c.state === "input-streaming"
  ).length;
  return { total: calls.length, errorCount, pendingCount };
}

function StatusIcon({ state }: { state: string }) {
  if (state === "output-available") {
    return <CheckCircle size={12} className="text-[#10a37f] flex-shrink-0" />;
  }
  if (state === "output-error") {
    return <XCircle size={12} className="text-red-400 flex-shrink-0" />;
  }
  return <Loader size={12} className="text-[#10a37f] animate-spin flex-shrink-0" />;
}
