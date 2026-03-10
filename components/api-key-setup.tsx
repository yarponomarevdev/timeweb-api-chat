"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ExternalLink, ShieldCheck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ParticlesBg } from "./particles-bg";

interface ApiKeySetupProps {
  initialTimewebKey?: string;
  initialOpenaiKey?: string;
  onSave: (timewebKey: string, openaiKey: string) => void;
  onCancel?: () => void;
}

export function ApiKeySetup({ initialTimewebKey = "", initialOpenaiKey = "", onSave, onCancel }: ApiKeySetupProps) {
  const [timewebKey, setTimewebKey] = useState(initialTimewebKey);
  const [openaiKey, setOpenaiKey] = useState(initialOpenaiKey);
  const [showTimeweb, setShowTimeweb] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [errors, setErrors] = useState<{ timeweb?: string; openai?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { timeweb?: string; openai?: string } = {};
    if (!timewebKey.trim()) errs.timeweb = "Обязательное поле";
    if (!openaiKey.trim()) errs.openai = "Обязательное поле";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(timewebKey.trim(), openaiKey.trim());
  };

  const timewebWarning = timewebKey && !timewebKey.startsWith("eyJ")
    ? "Токен обычно начинается с eyJ"
    : null;
  const openaiWarning = openaiKey && !openaiKey.startsWith("sk-")
    ? "Ключ OpenAI обычно начинается с sk-"
    : null;

  return (
    <div className="relative min-h-screen bg-[#212121] flex items-center justify-center p-4 overflow-hidden">
      <ParticlesBg active={true} />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Заголовок */}
        <div className="flex flex-col items-center mb-10">
          {onCancel && (
            <button
              onClick={onCancel}
              className="self-start mb-6 flex items-center gap-1.5 text-sm text-[#555] hover:text-[#8e8ea0] transition-colors"
            >
              <ArrowLeft size={14} />
              Назад
            </button>
          )}
          <motion.h1
            className="text-3xl font-bold text-[#ececec] mb-2 tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
          >
            evolvin.cloud
          </motion.h1>
          <motion.p
            className="text-[#555] text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.12 }}
          >
            {onCancel ? "Изменить API-ключи" : "Настройка подключения"}
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* evolvin.cloud API */}
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.14 }}
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#8e8ea0]">
                Timeweb API
              </label>
              <a
                href="https://timeweb.cloud/my/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#555] hover:text-[#10a37f] flex items-center gap-1 transition-colors"
              >
                Получить ключ <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showTimeweb ? "text" : "password"}
                value={timewebKey}
                onChange={(e) => { setTimewebKey(e.target.value); setErrors(p => ({ ...p, timeweb: undefined })); }}
                placeholder="eyJ..."
                autoFocus
                autoComplete="off"
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3.5 pr-12 text-[#ececec] placeholder-[#3a3a3a] text-sm focus:outline-none transition-colors font-mono ${
                  errors.timeweb
                    ? "border-red-500 focus:border-red-400"
                    : "border-[#2a2a2a] focus:border-[#10a37f]"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowTimeweb(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#8e8ea0] transition-colors"
              >
                {showTimeweb ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.timeweb && <p className="text-red-400 text-xs pl-1">{errors.timeweb}</p>}
            {!errors.timeweb && timewebWarning && (
              <p className="text-yellow-600/70 text-xs pl-1">{timewebWarning}</p>
            )}
          </motion.div>

          {/* OpenAI API */}
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#8e8ea0]">
                OpenAI API
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#555] hover:text-[#10a37f] flex items-center gap-1 transition-colors"
              >
                Получить ключ <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showOpenai ? "text" : "password"}
                value={openaiKey}
                onChange={(e) => { setOpenaiKey(e.target.value); setErrors(p => ({ ...p, openai: undefined })); }}
                placeholder="sk-..."
                autoComplete="off"
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3.5 pr-12 text-[#ececec] placeholder-[#3a3a3a] text-sm focus:outline-none transition-colors font-mono ${
                  errors.openai
                    ? "border-red-500 focus:border-red-400"
                    : "border-[#2a2a2a] focus:border-[#10a37f]"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowOpenai(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#8e8ea0] transition-colors"
              >
                {showOpenai ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.openai && <p className="text-red-400 text-xs pl-1">{errors.openai}</p>}
            {!errors.openai && openaiWarning && (
              <p className="text-yellow-600/70 text-xs pl-1">{openaiWarning}</p>
            )}
          </motion.div>

          {/* Кнопка */}
          <motion.button
            type="submit"
            className="w-full bg-[#10a37f] hover:bg-[#0e9572] active:bg-[#0b7a60] text-white font-medium py-3.5 rounded-xl transition-colors text-sm mt-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.26 }}
          >
            {onCancel ? "Сохранить" : "Начать пользоваться"}
          </motion.button>

        </form>

        {/* Безопасность и регистрация */}
        <motion.div
          className="mt-6 flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.32 }}
        >
          <div className="flex items-center gap-2 text-xs text-[#8e8ea0] justify-center">
            <ShieldCheck size={13} className="text-[#10a37f]" />
            Ключи хранятся только в вашем браузере
          </div>

          {!onCancel && (
            <div className="border-t border-[#222] pt-5 mt-1 text-center">
              <p className="text-xs text-[#8e8ea0] mb-2">Нет аккаунта на Timeweb?</p>
              <a
                href="https://timeweb.cloud/?i=128621"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#10a37f] hover:text-[#0e9572] transition-colors"
              >
                Зарегистрироваться на Timeweb и получить x2 на первое пополнение
                <ExternalLink size={10} />
              </a>
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
