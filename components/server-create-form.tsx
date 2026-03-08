"use client";

import { useState } from "react";
import { Server, Cpu, HardDrive, Zap } from "lucide-react";
import type { ProposeServerOutput, OsOption, PresetSummary } from "@/lib/tools";

interface ServerCreateFormProps {
  data: ProposeServerOutput;
  onConfirm: (text: string) => void;
}

export function ServerCreateForm({ data, onConfirm }: ServerCreateFormProps) {
  const [selectedOs, setSelectedOs] = useState<OsOption>(data.selected_os);
  const [selectedPreset, setSelectedPreset] = useState<PresetSummary>(data.preset);
  const [isCreating, setIsCreating] = useState(false);
  const { server_name, available_os, available_presets } = data;

  const diskLabel =
    selectedPreset.disk_gb >= 1000
      ? `${Math.round(selectedPreset.disk_gb / 1024)} TB`
      : `${selectedPreset.disk_gb} GB`;

  // Уникальные уровни RAM из списка пресетов
  const uniqueRamLevels = [...new Set(available_presets.map((p) => p.ram_gb))].sort((a, b) => a - b);

  // Все уникальные размеры диска из доступных пресетов
  const uniqueDiskLevels = available_presets
    .map((p) => p.disk_gb)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort((a, b) => a - b);

  const handleRamSelect = (ramGb: number) => {
    const presetsForRam = available_presets
      .filter((p) => p.ram_gb === ramGb)
      .sort((a, b) => a.price_per_month - b.price_per_month);
    const sameDiskPreset = presetsForRam.find((p) => p.disk_gb === selectedPreset.disk_gb);
    if (sameDiskPreset) {
      setSelectedPreset(sameDiskPreset);
      return;
    }
    if (presetsForRam[0]) setSelectedPreset(presetsForRam[0]);
  };

  const handleDiskSelect = (diskGb: number) => {
    const presetsForDisk = available_presets
      .filter((p) => p.disk_gb === diskGb)
      .sort((a, b) => a.price_per_month - b.price_per_month);

    const sameRamPreset = presetsForDisk.find((p) => p.ram_gb === selectedPreset.ram_gb);
    if (sameRamPreset) {
      setSelectedPreset(sameRamPreset);
      return;
    }

    if (presetsForDisk[0]) setSelectedPreset(presetsForDisk[0]);
  };

  const handleCreate = () => {
    if (isCreating) return;
    setIsCreating(true);
    onConfirm(
      `Подтверждаю. Создай сервер: name="${server_name}", os_id=${selectedOs.id}, preset_id=${selectedPreset.id}`
    );
  };

  return (
    <div className="my-2 flex flex-col gap-3 max-w-sm">
      {/* Выбор RAM */}
      {uniqueRamLevels.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#8e8ea0]">Оперативная память:</div>
          <div className="flex flex-wrap gap-2">
            {uniqueRamLevels.map((ram) => (
              <button
                key={ram}
                onClick={() => handleRamSelect(ram)}
                className={`border rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  selectedPreset.ram_gb === ram
                    ? "bg-[#10a37f] border-[#10a37f] text-white"
                    : "bg-[#2f2f2f] border-[#3a3a3a] text-[#ececec] hover:border-[#10a37f]"
                }`}
              >
                {ram} ГБ
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор диска */}
      {uniqueDiskLevels.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#8e8ea0]">Размер диска:</div>
          <div className="flex flex-wrap gap-2">
            {uniqueDiskLevels.map((disk) => (
              <button
                key={disk}
                onClick={() => handleDiskSelect(disk)}
                className={`border rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  selectedPreset.disk_gb === disk
                    ? "bg-[#10a37f] border-[#10a37f] text-white"
                    : "bg-[#2f2f2f] border-[#3a3a3a] text-[#ececec] hover:border-[#10a37f]"
                }`}
              >
                {disk >= 1000 ? `${Math.round(disk / 1024)} ТБ` : `${disk} ГБ`}
              </button>
            ))}
          </div>
        </div>
      )}

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
            <span className="text-[#ececec] font-medium">{selectedPreset.description}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#8e8ea0] mt-1">
            <span className="flex items-center gap-1">
              <Cpu size={11} /> {selectedPreset.cpu} CPU
            </span>
            <span className="flex items-center gap-1">
              <Zap size={11} /> {selectedPreset.ram_gb} GB RAM
            </span>
            <span className="flex items-center gap-1">
              <HardDrive size={11} /> {diskLabel}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[#8e8ea0]">Стоимость</span>
            <span className="text-[#10a37f] font-semibold">
              {selectedPreset.price_per_month} ₽/мес
            </span>
          </div>
        </div>
      </div>

      {/* Кнопка создания */}
      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="w-full bg-[#10a37f] hover:bg-[#0d8f6f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
      >
        {isCreating ? "Создаётся..." : "Создать сервер"}
      </button>
    </div>
  );
}
