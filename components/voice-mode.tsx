"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import type { UIMessage } from "ai";
import { isTextUIPart, isToolUIPart } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceMode } from "@/hooks/use-voice-mode";
import { VoiceWaveform } from "./voice-waveform";
import { Mic, MicOff, LayoutGrid } from "lucide-react";

interface VoiceModeProps {
  openaiKey: string;
  messages: UIMessage[];
  sendMessage: (opts: { text: string }) => void;
  status: string;
  onClose: () => void;
}

const STATE_LABELS: Record<string, string> = {
  idle: "Слушаю...",
  listening: "Говорите...",
  processing: "Обрабатываю...",
  speaking: "Отвечаю...",
};

export function VoiceMode({ openaiKey, messages, sendMessage, status, onClose }: VoiceModeProps) {
  const [initialized, setInitialized] = useState(false);
  const [modeTransition, setModeTransition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vadEnabled, setVadEnabled] = useState(true);
  const [lastTranscription, setLastTranscription] = useState<string | null>(null);

  const isLoading = status === "streaming" || status === "submitted";

  const handleTranscription = useCallback((text: string) => {
    setLastTranscription(text);
    sendMessage({ text });
  }, [sendMessage]);

  const voice = useVoiceMode({
    openaiKey,
    onTranscription: handleTranscription,
    enabled: vadEnabled && !isLoading,
  });

  // Инициализация микрофона при монтировании
  useEffect(() => {
    if (initialized) return;
    voice.start()
      .then(() => setInitialized(true))
      .catch(() => setError("Разрешите доступ к микрофону"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Извлекаем текст из последнего ответа ассистента для TTS
  const prevStatusRef = useRef(status);
  const spokenMsgIds = useRef(new Set<string>());

  useEffect(() => {
    const wasLoading = prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    prevStatusRef.current = status;

    if (status !== "ready" || !wasLoading || messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || spokenMsgIds.current.has(last.id)) return;
    spokenMsgIds.current.add(last.id);

    // Собираем текст из text-частей
    const textParts = last.parts?.filter(isTextUIPart) ?? [];
    let text = textParts.map((p) => p.text).join("\n");

    // Добавляем краткое описание tool-результатов
    const toolParts = last.parts?.filter(isToolUIPart) ?? [];
    for (const part of toolParts) {
      if (part.state !== "output-available") continue;
      const output = (part as { output?: unknown }).output;
      if (!output || typeof output !== "object") continue;
      if (text.length > 50) continue;
      if ("error" in (output as Record<string, unknown>)) {
        const errMsg = (output as { message?: string }).message;
        if (errMsg) text += ` Ошибка: ${errMsg}`;
      }
    }

    // Очистка markdown
    text = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      .replace(/^---+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 4096);

    if (text) {
      voice.speak(text);
    } else {
      voice.setState("idle");
    }
  }, [status, messages, voice]);

  // Состояние для отображения
  const displayState = isLoading && voice.state !== "speaking"
    ? "processing"
    : voice.state;

  const handleGoToChat = () => {
    setModeTransition(true);
    voice.stop();
    setTimeout(() => onClose(), 400);
  };

  return (
    <div className="fixed inset-0 bg-[#212121] flex flex-col items-center justify-center z-50">
      {/* Верхняя панель: табы */}
      <motion.div
        className="absolute top-6 left-0 right-0 flex items-center justify-center z-10 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-center bg-[#2a2a2a] rounded-xl p-1">
          <button
            onClick={handleGoToChat}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-[#8e8ea0] hover:text-[#ececec] transition-colors"
          >
            <LayoutGrid size={15} />
            Чат
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-[#3a3a3a] text-[#ececec]">
            <Mic size={15} />
            Голос
          </button>
        </div>
      </motion.div>

      {/* Визуализация */}
      <motion.div
        className="w-full max-w-2xl px-8 flex-1 flex flex-col items-center justify-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h1 className="text-2xl font-bold text-[#ececec]">evolvin.cloud</h1>
          <p className="text-sm text-[#8e8ea0] mt-1">Голосовой режим</p>
        </motion.div>

        <motion.div
          className="w-full"
          initial={{ opacity: 1, scaleY: 1 }}
          animate={{ opacity: 1, scaleY: 1 }}
        >
          <VoiceWaveform
            state={displayState}
            micAnalyserRef={voice.micAnalyserRef}
            speakerAnalyserRef={voice.speakerAnalyserRef}
          />
        </motion.div>

        {/* Кнопка микрофона под волной */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
        >
          <button
            onClick={() => setVadEnabled((v) => !v)}
            className={`p-5 rounded-full transition-all duration-300 ${
              vadEnabled
                ? "bg-[#10a37f] text-white shadow-[0_0_30px_rgba(16,163,127,0.4)]"
                : "bg-[#3a3a3a] text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#444]"
            }`}
            aria-label={vadEnabled ? "Выключить микрофон" : "Включить микрофон"}
          >
            {vadEnabled ? <Mic size={28} /> : <MicOff size={28} />}
          </button>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <p className={`text-sm transition-colors ${
              displayState === "listening" ? "text-[#10a37f]" :
              displayState === "speaking" ? "text-[#ececec]" :
              "text-[#8e8ea0]"
            }`}>
              {STATE_LABELS[displayState] ?? "Слушаю..."}
            </p>
          )}

          {lastTranscription && (
            <p className="text-xs text-[#555] mt-3 max-w-md mx-auto truncate">
              &laquo;{lastTranscription}&raquo;
            </p>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        className="pb-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <p className="text-xs text-[#444]">
          Просто говорите — я автоматически распознаю вашу речь
        </p>
      </motion.div>

      {/* Анимация перехода в чат */}
      <AnimatePresence>
        {modeTransition && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.div
              className="absolute inset-0 bg-[#212121]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 rounded-full border-2 border-[#10a37f]"
              initial={{ width: 600, height: 600, x: "-50%", y: "-50%", opacity: 0.6 }}
              animate={{ width: 0, height: 0, x: "-50%", y: "-50%", opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeIn" }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 flex items-center justify-center"
              initial={{ scale: 1, x: "-50%", y: "-50%", opacity: 1 }}
              animate={{ scale: 0, x: "-50%", y: "-50%", opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                <LayoutGrid size={28} className="text-[#ececec]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
