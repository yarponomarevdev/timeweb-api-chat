"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, isToolUIPart, getToolName, type UIMessage } from "ai";
import { Server, Plus, Menu, LayoutGrid } from "lucide-react";
import { ChatInput } from "./chat-input";
import { Message } from "./message";
import { ToolCallLog } from "./tool-call-log";
import { QuickActionsGrid } from "./quick-actions-grid";
import { ServerNotificationToast, type ToastMessage } from "./server-notification-toast";
import { useServerMonitor } from "@/hooks/use-server-monitor";
import { QuickViewPanel } from "./quick-view-panel";
import { ServerCard } from "./server-card";
import { useTimeweb } from "@/hooks/use-timeweb";
import { Sidebar } from "./sidebar";
import type { ChatSession } from "@/lib/chat-store";

interface ChatProps {
  timewebToken: string;
  openaiKey: string;
  onChangeToken: () => void;
  initialMessages: UIMessage[];
  sessionId: string | null;
  sessions: ChatSession[];
  onNewChat: () => void;
  onSwitchSession: (id: string) => UIMessage[];
  onDeleteSession: (id: string) => void;
  onSessionUpdate: (sessionId: string | null, messages: UIMessage[]) => void;
}


export function Chat({
  timewebToken,
  openaiKey,
  onChangeToken,
  initialMessages,
  sessionId,
  sessions,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  onSessionUpdate,
}: ChatProps) {
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
      const retryMatch = msg.match(/Retry-After[:\s]+(\d+)/i);
      if (retryMatch) setRetryAfter(Number(retryMatch[1]));

      if (msg.includes("429") || msg.toLowerCase().includes("too many requests")) {
        setErrorMsg("Слишком много запросов к ИИ — подождите немного и попробуйте снова.");
      } else if (msg.includes("401") || msg.toLowerCase().includes("incorrect api key")) {
        setErrorMsg("Ключ OpenAI недействителен. Нажмите «Изменить API-ключ» и введите правильный ключ.");
      } else if (msg.toLowerCase().includes("timeweb api error 401") || msg.toLowerCase().includes("evolvin.cloud api error 401")) {
        setErrorMsg("Токен evolvin.cloud недействителен. Нажмите «Изменить API-ключ» и введите актуальный токен.");
      } else if (msg.toLowerCase().includes("402") || msg.toLowerCase().includes("insufficient")) {
        setErrorMsg("Недостаточно средств на балансе evolvin.cloud. Пополните счёт в личном кабинете.");
      } else if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
        setErrorMsg("Нет подключения к интернету. Проверьте соединение и попробуйте ещё раз.");
      } else {
        console.error("[chat] onError:", msg);
        setErrorMsg("Что-то пошло не так. Попробуйте повторить запрос или проверьте настройки ключей.");
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const [input, setInput] = React.useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showServersPanel, setShowServersPanel] = useState(false);
  const [showPresetsPanel, setShowPresetsPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    servers: cachedServers,
    presets: cachedPresets,
    serversLoading,
    presetsLoading,
    serversError,
    presetsError,
    fetchServers,
    fetchPresets,
  } = useTimeweb(timewebToken);

  // Извлекаем серверы из результатов tool-вызовов для глобального мониторинга
  const monitoredServers = React.useMemo(() => {
    const serverMap = new Map<number, { id: number; name: string; status: string }>();
    for (const msg of messages) {
      for (const part of msg.parts ?? []) {
        if (!isToolUIPart(part) || part.state !== "output-available") continue;
        const toolName = getToolName(part);
        if (toolName !== "list_servers" && toolName !== "get_server") continue;
        const output = (part as { output?: unknown }).output;
        if (!output || typeof output !== "object") continue;
        const servers = Array.isArray(output)
          ? output
          : (output as { servers?: unknown[] }).servers ?? [(output as { server?: unknown }).server].filter(Boolean);
        for (const s of servers) {
          if (s && typeof s === "object" && "id" in s) {
            const srv = s as { id: number; name: string; status: string };
            serverMap.set(srv.id, { id: srv.id, name: srv.name, status: srv.status });
          }
        }
      }
    }
    return Array.from(serverMap.values());
  }, [messages]);

  const handleStatusChange = useCallback(
    (serverId: number, serverName: string, newStatus: string, newLabel: string) => {
      setToasts((prev) => [
        ...prev,
        { id: `${serverId}-${Date.now()}`, serverName, status: newStatus, statusLabel: newLabel, timestamp: Date.now() },
      ]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useServerMonitor(monitoredServers, timewebToken, handleStatusChange);

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
  const shouldFollow = useRef(true);

  // Сохраняем сообщения через колбэк родителя
  useEffect(() => {
    if (messages.length > 0) {
      onSessionUpdate(sessionId, messages);
    }
  }, [messages, sessionId, onSessionUpdate]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

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

  useEffect(() => {
    if (shouldFollow.current) scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

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
    onNewChat();
  };

  const handleRetry = (messageIndex: number, messageText: string) => {
    setMessages((prev) => prev.slice(0, messageIndex));
    sendMessage({ text: messageText });
  };

  const hasMessages = messages.length > 0;
  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf("assistant");

  return (
    <div className="flex bg-[#212121]" style={{ height: "100dvh" }}>

      {/* Сайдбар — десктоп: всегда виден, мобильный: оверлей */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          onAction={handleQuickAction}
          onNewChat={handleNewChat}
          onChangeToken={onChangeToken}
          sessions={sessions}
          activeSessionId={sessionId}
          onSwitchSession={onSwitchSession}
          onDeleteSession={onDeleteSession}
        />
      </div>

      {/* Мобильный оверлей сайдбара */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="flex-shrink-0">
            <Sidebar
              onAction={handleQuickAction}
              onNewChat={handleNewChat}
              onChangeToken={onChangeToken}
              onClose={() => setSidebarOpen(false)}
              sessions={sessions}
              activeSessionId={sessionId}
              onSwitchSession={onSwitchSession}
              onDeleteSession={onDeleteSession}
            />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Основной контент */}
      <div className="flex-1 flex flex-col min-w-0">

      {/* Header — показывается только когда есть сообщения */}
      {hasMessages && (
        <header className="flex items-center justify-between px-4 h-12 border-b border-[#2a2a2a] flex-shrink-0 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
              title="Меню"
            >
              <Menu size={18} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { fetchServers(); setShowServersPanel(true); }}
              className="flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] px-2.5 py-1.5 rounded-lg transition-colors"
              title="Мои серверы"
            >
              <Server size={14} />
              <span className="hidden sm:inline">Серверы</span>
            </button>
            <button
              onClick={() => { fetchPresets(); setShowPresetsPanel(true); }}
              className="flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] px-2.5 py-1.5 rounded-lg transition-colors"
              title="Тарифы"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Тарифы</span>
            </button>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Новый чат</span>
            </button>
          </div>
        </header>
      )}

      {/* Область сообщений */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
        {!hasMessages ? (
          // Стартовый экран
          <div className="h-full flex flex-col items-center justify-center px-4 py-8 relative">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden absolute top-4 left-4 p-2 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
              title="Меню"
            >
              <Menu size={18} />
            </button>
            <div className="w-14 h-14 bg-[#10a37f]/10 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-[#10a37f]/20">
              <Server size={28} className="text-[#10a37f]" />
            </div>
            <h1 className="text-2xl font-bold text-[#ececec] mb-2 text-center">evolvin.cloud</h1>
            <p className="text-[#8e8ea0] text-sm max-w-xs leading-relaxed mb-8 text-center">
              Управляй серверами evolvin.cloud через естественный язык
            </p>
            <QuickActionsGrid onAction={handleQuickAction} />
          </div>
        ) : (
          // Список сообщений
          <div className="max-w-2xl mx-auto px-4 py-6">
            {messages.map((m, i) => {
              const userText = m.parts?.find((p) => isTextUIPart(p))?.text ?? "";
              const isLastAssistantMessage = m.role === "assistant" && i === lastAssistantIndex;
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
                  showSuggestions={isLastAssistantMessage}
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
        />
      </div>

      {/* Уведомления о состоянии серверов */}
      <ServerNotificationToast toasts={toasts} onDismiss={dismissToast} />

      {/* Панель серверов */}
      <QuickViewPanel
        title="Мои серверы"
        isOpen={showServersPanel}
        onClose={() => setShowServersPanel(false)}
        onRefresh={() => fetchServers(true)}
        isLoading={serversLoading}
        error={serversError}
      >
        {cachedServers && cachedServers.length === 0 && (
          <p className="text-[#8e8ea0] text-sm text-center py-8">Серверов нет</p>
        )}
        {cachedServers?.map((s) => (
          <ServerCard
            key={s.id}
            server={s}
            onAction={(text) => { handleQuickAction(text); setShowServersPanel(false); }}
            timewebToken={timewebToken}
          />
        ))}
      </QuickViewPanel>

      {/* Панель тарифов */}
      <QuickViewPanel
        title="Тарифы"
        isOpen={showPresetsPanel}
        onClose={() => setShowPresetsPanel(false)}
        onRefresh={() => fetchPresets(true)}
        isLoading={presetsLoading}
        error={presetsError}
      >
        {cachedPresets && (
          <div className="flex flex-col gap-2">
            {cachedPresets.map((p) => (
              <div key={p.id} className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] p-3 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-[#ececec]">{p.description}</span>
                  <span className="text-xs text-[#8e8ea0]">
                    {p.cpu} CPU · {p.ram_gb} ГБ RAM · {p.disk_gb} ГБ
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-semibold text-[#10a37f]">{p.price_per_month} ₽/мес</span>
                  <button
                    onClick={() => { handleQuickAction(`Создай сервер с тарифом ${p.ram_gb} ГБ RAM и ${p.disk_gb} ГБ диском`); setShowPresetsPanel(false); }}
                    className="text-xs text-[#8e8ea0] hover:text-[#10a37f] transition-colors"
                  >
                    Выбрать →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </QuickViewPanel>
      </div>
    </div>
  );
}
