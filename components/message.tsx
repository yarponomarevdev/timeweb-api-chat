"use client";

import React from "react";
import type { UIMessage } from "ai";
import { isTextUIPart, isToolUIPart, getToolName } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RotateCcw } from "lucide-react";
import { ServerCard } from "./server-card";
import { ServerCreateForm } from "./server-create-form";
import type {
  ServerSummary,
  ServerSummaryWithNetworks,
  CreateServerOutput,
  DeleteServerOutput,
  ServerActionOutput,
  ProposeServerOutput,
  PresetSummary,
  OsOption,
  BalanceOutput,
  SSHKeySummary,
  CreateSSHKeyOutput,
  DeleteSSHKeyOutput,
  ResizeServerOutput,
  DiskSummary,
  BackupSummary,
  CreateBackupOutput,
  RestoreBackupOutput,
  DeleteBackupOutput,
  ServerStatsOutput,
  FirewallGroupSummary,
  CreateFirewallOutput,
  FirewallRuleSummary,
  AddFirewallRuleOutput,
  AttachFirewallOutput,
} from "@/lib/tools";

interface MessageProps {
  message: UIMessage;
  onRetry?: () => void;
  onSendMessage?: (text: string) => void;
  timewebToken?: string;
  showSuggestions?: boolean;
}

type PresetRow = PresetSummary & { description: string };

const TOOL_SUGGESTIONS: Record<string, string[]> = {
  // Серверы
  list_servers: ["Создать сервер", "Показать баланс", "Показать тарифы"],
  get_server: ["Перезагрузить сервер", "Выключить сервер", "Показать статистику сервера", "Создать бэкап сервера", "Изменить конфигурацию сервера"],
  create_server: ["Показать мои серверы", "Перезагрузить сервер", "Создать бэкап сервера", "Показать баланс"],
  delete_server: ["Показать мои серверы", "Показать баланс"],

  // Действия над сервером
  server_action: ["Показать сервер", "Показать мои серверы", "Показать статистику сервера"],
  resize_server: ["Показать сервер", "Показать статистику сервера", "Показать мои серверы"],

  // Тарифы, ОС и предложение (флоу создания)
  list_presets: ["Создай сервер", "Создать сервер на 4GB RAM", "Покажи список ОС"],
  list_os: ["Создать сервер", "Показать тарифы"],
  propose_server: ["Покажи другие тарифы", "Покажи список ОС", "Показать мои серверы"],
  software: ["Покажи ПО из маркетплейса", "Создай сервер с OpenClaw", "Создай сервер с Docker"],
  propose_marketplace_server: ["Покажи ПО из маркетплейса", "Покажи другие тарифы", "Показать мои серверы"],

  // Баланс
  get_balance: ["Создать сервер", "Показать мои серверы", "Показать тарифы"],

  // SSH-ключи
  list_ssh_keys: ["Добавить SSH-ключ", "Удалить SSH-ключ", "Создать сервер"],
  create_ssh_key: ["Показать SSH-ключи", "Создать сервер"],
  delete_ssh_key: ["Показать SSH-ключи", "Создать сервер"],

  // Бэкапы и диски
  list_server_disks: ["Создать бэкап", "Показать бэкапы сервера", "Показать мои серверы"],
  list_backups: ["Создать бэкап сервера", "Восстановить сервер из бэкапа", "Показать мои серверы"],
  create_backup: ["Показать бэкапы сервера", "Показать мои серверы"],
  restore_backup: ["Показать мои серверы", "Показать бэкапы сервера"],
  delete_backup: ["Показать бэкапы сервера", "Показать мои серверы"],

  // Статистика
  get_server_stats: ["Показать сервер", "Создать бэкап сервера", "Перезагрузить сервер"],

  // Группы безопасности
  list_firewalls: ["Создать группу безопасности", "Добавить правило в группу безопасности", "Привязать группу безопасности к серверу"],
  create_firewall: ["Добавить правило в группу безопасности", "Привязать группу безопасности к серверу", "Показать группы безопасности"],
  add_firewall_rule: ["Добавить ещё правило", "Привязать группу безопасности к серверу", "Показать группы безопасности"],
  delete_firewall: ["Показать группы безопасности", "Показать мои серверы"],
  delete_firewall_rule: ["Показать группы безопасности", "Добавить правило в группу безопасности"],
  attach_firewall_to_server: ["Показать группы безопасности", "Показать мои серверы"],

  // Домены
  list_domains: ["Показать базы данных", "Показать мои серверы", "Показать баланс"],
  domains: ["Показать домены", "Удалить домен", "Показать базы данных"],

  // Базы данных
  list_databases: ["Создать базу данных", "Показать мои серверы", "Показать баланс"],
  create_database: ["Показать базы данных", "Показать мои серверы"],
  databases: ["Показать базы данных", "Создать базу данных", "Удалить базу данных"],

  // Хранилище
  list_buckets: ["Показать мои серверы", "Показать баланс"],
  buckets: ["Показать бакеты", "Создать бакет", "Удалить бакет"],

  // Жёсткая перезагрузка
  reboot_server_hard: ["Показать мои серверы", "Показать статистику сервера"],

  // Kubernetes
  k8s_clusters: ["Показать кластеры Kubernetes", "Создать кластер Kubernetes", "Показать мои серверы"],
  k8s_node_groups: ["Показать кластеры Kubernetes", "Добавить группу нод"],
  k8s_kubeconfig: ["Показать кластеры Kubernetes"],
  k8s_versions: ["Создать кластер Kubernetes", "Показать кластеры Kubernetes"],

  // Балансировщики
  load_balancers: ["Показать балансировщики", "Показать тарифы балансировщиков", "Показать мои серверы"],
  load_balancer_rules: ["Показать балансировщики", "Показать мои серверы"],

  // Плавающие IP
  floating_ips: ["Показать плавающие IP", "Показать мои серверы"],

  // VPC
  vpcs: ["Показать VPC", "Показать ресурсы VPC", "Показать мои серверы"],

  // Проекты
  projects: ["Показать проекты", "Показать мои серверы"],
  project_resources: ["Показать проекты", "Показать мои серверы"],

  // Приложения
  apps: ["Показать приложения", "Показать мои серверы"],
  app_deploys: ["Показать приложения"],

  // Выделенные серверы
  dedicated_servers: ["Показать выделенные серверы", "Показать тарифы выделенных серверов", "Показать мои серверы"],

  // Сетевые диски
  network_drives: ["Показать сетевые диски", "Показать мои серверы"],

  // Образы
  images: ["Показать образы", "Показать мои серверы"],

  // Реестр контейнеров
  container_registry: ["Показать реестры", "Показать мои серверы"],

  // Почта
  mail_domains: ["Показать почтовые домены", "Создать почтовый ящик"],
  mailboxes: ["Показать почтовые домены"],

  // Локации, API-ключи, аккаунт
  list_locations: ["Создать сервер", "Показать мои серверы"],
  api_keys: ["Показать API-ключи", "Показать баланс"],
  account_info: ["Показать баланс", "Показать мои серверы"],
  virtual_routers: ["Показать виртуальные роутеры", "Создать виртуальный роутер"],
  timeweb_api_universal: ["Показать виртуальные роутеры", "Показать проекты", "Показать API-ключи"],
};

