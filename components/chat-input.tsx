"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp, Mic, Loader2 } from "lucide-react";
import type { VoiceState } from "@/hooks/use-voice";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  hasMessages?: boolean;
  onClear?: () => void;
  isCentered?: boolean;
  // Голосовой ввод
  voiceState?: VoiceState;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isVoiceSupported?: boolean;
  recordingSeconds?: number;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  hasMessages,
  onClear,
  isCentered,
  voiceState = "idle",
  onStartRecording,
  onStopRecording,
  isVoiceSupported,
  recordingSeconds = 0,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const maxHeight = isCentered ? 300 : 200;
      const newHeight = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${newHeight}px`;
      el.style.overflowY = newHeight >= maxHeight ? "auto" : "hidden";
    }
  }, [input, isCentered]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const isRecording = voiceState === "recording";
  const isTranscribing = voiceState === "transcribing";
  const showVoiceButton = isVoiceSupported && onStartRecording && onStopRecording;

  const handleMicClick = () => {
    if (isRecording) {
      onStopRecording?.();
    } else if (voiceState === "idle") {
      onStartRecording?.();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex items-end w-full max-w-3xl mx-auto bg-[#2f2f2f] border border-[#3a3a3a] rounded-2xl p-2 shadow-lg"
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        placeholder={isRecording ? "Говорите..." : isTranscribing ? "Распознавание..." : "Напишите запрос..."}
        className="w-full bg-transparent text-[#ececec] placeholder-[#8e8ea0] resize-none focus:outline-none p-2 no-scrollbar"
        style={{ minHeight: isCentered ? "80px" : undefined, maxHeight: isCentered ? "300px" : "200px" }}
        rows={1}
        disabled={isLoading || isRecording || isTranscribing}
      />
      <div className="flex items-end gap-1 flex-shrink-0">
        {/* Таймер записи */}
        {isRecording && recordingSeconds > 0 && (
          <span className="text-xs text-red-400 mb-2.5 mr-1 tabular-nums">
            {formatTime(recordingSeconds)}
          </span>
        )}
        {/* Кнопка микрофона */}
        {showVoiceButton && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isTranscribing || isLoading}
            aria-label={isRecording ? "Остановить запись" : "Записать голосовое сообщение"}
            aria-pressed={isRecording}
            className={`mb-1 p-2 rounded-xl transition-colors flex-shrink-0 ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : isTranscribing
                  ? "bg-[#3a3a3a] text-[#555]"
                  : "bg-[#3a3a3a] text-[#8e8ea0] hover:bg-[#10a37f] hover:text-white"
            }`}
          >
            {isTranscribing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Mic size={20} />
            )}
          </button>
        )}
        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={isLoading || !input.trim() || isRecording || isTranscribing}
          aria-label="Отправить сообщение"
          className="mb-1 p-2 rounded-xl bg-[#10a37f] text-white disabled:bg-[#3a3a3a] disabled:text-[#555] hover:bg-[#0e9572] transition-colors flex-shrink-0"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </form>
  );
}
