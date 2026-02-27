"use client";

import React, { useState } from "react";
import { Server, Key, ExternalLink, Eye, EyeOff, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

interface ApiKeySetupProps {
  initialTimewebKey?: string;
  initialOpenaiKey?: string;
  onSave: (timewebKey: string, openaiKey: string) => void;
}

export function ApiKeySetup({ initialTimewebKey = "", initialOpenaiKey = "", onSave }: ApiKeySetupProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Шаг 1: Timeweb
  const [timewebKey, setTimewebKey] = useState(initialTimewebKey);
  const [showTimewebKey, setShowTimewebKey] = useState(false);
  const [timewebError, setTimewebError] = useState("");

  // Шаг 2: OpenAI
  const [openaiKey, setOpenaiKey] = useState(initialOpenaiKey);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiError, setOpenaiError] = useState("");

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = timewebKey.trim();
    if (!trimmed) {
      setTimewebError("Введите API-ключ Timeweb");
      return;
    }
    setTimewebError("");
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = openaiKey.trim();
    if (!trimmed) {
      setOpenaiError("Введите API-ключ OpenAI");
      return;
    }
    setOpenaiError("");
    onSave(timewebKey.trim(), trimmed);
  };

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#2f2f2f] rounded-2xl flex items-center justify-center mb-4">
            <Server size={32} className="text-[#10a37f]" />
          </div>
          <h1 className="text-2xl font-bold text-[#ececec]">Timeweb Manager</h1>
          <p className="text-[#8e8ea0] text-sm mt-1">Управление серверами через AI</p>
        </div>

        {/* Индикатор шагов */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === s
                    ? "bg-[#10a37f] text-white"
                    : step > s
                    ? "bg-[#10a37f]/30 text-[#10a37f]"
                    : "bg-[#2f2f2f] text-[#8e8ea0]"
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div className={`w-8 h-px ${step > s ? "bg-[#10a37f]" : "bg-[#3a3a3a]"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 ? (
          /* ===== Шаг 1: Timeweb API ключ ===== */
          <div className="bg-[#2f2f2f] rounded-2xl p-6 border border-[#3a3a3a]">
            <div className="flex items-center gap-2 mb-1">
              <Key size={16} className="text-[#10a37f]" />
              <h2 className="text-[#ececec] font-semibold">Введите API-ключ Timeweb</h2>
            </div>
            <p className="text-[#8e8ea0] text-sm mb-5">
              Ключ хранится только в вашем браузере и используется для управления серверами.
            </p>

            <form onSubmit={handleStep1Submit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showTimewebKey ? "text" : "password"}
                  value={timewebKey}
                  onChange={(e) => {
                    setTimewebKey(e.target.value);
                    setTimewebError("");
                  }}
                  placeholder="Вставьте ваш API-ключ Timeweb..."
                  autoFocus
                  className="w-full bg-[#171717] border border-[#3a3a3a] rounded-xl px-4 py-3 pr-11 text-[#ececec] placeholder-[#555] text-sm focus:outline-none focus:border-[#10a37f] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowTimewebKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-[#ececec] transition-colors"
                >
                  {showTimewebKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {timewebError && <p className="text-red-400 text-xs">{timewebError}</p>}

              <button
                type="submit"
                className="w-full bg-[#10a37f] hover:bg-[#0d8f6f] text-white font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                Далее
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Инструкция по получению ключа */}
            <div className="mt-5 pt-5 border-t border-[#3a3a3a]">
              <p className="text-[#8e8ea0] text-xs mb-3">Как получить API-ключ:</p>
              <ol className="text-[#8e8ea0] text-xs space-y-1.5 list-decimal list-inside">
                <li>Войдите в панель управления Timeweb Cloud</li>
                <li>Перейдите в раздел <span className="text-[#ececec]">Профиль → API</span></li>
                <li>Нажмите «Создать токен» и скопируйте его</li>
              </ol>
              <a
                href="https://timeweb.cloud/my/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-[#10a37f] hover:text-[#0d8f6f] text-xs transition-colors"
              >
                Открыть панель управления
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Блок реферальной ссылки */}
            <div className="mt-5 pt-5 border-t border-[#3a3a3a]">
              <p className="text-[#8e8ea0] text-xs mb-3">Нет аккаунта Timeweb?</p>
              <div className="bg-[#171717] rounded-xl p-4 border border-[#3a3a3a]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#10a37f]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={16} className="text-[#10a37f]" />
                  </div>
                  <div>
                    <p className="text-[#ececec] text-xs font-semibold mb-1">Бонус x2 на первое пополнение</p>
                    <p className="text-[#8e8ea0] text-xs mb-3 leading-relaxed">
                      Зарегистрируйтесь по нашей ссылке и получите удвоение суммы при первом пополнении баланса.
                    </p>
                    <a
                      href="https://timeweb.cloud/?i=128621"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#10a37f] hover:bg-[#0d8f6f] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      Зарегистрироваться в Timeweb
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===== Шаг 2: OpenAI API ключ ===== */
          <div className="bg-[#2f2f2f] rounded-2xl p-6 border border-[#3a3a3a]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-[#10a37f]" />
              <h2 className="text-[#ececec] font-semibold">Введите API-ключ OpenAI</h2>
            </div>
            <p className="text-[#8e8ea0] text-sm mb-5">
              AI работает за счёт вашего ключа OpenAI. Ключ хранится только в браузере.
            </p>

            <form onSubmit={handleStep2Submit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showOpenaiKey ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value);
                    setOpenaiError("");
                  }}
                  placeholder="sk-..."
                  autoFocus
                  className="w-full bg-[#171717] border border-[#3a3a3a] rounded-xl px-4 py-3 pr-11 text-[#ececec] placeholder-[#555] text-sm focus:outline-none focus:border-[#10a37f] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-[#ececec] transition-colors"
                >
                  {showOpenaiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {openaiError && <p className="text-red-400 text-xs">{openaiError}</p>}

              <button
                type="submit"
                className="w-full bg-[#10a37f] hover:bg-[#0d8f6f] text-white font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                Войти
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-[#8e8ea0] hover:text-[#ececec] py-2 text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Назад
              </button>
            </form>

            {/* Инструкция по получению ключа OpenAI */}
            <div className="mt-5 pt-5 border-t border-[#3a3a3a]">
              <p className="text-[#8e8ea0] text-xs mb-3">Как получить API-ключ OpenAI:</p>
              <ol className="text-[#8e8ea0] text-xs space-y-1.5 list-decimal list-inside">
                <li>Зайдите на <span className="text-[#ececec]">platform.openai.com</span></li>
                <li>Перейдите в раздел <span className="text-[#ececec]">API Keys</span></li>
                <li>Нажмите «Create new secret key» и скопируйте его</li>
              </ol>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-[#10a37f] hover:text-[#0d8f6f] text-xs transition-colors"
              >
                Открыть OpenAI Platform
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
