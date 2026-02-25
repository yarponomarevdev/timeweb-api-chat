"use client";

import React from "react";
import type { UIMessage } from "ai";
import { isTextUIPart, isToolUIPart, getToolName } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { ServerCard } from "./server-card";

interface MessageProps {
  message: UIMessage;
}

export function Message({ message }: MessageProps) {
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
          {message.parts?.map((part, index) => {
            if (isTextUIPart(part)) {
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

                // Fallback — остальные tools (list_presets, list_os)
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
