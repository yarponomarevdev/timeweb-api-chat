"use client";

import { useState } from "react";
import { Server, Cpu, HardDrive, Zap } from "lucide-react";

interface OsOption {
  id: number;
  name: string;
  version: string;
  full_name: string;
}

interface PresetInfo {
  id: number;
  description: string;
  cpu: number;
  ram_mb: number;
  ram_gb: number;
  disk_gb: number;
  price_per_month: number;
  bandwidth: number;
}

interface ServerCreateFormProps {
  data: {
    server_name: string;
    preset: PresetInfo;
    selected_os: OsOption;
    available_os: OsOption[];
  };
  onConfirm: (text: string) => void;
}

export function ServerCreateForm({ data, onConfirm }: ServerCreateFormProps) {
  const [selectedOs, setSelectedOs] = useState<OsOption>(data.selected_os);
  const { preset, server_name, available_os } = data;

  const diskLabel =
    preset.disk_gb >= 1000
      ? `${Math.round(preset.disk_gb / 1024)} TB`
      : `${preset.disk_gb} GB`;

  const handleCreate = () => {
    onConfirm(
      `Подтверждаю. Создай сервер: name="${server_name}", os_id=${selectedOs.id}, preset_id=${preset.id}`
    );
  };

  return (
    <div className="my-2 flex flex-col gap-3 max-w-sm">
      {/* Выбор ОС */}
      {available_os.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#8e8ea0]">Версия ОС:</div>
          <div className="flex flex-wrap gap-2">
            {available_os.map((os) => (
              <button
                key={os.id}
                onClick={() => setSelectedOs(os)}
                className={`border rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  selectedOs.id === os.id
                    ? "bg-[#10a37f] border-[#10a37f] text-white"
                    : "bg-[#2f2f2f] border-[#3a3a3a] text-[#ececec] hover:border-[#10a37f]"
                }`}
              >
                {os.full_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Карточка конфигурации */}
      <div className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#ececec]">
          <Server size={15} className="text-[#10a37f]" />
          {server_name}
        </div>

        <div className="h-px bg-[#3a3a3a]" />

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">ОС</span>
            <span className="text-[#ececec] font-medium">{selectedOs.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">Тариф</span>
            <span className="text-[#ececec] font-medium">{preset.description}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#8e8ea0] mt-1">
            <span className="flex items-center gap-1">
              <Cpu size={11} /> {preset.cpu} CPU
            </span>
            <span className="flex items-center gap-1">
              <Zap size={11} /> {preset.ram_gb} GB RAM
            </span>
            <span className="flex items-center gap-1">
              <HardDrive size={11} /> {diskLabel}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[#8e8ea0]">Стоимость</span>
            <span className="text-[#10a37f] font-semibold">
              {preset.price_per_month} ₽/мес
            </span>
          </div>
        </div>
      </div>

      {/* Кнопка создания */}
      <button
        onClick={handleCreate}
        className="w-full bg-[#10a37f] hover:bg-[#0d8f6f] text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
      >
        Создать сервер
      </button>
    </div>
  );
}
