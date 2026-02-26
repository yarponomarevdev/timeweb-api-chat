"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { Server, Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
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

export function Chat() {
  const [initialMessages] = useState<UIMessage[]>(loadMessages);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    initialMessages,
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

  return (
    <div className="flex h-screen w-full bg-[#212121] overflow-hidden">
      {/* Overlay для мобильного sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: фиксированный overlay на мобиле, статичный на десктопе */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 transition-transform duration-200
          md:relative md:translate-x-0 md:flex md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          onNewChat={handleNewChat}
          onQuickAction={handleQuickAction}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 h-full relative min-w-0">
        {/* Мобильный хедер с hamburger */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3a3a3a] md:hidden flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[#2f2f2f] text-[#8e8ea0] hover:text-[#ececec] transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Server size={18} className="text-[#10a37f]" />
            <span className="font-semibold text-sm">Timeweb Manager</span>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-[#2f2f2f] rounded-2xl flex items-center justify-center mb-6">
                <Server size={32} className="text-[#10a37f]" />
              </div>
              <h1 className="text-3xl font-bold text-[#ececec] mb-2">Timeweb Manager</h1>
              <p className="text-[#8e8ea0] mb-8">Управляй серверами через естественный язык</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  "Покажи все мои серверы",
                  "Какой у меня баланс?",
                  "Какие есть тарифы?",
                  "Создай сервер Ubuntu 2GB",
                ].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => handleQuickAction(hint)}
                    className="bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-[#3a3a3a] rounded-xl p-4 text-left transition-colors text-sm text-[#ececec]"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col pb-24">
              {messages.map((m, i) => {
                const userText =
                  m.parts?.find((p) => isTextUIPart(p))?.text ?? "";
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
                <div className="flex items-center gap-2 text-[#8e8ea0] text-sm mb-4">
                  <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.3s]" />
                  <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.5s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10 pb-6 px-4">
          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={onSubmit}
          />
          <div className="text-center text-xs text-[#8e8ea0] mt-3">
            AI может допускать ошибки. Проверяйте важную информацию.
          </div>
        </div>
      </div>
    </div>
  );
}