const RICH_TOOL_OUTPUTS = new Set([
  "list_servers",
  "get_server",
  "propose_server",
  "list_presets",
  "list_os",
  "list_ssh_keys",
  "list_server_disks",
  "list_backups",
  "create_backup",
  "restore_backup",
  "delete_backup",
  "list_firewalls",
  "software",
  "get_balance",
  "get_server_stats",
  "k8s_clusters",
  "k8s_node_groups",
  "load_balancers",
  "floating_ips",
  "vpcs",
  "projects",
  "project_resources",
  "apps",
  "app_deploys",
  "dedicated_servers",
  "network_drives",
  "images",
  "container_registry",
  "mail_domains",
  "mailboxes",
  "list_locations",
  "api_keys",
  "account_info",
  "virtual_routers",
  "timeweb_api_universal",
  "domains",
  "databases",
  "buckets",
  "propose_marketplace_server",
]);

export function Message({ message, onRetry, onSendMessage, timewebToken, showSuggestions = true }: MessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          {message.parts?.map((part, index) => {
            if (isTextUIPart(part)) {
              if (part.text.startsWith("Подтверждаю. Создай сервер:")) return null;
              return (
                <div key={index} className="prose-chat bg-[#2f2f2f] px-4 py-3 rounded-2xl rounded-tr-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                </div>
              );
            }
            return null;
          })}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 text-xs text-[#8e8ea0] hover:text-[#ececec] transition-colors px-2 py-1 rounded-lg hover:bg-[#2f2f2f]"
              title="Повторить запрос"
            >
              <RotateCcw size={12} />
              Повторить
            </button>
          )}
        </div>
      </div>
    );
  }

  // ИИ — документ-стиль, полная ширина
  const hasContent = message.parts?.some(
    (p) => isTextUIPart(p) || isToolUIPart(p)
  );
  if (!hasContent) return null;

  const completedToolNames = message.parts
    ?.filter((p) => isToolUIPart(p) && p.state === "output-available")
    .map((p) => getToolName(p)) ?? [];
  const lastToolName = completedToolNames[completedToolNames.length - 1];
  const hasRichToolOutput = completedToolNames.some((toolName) => RICH_TOOL_OUTPUTS.has(toolName));

  let suggestions: string[] | undefined = lastToolName ? TOOL_SUGGESTIONS[lastToolName] : undefined;

  // Для текстовых ответов без tool-вызовов — подсказки по ключевым словам
  if (!suggestions && completedToolNames.length === 0) {
    const fullText = (message.parts ?? [])
      .filter(isTextUIPart)
      .map((p) => p.text)
      .join(" ")
      .toLowerCase();
    if (fullText.includes("сервер") && (fullText.includes("назов") || fullText.includes("имя") || fullText.includes("ос ") || fullText.includes("операционн") || fullText.includes("конфигурац") || fullText.includes("тариф"))) {
      suggestions = ["Ubuntu 22.04, 2GB RAM, назови web-server", "Покажи тарифы", "Покажи список ОС"];
    } else if (fullText.includes("ssh") || (fullText.includes("ключ") && fullText.includes("добав"))) {
      suggestions = ["Добавить SSH-ключ", "Показать мои SSH-ключи"];
    } else if (fullText.includes("бэкап") || fullText.includes("резервн")) {
      suggestions = ["Создать бэкап сервера", "Показать бэкапы сервера"];
    } else if (fullText.includes("группу") || fullText.includes("безопасност") || fullText.includes("фаервол")) {
      suggestions = ["Показать группы безопасности", "Создать группу безопасности"];
    }
  }

  return (
    <div className="mb-6">
      <div className="text-xs font-medium text-[#10a37f] mb-2 uppercase tracking-wide">evolvin.cloud</div>
      <div className="flex flex-col gap-2">
        {message.parts?.map((part, index) => {
          if (isTextUIPart(part)) {
            if (hasRichToolOutput) return null;
            return (
              <div key={index} className="prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
              </div>
            );
          }

          if (isToolUIPart(part)) {
            const toolName = getToolName(part);

              if (part.state === "input-available" || part.state === "input-streaming") {
                return (
                  <div key={index} className="flex items-center gap-2 text-sm text-[#8e8ea0] my-2">
                    <div className="w-4 h-4 rounded-full border-2 border-t-[#10a37f] border-[#3a3a3a] animate-spin" />
                    Выполняю действие...
                  </div>
                );
              }

              if (part.state === "output-available") {
                if (toolName === "list_servers") {
                  const output = part.output as ServerSummary[];
                  return (
                    <div key={index} className="flex flex-col gap-2 w-full">
                      {output.map((s, i) => (
                        <ServerCard key={i} server={s} onAction={onSendMessage} timewebToken={timewebToken} />
                      ))}
                    </div>
                  );
                }

                if (toolName === "get_server") {
                  const output = part.output as ServerSummaryWithNetworks;
                  return (
                    <div key={index} className="flex flex-col gap-2 w-full">
                      <ServerCard server={output} onAction={onSendMessage} timewebToken={timewebToken} />
                    </div>
                  );
                }

                if (toolName === "create_server") {
                  const output = part.output as CreateServerOutput;
                  if ("error" in output && output.error) {
                    return (
                      <div key={index} className="bg-[#2a1a1a] rounded-xl p-3 border border-[#5a2d2d] text-red-300 text-sm my-2">
                        {output.message}
                      </div>
                    );
                  }
                  return <ServerCard key={index} server={output as ServerSummary} onAction={onSendMessage} timewebToken={timewebToken} />;
                }

                if (toolName === "get_balance") {
                  const output = part.output as BalanceOutput;
                  return (
                    <div key={index} className="bg-[#2f2f2f] rounded-xl p-4 border border-[#3a3a3a] my-2 max-w-xs">
                      <div className="text-[#8e8ea0] text-sm mb-1">Текущий баланс</div>
                      <div className="text-2xl font-bold text-[#10a37f]">
                        {output.balance} {output.currency ?? "₽"}
                      </div>
                      {output.days_left != null && (
                        <div className="text-sm text-[#ececec] mt-2">
                          Осталось {output.days_left} дн.
                        </div>
                      )}
                      {output.end_date != null && (
                        <div className="text-xs text-[#8e8ea0] mt-0.5">
                          Хватит до {output.end_date}
                        </div>
                      )}
                    </div>
                  );
                }

                if (toolName === "delete_server" || toolName === "server_action") {
                  const output = part.output as DeleteServerOutput | ServerActionOutput;
                  return (
                    <div
                      key={index}
                      className={`rounded-xl p-3 border my-2 text-sm ${
                        output.success
                          ? "bg-[#1a2a1a] border-[#2d5a2d] text-green-300"
                          : "bg-[#2a1a1a] border-[#5a2d2d] text-red-300"
                      }`}
                    >
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "propose_server" || toolName === "propose_marketplace_server") {
                  const output = part.output as ProposeServerOutput;
                  return (
                    <ServerCreateForm
                      key={index}
                      data={output}
                      onConfirm={onSendMessage ?? (() => {})}
                    />
                  );
                }

                if (toolName === "list_presets") {
                  const presets = part.output as PresetRow[];
                  return (
                    <div key={index} className="w-full my-2 overflow-x-auto rounded-xl border border-[#3a3a3a]">
                      <table className="w-full text-sm text-[#ececec]">
                        <thead>
                          <tr className="bg-[#171717] text-[#8e8ea0] text-xs uppercase tracking-wide">
                            <th className="text-left px-4 py-3 font-medium">Тариф</th>
                            <th className="text-center px-3 py-3 font-medium">CPU</th>
                            <th className="text-center px-3 py-3 font-medium">RAM</th>
                            <th className="text-center px-3 py-3 font-medium">Диск</th>
                            <th className="text-right px-4 py-3 font-medium">₽/мес</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presets.map((p, i) => (
                            <tr key={i} className={`border-t border-[#3a3a3a] ${i % 2 === 0 ? "bg-[#2f2f2f]" : "bg-[#252525]"}`}>
                              <td className="px-4 py-2.5 font-medium">{p.description}</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{p.cpu}</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{p.ram_gb} GB</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{p.disk_gb >= 1000 ? `${Math.round(p.disk_gb / 1024)} TB` : `${p.disk_gb} GB`}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-[#10a37f]">{p.price_per_month}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (toolName === "list_os") {
                  const osList = part.output as OsOption[];
                  return (
                    <div key={index} className="flex flex-col gap-2 my-2">
                      <div className="text-xs text-[#8e8ea0]">Выберите операционную систему:</div>
                      <div className="flex flex-wrap gap-2">
                        {osList.map((os, i) => {
                          const label = os.full_name || `${os.name} ${os.version}`;
                          return onSendMessage ? (
                            <button
                              key={i}
                              onClick={() => onSendMessage(`Используй ${label}`)}
                              className="bg-[#2f2f2f] hover:bg-[#10a37f] hover:border-[#10a37f] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-sm text-[#ececec] transition-colors cursor-pointer"
                            >
                              {label}
                            </button>
                          ) : (
                            <span key={i} className="bg-[#2f2f2f] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-sm text-[#ececec]">
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (toolName === "list_ssh_keys") {
                  const keys = part.output as SSHKeySummary[];
                  if (keys.length === 0) {
                    return (
                      <div key={index} className="text-sm text-[#8e8ea0] my-2">
                        SSH-ключей пока нет.
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="w-full my-2 overflow-x-auto rounded-xl border border-[#3a3a3a]">
                      <table className="w-full text-sm text-[#ececec]">
                        <thead>
                          <tr className="bg-[#171717] text-[#8e8ea0] text-xs uppercase tracking-wide">
                            <th className="text-left px-4 py-3 font-medium">ID</th>
                            <th className="text-left px-4 py-3 font-medium">Название</th>
                            <th className="text-left px-4 py-3 font-medium">Fingerprint</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keys.map((k, i) => (
                            <tr key={i} className={`border-t border-[#3a3a3a] ${i % 2 === 0 ? "bg-[#2f2f2f]" : "bg-[#252525]"}`}>
                              <td className="px-4 py-2.5 font-mono text-[#8e8ea0]">{k.id}</td>
                              <td className="px-4 py-2.5 font-medium">{k.name}</td>
                              <td className="px-4 py-2.5 font-mono text-xs text-[#8e8ea0] truncate max-w-[200px]">{k.fingerprint || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (toolName === "create_ssh_key") {
                  const output = part.output as CreateSSHKeyOutput;
                  return (
                    <div key={index} className="bg-[#1a2a1a] rounded-xl p-3 border border-[#2d5a2d] text-green-300 text-sm my-2">
                      {output.message} (fingerprint: <span className="font-mono text-xs">{output.fingerprint}</span>)
                    </div>
                  );
                }

                if (toolName === "delete_ssh_key") {
                  const output = part.output as DeleteSSHKeyOutput;
                  return (
                    <div key={index} className="bg-[#1a2a1a] rounded-xl p-3 border border-[#2d5a2d] text-green-300 text-sm my-2">
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "resize_server") {
                  const output = part.output as ResizeServerOutput;
                  return (
                    <div key={index} className="bg-[#2f2f2f] rounded-xl p-4 border border-[#3a3a3a] my-2 max-w-sm">
                      <div className="text-sm font-semibold text-[#ececec] mb-2">{output.name}</div>
                      <div className="text-xs text-[#8e8ea0] mb-3">{output.message}</div>
                      <div className="flex gap-4 text-xs text-[#8e8ea0]">
                        <span>{output.cpu} CPU</span>
                        <span>{output.ram_gb} GB RAM</span>
                        <span>{output.disk_gb} GB NVMe</span>
                      </div>
                    </div>
                  );
                }

                if (toolName === "list_server_disks") {
                  const disks = part.output as DiskSummary[];
                  if (disks.length === 0) {
                    return (
                      <div key={index} className="text-sm text-[#8e8ea0] my-2">
                        У сервера нет дисков.
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="w-full my-2 overflow-x-auto rounded-xl border border-[#3a3a3a]">
                      <table className="w-full text-sm text-[#ececec]">
                        <thead>
                          <tr className="bg-[#171717] text-[#8e8ea0] text-xs uppercase tracking-wide">
                            <th className="text-left px-4 py-3 font-medium">Имя</th>
                            <th className="text-left px-4 py-3 font-medium">Тип</th>
                            <th className="text-center px-3 py-3 font-medium">Размер</th>
                            <th className="text-center px-3 py-3 font-medium">Занято</th>
                            <th className="text-center px-3 py-3 font-medium">Авто-бэкап</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disks.map((d, i) => (
                            <tr key={i} className={`border-t border-[#3a3a3a] ${i % 2 === 0 ? "bg-[#2f2f2f]" : "bg-[#252525]"}`}>
                              <td className="px-4 py-2.5">
                                {d.system_name}
                                {d.is_system && <span className="ml-2 text-[10px] bg-[#10a37f]/20 text-[#10a37f] px-1.5 py-0.5 rounded">системный</span>}
                              </td>
                              <td className="px-4 py-2.5 text-[#8e8ea0] uppercase text-xs">{d.type}</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{d.size_gb} ГБ</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{d.used_gb} ГБ</td>
                              <td className="px-3 py-2.5 text-center">{d.auto_backup ? "✓" : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (toolName === "list_backups") {
                  const backups = part.output as BackupSummary[];
                  if (backups.length === 0) {
                    return (
                      <div key={index} className="text-sm text-[#8e8ea0] my-2">
                        Бэкапов пока нет.
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="w-full my-2 overflow-x-auto rounded-xl border border-[#3a3a3a]">
                      <table className="w-full text-sm text-[#ececec]">
                        <thead>
                          <tr className="bg-[#171717] text-[#8e8ea0] text-xs uppercase tracking-wide">
                            <th className="text-left px-4 py-3 font-medium">ID</th>
                            <th className="text-center px-3 py-3 font-medium">Статус</th>
                            <th className="text-center px-3 py-3 font-medium">Тип</th>
                            <th className="text-center px-3 py-3 font-medium">Размер</th>
                            <th className="text-left px-4 py-3 font-medium">Создан</th>
                            <th className="text-left px-4 py-3 font-medium">Комментарий</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backups.map((b, i) => (
                            <tr key={i} className={`border-t border-[#3a3a3a] ${i % 2 === 0 ? "bg-[#2f2f2f]" : "bg-[#252525]"}`}>
                              <td className="px-4 py-2.5 font-mono text-[#8e8ea0]">{b.id}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${b.status === "done" ? "bg-[#10a37f]/20 text-[#10a37f]" : b.status === "precreate" ? "bg-yellow-500/20 text-yellow-400" : "bg-[#3a3a3a] text-[#8e8ea0]"}`}>
                                  {b.status === "done" ? "готов" : b.status === "precreate" ? `${b.progress}%` : b.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0] text-xs">{b.type === "auto" ? "авто" : "ручной"}</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{b.size_mb} МБ</td>
                              <td className="px-4 py-2.5 text-[#8e8ea0] text-xs">{new Date(b.created_at).toLocaleString("ru")}</td>
                              <td className="px-4 py-2.5 text-[#8e8ea0] text-xs max-w-[120px] truncate">{b.comment || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (toolName === "create_backup") {
                  const output = part.output as CreateBackupOutput;
                  return (
                    <div key={index} className="bg-[#1a2a1a] rounded-xl p-3 border border-[#2d5a2d] text-green-300 text-sm my-2">
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "restore_backup") {
                  const output = part.output as RestoreBackupOutput;
                  return (
                    <div key={index} className={`rounded-xl p-3 border my-2 text-sm ${output.success ? "bg-[#1a2a1a] border-[#2d5a2d] text-green-300" : "bg-[#2a1a1a] border-[#5a2d2d] text-red-300"}`}>
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "delete_backup") {
                  const output = part.output as DeleteBackupOutput;
                  return (
                    <div key={index} className={`rounded-xl p-3 border my-2 text-sm ${output.success ? "bg-[#1a2a1a] border-[#2d5a2d] text-green-300" : "bg-[#2a1a1a] border-[#5a2d2d] text-red-300"}`}>
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "get_server_stats") {
                  const s = part.output as ServerStatsOutput;
                  return (
                    <div key={index} className="bg-[#2f2f2f] rounded-xl p-4 border border-[#3a3a3a] my-2 max-w-sm">
                      <div className="text-xs text-[#8e8ea0] mb-3 uppercase tracking-wide">Статистика за {s.period}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <StatItem label="CPU" value={s.cpu_avg !== null ? `${s.cpu_avg}%` : "—"} />
                        <StatItem label="RAM" value={s.ram_avg !== null ? `${s.ram_avg}%` : "—"} />
                        <StatItem label="Диск" value={s.disk_avg !== null ? `${s.disk_avg}%` : "—"} />
                        <StatItem label="Сеть ↓" value={s.net_in_avg !== null ? `${s.net_in_avg} B/s` : "—"} />
                      </div>
                    </div>
                  );
                }

                if (toolName === "list_firewalls") {
                  const groups = part.output as FirewallGroupSummary[];
                  if (groups.length === 0) {
                    return (
                      <div key={index} className="text-sm text-[#8e8ea0] my-2">
                        Групп безопасности пока нет.
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="w-full my-2 overflow-x-auto rounded-xl border border-[#3a3a3a]">
                      <table className="w-full text-sm text-[#ececec]">
                        <thead>
                          <tr className="bg-[#171717] text-[#8e8ea0] text-xs uppercase tracking-wide">
                            <th className="text-left px-4 py-3 font-medium">Название</th>
                            <th className="text-center px-3 py-3 font-medium">Правил</th>
                            <th className="text-center px-3 py-3 font-medium">Серверов</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groups.map((g, i) => (
                            <tr key={i} className={`border-t border-[#3a3a3a] ${i % 2 === 0 ? "bg-[#2f2f2f]" : "bg-[#252525]"}`}>
                              <td className="px-4 py-2.5 font-medium">
                                {g.name}
                                {g.description && <div className="text-xs text-[#8e8ea0] font-normal">{g.description}</div>}
                              </td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{g.rules_count}</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{g.resources_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (toolName === "create_firewall") {
                  const output = part.output as CreateFirewallOutput;
                  return (
                    <div key={index} className="bg-[#1a2a1a] rounded-xl p-3 border border-[#2d5a2d] text-green-300 text-sm my-2">
                      {output.message} (ID: <span className="font-mono text-xs">{output.id}</span>)
                    </div>
                  );
                }

                if (toolName === "add_firewall_rule") {
                  const output = part.output as AddFirewallRuleOutput;
                  return (
                    <div key={index} className="bg-[#1a2a1a] rounded-xl p-3 border border-[#2d5a2d] text-green-300 text-sm my-2">
                      {output.message}: {output.direction} {output.protocol}
                      {output.port ? `:${output.port}` : ""} {output.cidr}
                    </div>
                  );
                }

                if (toolName === "delete_firewall" || toolName === "delete_firewall_rule" || toolName === "attach_firewall_to_server") {
                  const output = part.output as { success: boolean; message: string } | AttachFirewallOutput;
                  return (
                    <div key={index} className={`rounded-xl p-3 border my-2 text-sm ${output.success ? "bg-[#1a2a1a] border-[#2d5a2d] text-green-300" : "bg-[#2a1a1a] border-[#5a2d2d] text-red-300"}`}>
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "list_domains") {
                  const output = part.output as { domains: Array<{ id: number; name: string; expiration: string; days_left: number; provider: string; is_autoprolong: boolean }> };
                  return (
                    <div key={index} className="my-2 flex flex-col gap-2">
                      {output.domains.length === 0 && <p className="text-[#8e8ea0] text-sm">Доменов не найдено</p>}
                      {output.domains.map((d) => (
                        <div key={d.id} className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] px-4 py-3 flex items-center justify-between text-sm">
                          <span className="font-medium text-[#ececec]">{d.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-md ${d.days_left > 30 ? "text-green-400 bg-[#1a2d1a]" : d.days_left > 7 ? "text-yellow-400 bg-[#2a2318]" : "text-red-400 bg-[#2d1a1a]"}`}>
                            {d.days_left} дн.
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (toolName === "list_databases" || toolName === "create_database") {
                  const output = part.output as { databases?: Array<{ id: number; name: string; type: string; status: string; location?: string }>; database?: { id: number; name: string; type: string; status: string } };
                  const items = output.databases ?? (output.database ? [output.database] : []);
                  return (
                    <div key={index} className="my-2 flex flex-col gap-2">
                      {items.length === 0 && <p className="text-[#8e8ea0] text-sm">Баз данных не найдено</p>}
                      {items.map((d) => (
                        <div key={d.id} className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] px-4 py-3 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-[#ececec]">{d.name}</span>
                            <span className="ml-2 text-[#8e8ea0] text-xs">{d.type.toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-[#8e8ea0]">{d.status}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (toolName === "list_buckets") {
                  const output = part.output as { buckets: Array<{ id: number; name: string; type: string; object_amount: number; size_gb: number; location?: string }> };
                  return (
                    <div key={index} className="my-2 flex flex-col gap-2">
                      {output.buckets.length === 0 && <p className="text-[#8e8ea0] text-sm">Бакетов не найдено</p>}
                      {output.buckets.map((b) => (
                        <div key={b.id} className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] px-4 py-3 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-[#ececec]">{b.name}</span>
                            <span className="ml-2 text-[#8e8ea0] text-xs">{b.type === "public" ? "Публичный" : "Приватный"}</span>
                          </div>
                          <span className="text-xs text-[#8e8ea0]">{b.object_amount} объектов · {b.size_gb} ГБ</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (toolName === "reboot_server_hard") {
                  const output = part.output as { success: boolean; message: string };
                  return (
                    <div key={index} className="bg-[#1a2a1a] rounded-xl p-3 border border-[#2d5a2d] text-green-300 text-sm my-2">
                      {output.message}
                    </div>
                  );
                }

                // ─── Маркетплейс ПО — интерактивная сетка ───
                if (toolName === "software") {
                  const raw = part.output;
                  if (Array.isArray(raw)) {
                    if (raw.length === 0) {
                      return <p key={index} className="text-[#8e8ea0] text-sm my-2">Ничего не найдено</p>;
                    }
                    return (
                      <div key={index} className="my-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {raw.map((raw_item: Record<string, unknown>, i: number) => {
                          const sw = { name: String(raw_item.name ?? ""), category: raw_item.category ? String(raw_item.category) : null, description: raw_item.description ? String(raw_item.description) : null, os_label: raw_item.os_label ? String(raw_item.os_label) : null, min_ram_mb: raw_item.min_ram_mb ? Number(raw_item.min_ram_mb) : null };
                          return (
                            <button
                              key={i}
                              onClick={() => onSendMessage?.(`Создай сервер с ${sw.name}`)}
                              title={sw.description ?? undefined}
                              className="flex flex-col gap-1 p-3 bg-[#2a2a2a] hover:bg-[#313131] border border-[#3a3a3a] hover:border-[#197a5f] rounded-xl text-left transition-all group"
                            >
                              <span className="text-sm font-medium text-[#ececec] group-hover:text-[#10a37f] transition-colors">
                                {sw.name}
                              </span>
                              {sw.category && (
                                <span className="text-[10px] text-[#0d8068] uppercase tracking-wide">
                                  {sw.category}
                                </span>
                              )}
                              {(sw.os_label || sw.min_ram_mb) && (
                                <span className="text-[10px] text-[#6e6e80] mt-auto pt-1">
                                  {[sw.os_label, sw.min_ram_mb ? `от ${sw.min_ram_mb / 1024} ГБ RAM` : null].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                  // Одиночный элемент — тоже кликабельный
                  const output = raw as Record<string, unknown>;
                  const swName = String(output.name ?? "");
                  const swDesc = output.description ? String(output.description) : null;
                  return (
                    <div key={index} className="my-3">
                      <button
                        onClick={() => onSendMessage?.(`Создай сервер с ${swName}`)}
                        title={swDesc ?? undefined}
                        className="flex flex-col gap-1 p-3 bg-[#2a2a2a] hover:bg-[#313131] border border-[#3a3a3a] hover:border-[#197a5f] rounded-xl text-left transition-all group w-full max-w-xs"
                      >
                        <span className="text-sm font-medium text-[#ececec] group-hover:text-[#10a37f] transition-colors">
                          {swName}
                        </span>
                      </button>
                    </div>
                  );
                }

                // ─── Универсальный рендер для всех compound/new tools ───
                if (toolName === "k8s_clusters" || toolName === "k8s_node_groups" ||
                    toolName === "load_balancers" || toolName === "load_balancer_rules" ||
                    toolName === "floating_ips" || toolName === "vpcs" || toolName === "projects" ||
                    toolName === "project_resources" || toolName === "dedicated_servers" ||
                    toolName === "network_drives" || toolName === "images" ||
                    toolName === "container_registry" || toolName === "mail_domains" ||
                    toolName === "mailboxes" || toolName === "api_keys" ||
                    toolName === "k8s_kubeconfig" || toolName === "k8s_versions" ||
                    toolName === "account_info" || toolName === "list_locations" ||
                    toolName === "apps" || toolName === "app_deploys" ||
                    toolName === "virtual_routers" || toolName === "timeweb_api_universal" ||
                    toolName === "domains" || toolName === "databases" ||
                    toolName === "buckets") {
                  const raw = part.output;

                  // Tool вернул массив напрямую
                  if (Array.isArray(raw)) {
                    if (raw.length === 0) {
                      return <p key={index} className="text-[#8e8ea0] text-sm my-2">Ничего не найдено</p>;
                    }
                    return (
                      <div key={index} className="my-2 flex flex-col gap-2">
                        {raw.map((item, i) => (
                          <ResourceCard key={i} item={item as Record<string, unknown>} />
                        ))}
                      </div>
                    );
                  }

                  const output = raw as Record<string, unknown>;

                  // Для операций с message — показать как уведомление
                  if (typeof output.message === "string") {
                    const success = output.success !== false;
                    return (
                      <div key={index} className={`rounded-xl p-3 border my-2 text-sm ${success ? "bg-[#1a2a1a] border-[#2d5a2d] text-green-300" : "bg-[#2a1a1a] border-[#5a2d2d] text-red-300"}`}>
                        {output.message as string}
                      </div>
                    );
                  }

                  // Для списков — найти массив в output
                  const arrayKey = Object.keys(output).find((k) => Array.isArray(output[k]));
                  if (arrayKey) {
                    const items = output[arrayKey] as Array<Record<string, unknown>>;
                    if (items.length === 0) {
                      return <p key={index} className="text-[#8e8ea0] text-sm my-2">Ничего не найдено</p>;
                    }
                    return (
                      <div key={index} className="my-2 flex flex-col gap-2">
                        {items.map((item, i) => (
                          <ResourceCard key={i} item={item} />
                        ))}
                      </div>
                    );
                  }

                  // Для строк (kubeconfig и т.п.)
                  if (typeof output === "string") {
                    return (
                      <div key={index} className="bg-[#171717] rounded-xl p-4 border border-[#3a3a3a] my-2 overflow-x-auto">
                        <pre className="text-sm text-[#ececec] whitespace-pre-wrap">{output}</pre>
                      </div>
                    );
                  }

                  // Для одиночных объектов (get, create)
                  if (Object.keys(output).length > 0) {
                    return <ResourceCard key={index} item={output} />;
                  }
                }

                // Fallback для неизвестных tools
                return (
                  <div key={index} className="bg-[#171717] rounded-xl p-4 border border-[#3a3a3a] my-2 w-full overflow-x-auto">
                    <div className="text-xs text-[#8e8ea0] mb-2 font-mono uppercase tracking-wide">
                      {toolName}
                    </div>
                    <pre className="text-sm text-[#ececec] whitespace-pre-wrap">
                      {JSON.stringify(part.output, null, 2)}
                    </pre>
                  </div>
                );
              }

              if (part.state === "output-error") {
                return (
                  <div key={index} className="bg-[#2a1a1a] rounded-xl p-3 border border-[#5a2d2d] text-red-300 text-sm my-2">
                    Ошибка при выполнении: {toolName}
                    {("errorText" in part) && `: ${(part as { errorText?: string }).errorText}`}
                  </div>
                );
              }
            }

            return null;
          })}
      </div>
      {showSuggestions && suggestions && onSendMessage && (
        <SuggestedActions suggestions={suggestions} onAction={onSendMessage} />
      )}
    </div>
  );
}

function SuggestedActions({ suggestions, onAction }: { suggestions: string[]; onAction: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onAction(s)}
          className="bg-[#2a2a2a] hover:bg-[#1a3a30] hover:border-[#197a5f] border border-[#3a3a3a] rounded-full px-3 py-1 text-xs text-[#8e8ea0] hover:text-[#ececec] transition-all"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#8e8ea0]">{label}</span>
      <span className="text-[#ececec] font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    on: "text-green-400 bg-[#1a2d1a]",
    active: "text-green-400 bg-[#1a2d1a]",
    running: "text-green-400 bg-[#1a2d1a]",
    deployed: "text-green-400 bg-[#1a2d1a]",
    off: "text-[#8e8ea0] bg-[#2e2e2e]",
    installing: "text-yellow-400 bg-[#2a2318]",
    creating: "text-yellow-400 bg-[#2a2318]",
    pending: "text-yellow-400 bg-[#2a2318]",
    error: "text-red-400 bg-[#2d1a1a]",
    failed: "text-red-400 bg-[#2d1a1a]",
  };
  const color = colors[status] ?? "text-[#8e8ea0] bg-[#2e2e2e]";
  return <span className={`text-xs px-2 py-1 rounded-md ${color}`}>{status}</span>;
}

function ResourceCard({ item }: { item: Record<string, unknown> }) {
  const name = (item.name ?? item.fqdn ?? item.email ?? item.ip ?? item.id ?? "—") as string;
  const status = item.status as string | undefined;
  const description = (item.description ?? item.comment ?? item.type ?? "") as string;

  // Собираем мета-данные для отображения
  const meta: string[] = [];
  if (item.location) meta.push(String(item.location));
  if (item.availability_zone) meta.push(String(item.availability_zone));
  if (item.subnet_v4) meta.push(String(item.subnet_v4));
  if (item.country && item.city) meta.push(`${item.city}, ${item.country}`);
  if (item.size_gb != null) meta.push(`${item.size_gb} ГБ`);
  if (item.size != null && item.size_gb == null) meta.push(`${item.size} ГБ`);
  if (item.cpu != null) meta.push(`${item.cpu} CPU`);
  if (item.ram_gb != null) meta.push(`${item.ram_gb} ГБ RAM`);
  if (item.price != null) meta.push(`${item.price} ₽/мес`);
  if (item.created_at) meta.push(new Date(String(item.created_at)).toLocaleString("ru"));

  return (
    <div className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-[#ececec]">{String(name)}</span>
        {status && <StatusBadge status={status} />}
      </div>
      {description && <div className="text-xs text-[#8e8ea0] mt-0.5">{description}</div>}
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-[#8e8ea0]">
          {meta.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      )}
    </div>
  );
}

function GenericToolOutput({ output }: { output: Record<string, unknown> }) {
  // Для message-подобных ответов
  if (typeof output.message === "string") {
    const success = output.success !== false;
    return (
      <div className={`rounded-xl p-3 border my-2 text-sm ${success ? "bg-[#1a2a1a] border-[#2d5a2d] text-green-300" : "bg-[#2a1a1a] border-[#5a2d2d] text-red-300"}`}>
        {output.message as string}
      </div>
    );
  }
  return (
    <div className="bg-[#171717] rounded-xl p-4 border border-[#3a3a3a] my-2 w-full overflow-x-auto">
      <pre className="text-sm text-[#ececec] whitespace-pre-wrap">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}
