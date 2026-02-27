"use client";

import React, { useState } from "react";
import { Server, Key, ExternalLink, Eye, EyeOff } from "lucide-react";

interface ApiKeySetupProps {
  initialKey?: string;
  onSave: (key: string) => void;
}

export function ApiKeySetup({ initialKey = "", onSave }: ApiKeySetupProps) {
  const [value, setValue] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Введите API-ключ");
      return;
    }
    setError("");
    onSave(trimmed);
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

        {/* Карточка */}
        <div className="bg-[#2f2f2f] rounded-2xl p-6 border border-[#3a3a3a]">
          <div className="flex items-center gap-2 mb-1">
            <Key size={16} className="text-[#10a37f]" />
            <h2 className="text-[#ececec] font-semibold">Введите API-ключ Timeweb</h2>
          </div>
          <p className="text-[#8e8ea0] text-sm mb-5">
            Ключ хранится только в вашем браузере и никуда не передаётся, кроме Timeweb API.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                placeholder="Вставьте ваш API-ключ..."
                autoFocus
                className="w-full bg-[#171717] border border-[#3a3a3a] rounded-xl px-4 py-3 pr-11 text-[#ececec] placeholder-[#555] text-sm focus:outline-none focus:border-[#10a37f] transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-[#ececec] transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#10a37f] hover:bg-[#0d8f6f] text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              Войти
            </button>
          </form>

          {/* Инструкция */}
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
        </div>
      </div>
    </div>
  );
}
