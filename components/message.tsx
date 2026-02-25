"use client";

import React from "react";
import type { UIMessage } from "ai";
import { isTextUIPart, isToolUIPart, getToolName } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, RotateCcw } from "lucide-react";
import { ServerCard } from "./server-card";
import { ServerCreateForm } from "./server-create-form";

interface MessageProps {
  message: UIMessage;
  onRetry?: () => void;
  onSendMessage?: (text: string) => void;
}

export function Message({ message, onRetry, onSendMessage }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-3xl w-full gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 bg-[#3a3a3a] rounded-full flex items-center justify-center">
              <User size={18} className="text-[#ececec]" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-[#10a37f] rounded-full flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-2 min-w-0 ${isUser ? "items-end" : "items-start"}`}>
          {isUser && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 text-xs text-[#8e8ea0] hover:text-[#ececec] transition-colors px-2 py-1 rounded-lg hover:bg-[#2f2f2f] order-last mt-1"
              title="Повторить запрос"
            >
              <RotateCcw size={12} />
              Повторить
            </button>
          )}
          {message.parts?.map((part, index) => {
            if (isTextUIPart(part)) {
              // Скрываем системное сообщение подтверждения создания сервера
              if (isUser && part.text.startsWith("Подтверждаю. Создай сервер:")) {
                return null;
              }
              return (
                <div
                  key={index}
                  className={`prose-chat ${
                    isUser ? "bg-[#2f2f2f] px-4 py-3 rounded-2xl rounded-tr-sm" : ""
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            }

            if (isToolUIPart(part)) {
              const toolName = getToolName(part);

              // Показываем спиннер пока tool выполняется
              if (part.state === "input-available" || part.state === "input-streaming") {
                return (
                  <div key={index} className="flex items-center gap-2 text-sm text-[#8e8ea0] my-2">
                    <div className="w-4 h-4 rounded-full border-2 border-t-[#10a37f] border-[#3a3a3a] animate-spin" />
                    Выполняю действие...
                  </div>
                );
              }

              // Показываем результат tool
              if (part.state === "output-available") {
                const output = part.output as any;

                if (toolName === "list_servers" || toolName === "get_server") {
                  const servers = Array.isArray(output) ? output : [output];
                  return (
                    <div key={index} className="flex flex-col gap-2 w-full">
                      {servers.map((s: any, i: number) => (
                        <ServerCard key={i} server={s} />
                      ))}
                    </div>
                  );
                }

                if (toolName === "create_server") {
                  if (output.error) {
                    return (
                      <div key={index} className="bg-red-900/30 rounded-xl p-3 border border-red-700 text-red-300 text-sm my-2">
                        {output.message}
                      </div>
                    );
                  }
                  return <ServerCard key={index} server={output} />;
                }

                if (toolName === "get_balance") {
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
                  return (
                    <ServerCreateForm
                      key={index}
                      data={output}
                      onConfirm={onSendMessage ?? (() => {})}
                    />
                  );
                }

                if (toolName === "list_presets") {
                  const presets = Array.isArray(output) ? output : [];
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
                          {presets.map((p: any, i: number) => (
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
                  const osList = Array.isArray(output) ? output : [];
                  return (
                    <div key={index} className="flex flex-col gap-2 my-2">
                      <div className="text-xs text-[#8e8ea0]">Выберите операционную систему:</div>
                      <div className="flex flex-wrap gap-2">
                        {osList.map((os: any, i: number) => {
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

                // Fallback для неизвестных tools
                return (
                  <div key={index} className="bg-[#171717] rounded-xl p-4 border border-[#3a3a3a] my-2 w-full overflow-x-auto">
                    <div className="text-xs text-[#8e8ea0] mb-2 font-mono uppercase tracking-wide">
                      {toolName}
                    </div>
                    <pre className="text-sm text-[#ececec] whitespace-pre-wrap">
                      {JSON.stringify(output, null, 2)}
                    </pre>
                  </div>
                );
              }

              // output-error
              if (part.state === "output-error") {
                return (
                  <div key={index} className="bg-red-900/30 rounded-xl p-3 border border-red-700 text-red-300 text-sm my-2">
                    Ошибка при выполнении: {toolName}
                    {("errorText" in part) && `: ${(part as any).errorText}`}
                  </div>
                );
              }
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
