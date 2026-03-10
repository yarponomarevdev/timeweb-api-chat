"use client";

import { motion } from "framer-motion";

const CHIPS = [
  "Мои серверы",
  "Создать сервер",
  "Баланс",
  "SSH-ключи",
  "Бэкапы",
  "Маркетплейс",
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap gap-2 justify-center max-w-md"
    >
      {CHIPS.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="px-3 py-1.5 rounded-full text-sm text-[#8e8ea0] bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#10a37f44] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
        >
          {text}
        </button>
      ))}
    </motion.div>
  );
}
