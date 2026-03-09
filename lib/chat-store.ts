import type { UIMessage } from "ai";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

const SESSIONS_KEY = "chat_sessions";
const ACTIVE_KEY = "chat_active";
const MSG_PREFIX = "chat_msg_";
const OLD_KEY = "chat_messages";
const MAX_SESSIONS = 50;

// --- Индекс сессий ---

export function getSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as ChatSession[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // QuotaExceeded — удаляем старейшую сессию
    evictOldest(sessions);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }
}

export function saveSession(session: ChatSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  enforceLimits(sessions);
  saveSessions(sessions);
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
  deleteMessages(id);
  // Если удалили активную — сбрасываем
  if (getActiveSessionId() === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

// --- Сообщения ---

export function getMessages(id: string): UIMessage[] {
  try {
    const raw = localStorage.getItem(MSG_PREFIX + id);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveMessages(id: string, messages: UIMessage[]): void {
  try {
    localStorage.setItem(MSG_PREFIX + id, JSON.stringify(messages));
  } catch {
    // QuotaExceeded — удаляем старейшую сессию и повторяем
    const sessions = getSessions();
    evictOldest(sessions, id);
    saveSessions(sessions);
    try {
      localStorage.setItem(MSG_PREFIX + id, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }
}

export function deleteMessages(id: string): void {
  try {
    localStorage.removeItem(MSG_PREFIX + id);
  } catch {
    // ignore
  }
}

// --- Активная сессия ---

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  } catch {
    // ignore
  }
}

// --- Создание сессии ---

export function createNewSession(firstMessage?: string): ChatSession {
  const title = firstMessage
    ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "")
    : "Новый чат";
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };
}

// --- Миграция со старого формата ---

export function migrateOldMessages(): void {
  try {
    const old = localStorage.getItem(OLD_KEY);
    if (!old) return;
    const messages = JSON.parse(old) as UIMessage[];
    if (!messages.length) {
      localStorage.removeItem(OLD_KEY);
      return;
    }
    // Берём текст первого пользовательского сообщения для заголовка
    const firstUserMsg = messages.find((m) => m.role === "user");
    const firstText =
      firstUserMsg?.parts?.find((p) => "type" in p && p.type === "text")
    const text = firstText && "text" in firstText ? (firstText as { text: string }).text : undefined;
    const session = createNewSession(text);
    session.messageCount = messages.length;
    saveMessages(session.id, messages);
    saveSession(session);
    setActiveSessionId(session.id);
    localStorage.removeItem(OLD_KEY);
  } catch {
    // ignore
  }
}

// --- Лимиты ---

function enforceLimits(sessions: ChatSession[]): void {
  while (sessions.length > MAX_SESSIONS) {
    evictOldest(sessions);
  }
}

function evictOldest(sessions: ChatSession[], protectId?: string): void {
  const activeId = protectId ?? getActiveSessionId();
  // Ищем самую старую неактивную сессию
  let oldestIdx = -1;
  let oldestTime = Infinity;
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].id === activeId) continue;
    if (sessions[i].updatedAt < oldestTime) {
      oldestTime = sessions[i].updatedAt;
      oldestIdx = i;
    }
  }
  if (oldestIdx >= 0) {
    const removed = sessions.splice(oldestIdx, 1)[0];
    deleteMessages(removed.id);
  }
}

// --- Утилиты ---

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "только что";
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} нед. назад`;
  return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
