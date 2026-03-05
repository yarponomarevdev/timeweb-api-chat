"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { Server, Plus, Key } from "lucide-react";
import { ChatInput } from "./chat-input";
import { Message } from "./message";
import { ToolCallLog } from "./tool-call-log";

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


export function Chat({ timewebToken, openaiKey, onChangeToken }: ChatProps) {
  const [initialMessages] = useState<UIMessage[]>(loadMessages);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [retryAfter, setRetryAfter] = React.useState<number>(0);

  // Обратный отсчёт rate-limit
  React.useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => setRetryAfter((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { timewebToken, openaiKey },
    }),
    messages: initialMessages,
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      // Пробуем извлечь Retry-After из текста ошибки (SDK может его прокинуть)
      const retryMatch = msg.match(/Retry-After[:\s]+(\d+)/i);
      if (retryMatch) setRetryAfter(Number(retryMatch[1]));

      if (msg.includes("429") || msg.toLowerCase().includes("too many requests")) {
        setErrorMsg("Слишком много запросов. Подождите минуту.");
      } else if (msg.includes("401") || msg.toLowerCase().includes("incorrect api key")) {
        setErrorMsg("Неверный ключ OpenAI. Проверьте настройки.");
      } else if (msg.toLowerCase().includes("timeweb api error 401")) {
        setErrorMsg("Неверный токен Timeweb. Обновите ключи.");
      } else if (msg.toLowerCase().includes("402") || msg.toLowerCase().includes("insufficient")) {
        setErrorMsg("Недостаточно средств на балансе Timeweb.");
      } else if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
        setErrorMsg("Нет соединения. Проверьте интернет.");
      } else {
        setErrorMsg("Не удалось получить ответ. Проверьте ключи API и попробуйте ещё раз.");
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const [input, setInput] = React.useState("");

  // Таймаут 60 секунд — если AI завис, показываем ошибку
  React.useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setErrorMsg("Превышено время ожидания. Попробуйте ещё раз.");
    }, 60_000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // true = следить за новыми сообщениями; false = пользователь прокрутил вверх
  const shouldFollow = useRef(true);

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

  // Слушаем ручную прокрутку: если ушли вверх — отключаем следование
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldFollow.current = distFromBottom < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Прокручиваем вниз при каждом изменении сообщений, если следование включено
  useEffect(() => {
    if (shouldFollow.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    shouldFollow.current = true;
    setErrorMsg(null);
    sendMessage({ text: input });
    setInput("");
  };

  const handleQuickAction = (text: string) => {
    shouldFollow.current = true;
    setErrorMsg(null);
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
                  timewebToken={timewebToken}
                />
              );
            })}
            {isLoading && !errorMsg && (
              <div className="flex items-center gap-1.5 text-[#8e8ea0] py-4 pl-1">
                <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.3s]" />
                <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.5s]" />
              </div>
            )}
            {(errorMsg || retryAfter > 0) && (
              <div className="flex items-center justify-between gap-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 my-2 text-sm text-red-300">
                <span>
                  {retryAfter > 0
                    ? `Запросы временно ограничены. Следующий запрос через ${retryAfter} сек.`
                    : errorMsg}
                </span>
                <button
                  onClick={() => { setErrorMsg(null); setRetryAfter(0); }}
                  className="text-red-400 hover:text-red-200 transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Панель вызовов инструментов */}
      {hasMessages && <ToolCallLog messages={messages} />}

      {/* Нижняя панель — прилипает к низу */}
      <div
        className="flex-shrink-0 bg-[#212121] border-t border-[#2a2a2a] px-4 pt-3"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {/* Строка ввода */}
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={onSubmit}
          onAction={handleQuickAction}
        />

        {/* Дисклеймер */}
        <p className="text-center text-xs text-[#5a5a6a] mt-2">
          AI может допускать ошибки. Проверяйте важную информацию.
        </p>
      </div>
    </div>
  );
}
