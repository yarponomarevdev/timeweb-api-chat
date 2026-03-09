"use client";

import { useState, useCallback, useEffect } from "react";
import type { UIMessage } from "ai";
import {
  type ChatSession,
  getSessions,
  saveSession,
  deleteSession as deleteSessionFromStore,
  getMessages,
  saveMessages,
  deleteMessages,
  getActiveSessionId,
  setActiveSessionId,
  createNewSession,
  migrateOldMessages,
} from "@/lib/chat-store";

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  // Инициализация: миграция + загрузка
  useEffect(() => {
    migrateOldMessages();
    const loaded = getSessions();
    setSessions(loaded);
    const activeId = getActiveSessionId();
    if (activeId && loaded.some((s) => s.id === activeId)) {
      setActiveId(activeId);
      setInitialMessages(getMessages(activeId));
    }
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setActiveId(id);
    const msgs = getMessages(id);
    setInitialMessages(msgs);
    return msgs;
  }, []);

  const startNewSession = useCallback(() => {
    // Не создаём сессию в хранилище — она появится при первом сообщении
    setActiveSessionId(null);
    setActiveId(null);
    setInitialMessages([]);
    return null;
  }, []);

  const removeSession = useCallback(
    (id: string) => {
      deleteSessionFromStore(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setActiveId(null);
        setInitialMessages([]);
      }
    },
    [activeSessionId]
  );

  const updateSession = useCallback(
    (sessionId: string | null, messages: UIMessage[]) => {
      if (messages.length === 0) return;

      let id = sessionId;

      // Если нет активной сессии — создаём новую
      if (!id) {
        const firstUserMsg = messages.find((m) => m.role === "user");
        const firstText = firstUserMsg?.parts?.find(
          (p) => "type" in p && p.type === "text"
        );
        const text =
          firstText && "text" in firstText
            ? (firstText as { text: string }).text
            : undefined;
        const session = createNewSession(text);
        session.messageCount = messages.length;
        id = session.id;
        saveSession(session);
        saveMessages(id, messages);
        setActiveSessionId(id);
        setActiveId(id);
        setSessions(getSessions());
        return;
      }

      // Обновляем существующую сессию
      saveMessages(id, messages);
      const all = getSessions();
      const existing = all.find((s) => s.id === id);
      if (existing) {
        existing.updatedAt = Date.now();
        existing.messageCount = messages.length;
        saveSession(existing);
      }
    },
    []
  );

  return {
    sessions,
    activeSessionId,
    initialMessages,
    switchSession,
    startNewSession,
    removeSession,
    updateSession,
  };
}
