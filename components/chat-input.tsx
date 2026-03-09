"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const newHeight = Math.min(el.scrollHeight, 200);
      el.style.height = `${newHeight}px`;
      // Скрываем scroll indicator пока контент не достиг max-height
      el.style.overflowY = newHeight >= 200 ? "auto" : "hidden";
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
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
        placeholder="Напишите запрос..."
        className="w-full max-h-[200px] bg-transparent text-[#ececec] placeholder-[#8e8ea0] resize-none focus:outline-none p-2 no-scrollbar"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        aria-label="Отправить сообщение"
        className="ml-2 mb-1 p-2 rounded-xl bg-[#10a37f] text-white disabled:bg-[#3a3a3a] disabled:text-[#555] hover:bg-[#0e9572] transition-colors flex-shrink-0"
      >
        <ArrowUp size={20} />
      </button>
    </form>
  );
}
