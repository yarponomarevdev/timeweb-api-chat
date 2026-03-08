"use client";

import React, { useState } from "react";
import { isToolUIPart, getToolName, type UIMessage } from "ai";
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader } from "lucide-react";

interface ToolCallLogProps {
  messages: UIMessage[];
}

// Человекочитаемые названия tools
const TOOL_LABELS: Record<string, string> = {
  list_servers: "Список серверов",
  get_server: "Детали сервера",
  create_server: "Создание сервера",
  delete_server: "Удаление сервера",
  server_action: "Действие с сервером",
  propose_server: "Подбор конфигурации",
  list_presets: "Список тарифов",
  list_os: "Список ОС",
  get_balance: "Баланс",
  list_ssh_keys: "SSH-ключи",
  create_ssh_key: "Добавление SSH-ключа",
  delete_ssh_key: "Удаление SSH-ключа",
  resize_server: "Изменение конфигурации",
  list_backups: "Список бэкапов",
  create_backup: "Создание бэкапа",
  restore_backup: "Восстановление из бэкапа",
  get_server_stats: "Статистика сервера",
  list_firewalls: "Группы безопасности",
  create_firewall: "Создание firewall",
  delete_firewall: "Удаление firewall",
  add_firewall_rule: "Добавление правила",
  delete_firewall_rule: "Удаление правила",
  attach_firewall_to_server: "Привязка firewall",
};

interface ToolCallEntry {
  id: string;
  toolName: string;
  label: string;
  state: string;
  input: Record<string, unknown> | null;
  output?: Record<string, unknown> | unknown[] | null;
  messageIndex: number;
}

export function ToolCallLog({ messages }: ToolCallLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Собираем все вызовы из всех сообщений
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
          output: ("output" in part ? part.output as Record<string, unknown> | unknown[] : undefined),
          messageIndex: mi,
        });
      }
    });
  });

  if (calls.length === 0) return null;

  const pendingCount = calls.filter(
    (c) => c.state === "input-available" || c.state === "input-streaming"
  ).length;

  return (
    <div className="border-t border-[#2a2a2a]">
      {/* Заголовок панели */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wrench size={12} />
          <span>
            Выполненные действия · {calls.length}
            {pendingCount > 0 && (
              <span className="ml-1.5 text-[#10a37f] animate-pulse">
                {pendingCount} выполняется
              </span>
            )}
          </span>
        </div>
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Список вызовов */}
      {isOpen && (
        <div className="max-h-64 overflow-y-auto bg-[#1a1a1a]">
          {calls.map((call) => (
            <div key={call.id} className="border-b border-[#242424] last:border-0">
              <button
                onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-[#222] transition-colors text-left"
              >
                <StatusIcon state={call.state} />
                <span className="flex-1 text-[#c0c0c8]">{call.label}</span>
                {expandedId === call.id ? (
                  <ChevronDown size={10} className="text-[#555] flex-shrink-0" />
                ) : (
                  <ChevronRight size={10} className="text-[#555] flex-shrink-0" />
                )}
              </button>

              {/* Развернутый вид */}
              {expandedId === call.id && (
                <div className="px-4 pb-3 flex flex-col gap-2">
                  {call.input && Object.keys(call.input).length > 0 && (
                    <div>
                      <div className="text-[10px] text-[#555] uppercase tracking-wide mb-1">
                        Параметры
                      </div>
                      <pre className="text-[11px] text-[#8e8ea0] bg-[#141414] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(call.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {call.output !== undefined && (
                    <div>
                      <div className="text-[10px] text-[#555] uppercase tracking-wide mb-1">
                        Результат
                      </div>
                      <pre className="text-[11px] text-[#8e8ea0] bg-[#141414] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap max-h-40">
                        {JSON.stringify(call.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
