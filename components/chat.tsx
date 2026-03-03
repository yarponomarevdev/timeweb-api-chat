"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { Server, Plus, Key } from "lucide-react";
import { ChatInput } from "./chat-input";
import { Message } from "./message";

const STORAGE_KEY = "chat_messages";

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

interface ChatProps {
  timewebToken: string;
  openaiKey: string;
  onChangeToken: () => void;
}

const QUICK_ACTIONS = [
  "Покажи серверы",
  "Мой баланс",
  "Тарифы",
  "Создай сервер",
];

export function Chat({ timewebToken, openaiKey, onChangeToken }: ChatProps) {
  const [initialMessages] = useState<UIMessage[]>(loadMessages);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { timewebToken, openaiKey },
    }),
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";
  const [input, setInput] = React.useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Сохраняем сообщения в localStorage при каждом изменении
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // ignore quota errors
      }
    }
  }, [messages]);

  // Scroll-lock: прокручиваем вниз только если пользователь уже внизу
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  useEffect(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleQuickAction = (text: string) => {
    sendMessage({ text });
  };

  const handleNewChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleRetry = (messageIndex: number, messageText: string) => {
    setMessages((prev) => prev.slice(0, messageIndex));
    sendMessage({ text: messageText });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col bg-[#212121]" style={{ height: "100dvh" }}>

      {/* Header — показывается только когда есть сообщения */}
      {hasMessages && (
        <header className="flex items-center justify-between px-4 h-14 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#10a37f]/15 rounded-lg flex items-center justify-center">
              <Server size={15} className="text-[#10a37f]" />
            </div>
            <span className="font-semibold text-sm text-[#ececec]">Timeweb Manager</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Новый чат</span>
            </button>
            <button
              onClick={onChangeToken}
              className="p-2 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
              title="Изменить API-ключ"
            >
              <Key size={15} />
            </button>
          </div>
        </header>
      )}

      {/* Область сообщений */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
        {!hasMessages ? (
          // Стартовый экран
          <div className="h-full flex flex-col items-center justify-center px-4 text-center">
            <div className="w-14 h-14 bg-[#10a37f]/10 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-[#10a37f]/20">
              <Server size={28} className="text-[#10a37f]" />
            </div>
            <h1 className="text-2xl font-bold text-[#ececec] mb-2">Timeweb Manager</h1>
            <p className="text-[#8e8ea0] text-sm max-w-xs leading-relaxed mb-8">
              Управляй серверами Timeweb через естественный язык
            </p>
            <button
              onClick={onChangeToken}
              className="flex items-center gap-1.5 text-xs text-[#5a5a6a] hover:text-[#8e8ea0] transition-colors"
            >
              <Key size={11} />
              Изменить API-ключ
            </button>
          </div>
        ) : (
          // Список сообщений
          <div className="max-w-2xl mx-auto px-4 py-6">
            {messages.map((m, i) => {
              const userText = m.parts?.find((p) => isTextUIPart(p))?.text ?? "";
              return (
                <Message
                  key={m.id}
                  message={m}
                  onRetry={
                    m.role === "user" && !isLoading
                      ? () => handleRetry(i, userText)
                      : undefined
                  }
                  onSendMessage={!isLoading ? handleQuickAction : undefined}
                />
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-[#8e8ea0] py-4 pl-1">
                <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.3s]" />
                <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.5s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Нижняя панель — прилипает к низу */}
      <div
        className="flex-shrink-0 bg-[#212121] border-t border-[#2a2a2a] px-4 pt-3"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {/* Быстрые действия */}
        <div className="max-w-2xl mx-auto flex gap-2 mb-3 overflow-x-auto no-scrollbar px-1">
          {QUICK_ACTIONS.map((hint) => (
            <button
              key={hint}
              onClick={() => handleQuickAction(hint)}
              disabled={isLoading}
              className="bg-[#2a2a2a] hover:bg-[#333333] border border-[#363636] rounded-full px-4 py-1.5 transition-colors text-sm text-[#c0c0c8] hover:text-[#ececec] whitespace-nowrap flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hint}
            </button>
          ))}
        </div>

        {/* Строка ввода */}
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={onSubmit}
        />

        {/* Дисклеймер */}
        <p className="text-center text-xs text-[#5a5a6a] mt-2">
          AI может допускать ошибки. Проверяйте важную информацию.
        </p>
      </div>
    </div>
  );
}
