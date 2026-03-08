"use client";

import React, { useState } from "react";
import { Server, Eye, EyeOff, ExternalLink, Sparkles, ShieldCheck } from "lucide-react";

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

  // Предупреждения о формате (не блокируют отправку)
  const timewebWarning = timewebKey && !timewebKey.startsWith("eyJ")
    ? "Токен evolvin.cloud обычно начинается с eyJ (JWT)"
    : null;
  const openaiWarning = openaiKey && !openaiKey.startsWith("sk-")
    ? "OpenAI ключ обычно начинается с sk-"
    : null;

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Логотип */}
        <div className="flex flex-col items-center mb-8">
          {onCancel && (
            <button
              onClick={onCancel}
              className="self-start mb-4 flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] transition-colors"
            >
              ← Назад
            </button>
          )}
          <div className="w-12 h-12 bg-[#10a37f]/10 ring-1 ring-[#10a37f]/25 rounded-2xl flex items-center justify-center mb-4">
            <Server size={24} className="text-[#10a37f]" />
          </div>
          <h1 className="text-xl font-bold text-[#ececec]">evolvin.cloud</h1>
          <p className="text-[#5a5a6a] text-sm mt-1">{onCancel ? "Изменить API-ключи" : "Настройка подключения"}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* evolvin.cloud API */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#8e8ea0] uppercase tracking-wider">
                evolvin.cloud API
              </label>
              <a
                href="https://timeweb.cloud/my/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#10a37f]/70 hover:text-[#10a37f] flex items-center gap-1 transition-colors"
              >
                Получить <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showTimeweb ? "text" : "password"}
                value={timewebKey}
                onChange={(e) => { setTimewebKey(e.target.value); setErrors(p => ({ ...p, timeweb: undefined })); }}
                placeholder="Вставьте токен..."
                autoFocus
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 pr-11 text-[#ececec] placeholder-[#444] text-sm focus:outline-none transition-colors font-mono ${
                  errors.timeweb ? "border-red-500/50" : "border-[#2f2f2f] focus:border-[#10a37f]/50"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowTimeweb(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#8e8ea0] transition-colors"
              >
                {showTimeweb ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.timeweb && <p className="text-red-400/80 text-xs pl-1">{errors.timeweb}</p>}
            {!errors.timeweb && timewebWarning && (
              <p className="text-yellow-500/70 text-xs pl-1">{timewebWarning}</p>
            )}
          </div>

          {/* OpenAI API */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#8e8ea0] uppercase tracking-wider">
                OpenAI API
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#10a37f]/70 hover:text-[#10a37f] flex items-center gap-1 transition-colors"
              >
                Получить <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showOpenai ? "text" : "password"}
                value={openaiKey}
                onChange={(e) => { setOpenaiKey(e.target.value); setErrors(p => ({ ...p, openai: undefined })); }}
                placeholder="sk-..."
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 pr-11 text-[#ececec] placeholder-[#444] text-sm focus:outline-none transition-colors font-mono ${
                  errors.openai ? "border-red-500/50" : "border-[#2f2f2f] focus:border-[#10a37f]/50"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowOpenai(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#8e8ea0] transition-colors"
              >
                {showOpenai ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.openai && <p className="text-red-400/80 text-xs pl-1">{errors.openai}</p>}
            {!errors.openai && openaiWarning && (
              <p className="text-yellow-500/70 text-xs pl-1">{openaiWarning}</p>
            )}
          </div>

          {/* Заметка о безопасности */}
          <div className="flex items-center gap-2.5 text-xs text-[#4a4a5a] bg-[#1a1a1a] rounded-xl px-4 py-3 border border-[#262626]">
            <ShieldCheck size={14} className="text-[#10a37f]/50 flex-shrink-0" />
            Ключи хранятся только в вашем браузере
          </div>

          {/* Кнопка входа */}
          <button
            type="submit"
            className="w-full bg-[#10a37f] hover:bg-[#0e9572] active:bg-[#0b7a60] text-white font-medium py-3 rounded-xl transition-colors text-sm mt-1"
          >
            Войти
          </button>
        </form>

        {/* Реферальная ссылка */}
        <div className="mt-5 p-4 rounded-xl border border-[#262626] bg-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} className="text-[#10a37f]" />
            <span className="text-xs font-semibold text-[#ececec]">Нет аккаунта evolvin.cloud?</span>
          </div>
          <p className="text-xs text-[#4a4a5a] leading-relaxed mb-2.5">
            Зарегистрируйтесь по ссылке и получите x2 на первое пополнение.
          </p>
          <a
            href="https://timeweb.cloud/?i=128621"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#10a37f] hover:text-[#0e9572] font-medium transition-colors"
          >
            Зарегистрироваться в evolvin.cloud
            <ExternalLink size={10} />
          </a>
        </div>

      </div>
    </div>
  );
}
