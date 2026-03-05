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
  BackupSummary,
  CreateBackupOutput,
  RestoreBackupOutput,
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
}

type PresetRow = PresetSummary & { description: string };

export function Message({ message, onRetry, onSendMessage, timewebToken }: MessageProps) {
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

  return (
    <div className="mb-6">
      <div className="text-xs font-medium text-[#10a37f] mb-2 uppercase tracking-wide">Timeweb</div>
      <div className="flex flex-col gap-2">
        {message.parts?.map((part, index) => {
          if (isTextUIPart(part)) {
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
                      <div key={index} className="bg-red-900/30 rounded-xl p-3 border border-red-700 text-red-300 text-sm my-2">
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
                      {output.hours_left != null && (
                        <div className="text-xs text-[#8e8ea0] mt-1">
                          Хватит примерно на {output.hours_left} ч.
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
                          ? "bg-green-900/30 border-green-700 text-green-300"
                          : "bg-red-900/30 border-red-700 text-red-300"
                      }`}
                    >
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "propose_server") {
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
                              <td className="px-4 py-2.5 font-mono text-xs text-[#8e8ea0] truncate max-w-[200px]">{k.fingerprint}</td>
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
                    <div key={index} className="bg-green-900/30 rounded-xl p-3 border border-green-700 text-green-300 text-sm my-2">
                      {output.message} (fingerprint: <span className="font-mono text-xs">{output.fingerprint}</span>)
                    </div>
                  );
                }

                if (toolName === "delete_ssh_key") {
                  const output = part.output as DeleteSSHKeyOutput;
                  return (
                    <div key={index} className="bg-green-900/30 rounded-xl p-3 border border-green-700 text-green-300 text-sm my-2">
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
                            <th className="text-left px-4 py-3 font-medium">Название</th>
                            <th className="text-center px-3 py-3 font-medium">Размер</th>
                            <th className="text-left px-4 py-3 font-medium">Создан</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backups.map((b, i) => (
                            <tr key={i} className={`border-t border-[#3a3a3a] ${i % 2 === 0 ? "bg-[#2f2f2f]" : "bg-[#252525]"}`}>
                              <td className="px-4 py-2.5 font-mono text-[#8e8ea0]">{b.id}</td>
                              <td className="px-4 py-2.5">{b.name || "—"}</td>
                              <td className="px-3 py-2.5 text-center text-[#8e8ea0]">{b.size_mb} MB</td>
                              <td className="px-4 py-2.5 text-[#8e8ea0] text-xs">{new Date(b.created_at).toLocaleString("ru")}</td>
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
                    <div key={index} className="bg-green-900/30 rounded-xl p-3 border border-green-700 text-green-300 text-sm my-2">
                      {output.message}
                    </div>
                  );
                }

                if (toolName === "restore_backup") {
                  const output = part.output as RestoreBackupOutput;
                  return (
                    <div key={index} className={`rounded-xl p-3 border my-2 text-sm ${output.success ? "bg-green-900/30 border-green-700 text-green-300" : "bg-red-900/30 border-red-700 text-red-300"}`}>
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
                    <div key={index} className="bg-green-900/30 rounded-xl p-3 border border-green-700 text-green-300 text-sm my-2">
                      {output.message} (ID: <span className="font-mono text-xs">{output.id}</span>)
                    </div>
                  );
                }

                if (toolName === "add_firewall_rule") {
                  const output = part.output as AddFirewallRuleOutput;
                  return (
                    <div key={index} className="bg-green-900/30 rounded-xl p-3 border border-green-700 text-green-300 text-sm my-2">
                      {output.message}: {output.direction} {output.protocol}
                      {output.port ? `:${output.port}` : ""} {output.cidr}
                    </div>
                  );
                }

                if (toolName === "delete_firewall" || toolName === "delete_firewall_rule" || toolName === "attach_firewall_to_server") {
                  const output = part.output as { success: boolean; message: string } | AttachFirewallOutput;
                  return (
                    <div key={index} className={`rounded-xl p-3 border my-2 text-sm ${output.success ? "bg-green-900/30 border-green-700 text-green-300" : "bg-red-900/30 border-red-700 text-red-300"}`}>
                      {output.message}
                    </div>
                  );
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
                  <div key={index} className="bg-red-900/30 rounded-xl p-3 border border-red-700 text-red-300 text-sm my-2">
                    Ошибка при выполнении: {toolName}
                    {("errorText" in part) && `: ${(part as { errorText?: string }).errorText}`}
                  </div>
                );
              }
            }

            return null;
          })}
      </div>
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
