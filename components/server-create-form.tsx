"use client";

import { useState } from "react";
import { Server, Cpu, HardDrive, Zap } from "lucide-react";
import type { ProposeServerOutput, OsOption, PresetSummary, LocationOption } from "@/lib/tools";

interface ServerCreateFormProps {
  data: ProposeServerOutput;
  onConfirm: (text: string) => void;
}

export function ServerCreateForm({ data, onConfirm }: ServerCreateFormProps) {
  const isMarketplace = data.mode === "software";
  const [selectedOs, setSelectedOs] = useState<OsOption | undefined>(data.selected_os);
  const [selectedSoftware, setSelectedSoftware] = useState(data.selected_software);
  const [selectedPreset, setSelectedPreset] = useState<PresetSummary>(data.preset);
  const locations = data.available_locations ?? [];
  const [selectedLocation, setSelectedLocation] = useState<LocationOption>(
    locations.find((l) => l.code === data.selected_location) ?? locations[0]
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { server_name, available_os, available_presets, available_software = [] } = data;
  const available_locations = locations;

  const diskLabel =
    selectedPreset.disk_gb >= 1000
      ? `${Math.round(selectedPreset.disk_gb / 1024)} TB`
      : `${selectedPreset.disk_gb} GB`;

  // Уникальные уровни CPU, RAM, диска из списка пресетов
  const uniqueCpuLevels = [...new Set(available_presets.map((p) => p.cpu))].sort((a, b) => a - b);
  const uniqueRamLevels = [...new Set(available_presets.map((p) => p.ram_gb))].sort((a, b) => a - b);
  const uniqueDiskLevels = [...new Set(available_presets.map((p) => p.disk_gb))].sort((a, b) => a - b);

  /** Найти лучший пресет при изменении одного параметра */
  const findPreset = (cpu?: number, ramGb?: number, diskGb?: number) => {
    const targetCpu = cpu ?? selectedPreset.cpu;
    const targetRam = ramGb ?? selectedPreset.ram_gb;
    const targetDisk = diskGb ?? selectedPreset.disk_gb;

    // Точное совпадение по всем трём
    const exact = available_presets.find(
      (p) => p.cpu === targetCpu && p.ram_gb === targetRam && p.disk_gb === targetDisk
    );
    if (exact) return exact;

    // Пресеты, где изменённый параметр совпадает
    const matching = available_presets
      .filter((p) => (cpu != null ? p.cpu === cpu : true) && (ramGb != null ? p.ram_gb === ramGb : true) && (diskGb != null ? p.disk_gb === diskGb : true))
      .sort((a, b) => a.price_per_month - b.price_per_month);

    if (matching.length > 0) return matching[0];

    return available_presets[0];
  };

  const handleCpuSelect = (cpu: number) => {
    const preset = findPreset(cpu, undefined, undefined);
    if (preset) setSelectedPreset(preset);
  };

  const handleRamSelect = (ramGb: number) => {
    const preset = findPreset(undefined, ramGb, undefined);
    if (preset) setSelectedPreset(preset);
  };

  const handleDiskSelect = (diskGb: number) => {
    const preset = findPreset(undefined, undefined, diskGb);
    if (preset) setSelectedPreset(preset);
  };

  const handleCreate = () => {
    if (isCreating || isDone) return;
    setIsCreating(true);
    setIsDone(true);

    if (isMarketplace && selectedSoftware) {
      onConfirm(
        `Подтверждаю. Создай сервер: name="${server_name}", software_id=${selectedSoftware.id}, preset_id=${selectedPreset.id}, availability_zone=${selectedLocation.code}`
      );
      return;
    }

    if (!selectedOs) return;

    onConfirm(
      `Подтверждаю. Создай сервер: name="${server_name}", os_id=${selectedOs.id}, preset_id=${selectedPreset.id}, availability_zone=${selectedLocation.code}`
    );
  };

  const handleCancel = () => {
    if (isDone) return;
    setIsDone(true);
    onConfirm("Отменяю создание сервера");
  };

  // Форма уже отправлена — показываем компактный статус вместо полной формы
  if (isDone) {
    if (!isCreating) return null; // отменено
    return (
      <div className="text-xs text-[#8e8ea0] my-1 flex items-center gap-1.5">
        <span className="text-[#10a37f]">✓</span> Конфигурация подтверждена, сервер создаётся…
      </div>
    );
  }

  return (
    <div className="my-2 flex flex-col gap-3 w-full">
      {/* Выбор CPU */}
      {uniqueCpuLevels.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#8e8ea0]">Процессор:</div>
          <div className="flex flex-wrap gap-2">
            {uniqueCpuLevels.map((cpu) => (
              <button
                key={cpu}
                onClick={() => handleCpuSelect(cpu)}
                className={`border rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  selectedPreset.cpu === cpu
                    ? "bg-[#10a37f] border-[#10a37f] text-white"
                    : "bg-[#2f2f2f] border-[#3a3a3a] text-[#ececec] hover:border-[#10a37f]"
                }`}
              >
                {cpu} vCPU
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Выбор ПО из маркетплейса */}
      {isMarketplace && available_software.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#8e8ea0]">ПО из маркетплейса:</div>
          <div className="flex flex-wrap gap-2">
            {available_software.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedSoftware(item)}
                className={`border rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  selectedSoftware?.id === item.id
                    ? "bg-[#10a37f] border-[#10a37f] text-white"
                    : "bg-[#2f2f2f] border-[#3a3a3a] text-[#ececec] hover:border-[#10a37f]"
                }`}
              >
                {item.full_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор ОС */}
      {!isMarketplace && available_os.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#8e8ea0]">Версия ОС:</div>
          <div className="flex flex-wrap gap-2">
            {available_os.map((os) => (
              <button
                key={os.id}
                onClick={() => setSelectedOs(os)}
                className={`border rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  selectedOs?.id === os.id
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

      {/* Выбор локации */}
      {available_locations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#8e8ea0]">Локация:</div>
          <div className="grid grid-cols-2 gap-2">
            {available_locations.map((loc) => (
              <button
                key={loc.code}
                onClick={() => setSelectedLocation(loc)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  selectedLocation.code === loc.code
                    ? "bg-[#162e26] border-[#10a37f] text-[#ececec]"
                    : "bg-[#2f2f2f] border-[#3a3a3a] text-[#8e8ea0] hover:border-[#555] hover:text-[#ececec]"
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate leading-tight">{loc.city}</span>
                  <span className="text-[10px] text-[#8e8ea0] truncate">{loc.country}</span>
                </div>
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
            <span className="text-[#8e8ea0]">{isMarketplace ? "ПО" : "ОС"}</span>
            <span className="text-[#ececec] font-medium">
              {isMarketplace ? selectedSoftware?.full_name : selectedOs?.full_name}
            </span>
          </div>
          {isMarketplace && selectedSoftware?.os_label && (
            <div className="flex justify-between">
              <span className="text-[#8e8ea0]">Базовая ОС</span>
              <span className="text-[#ececec] font-medium">{selectedSoftware.os_label}</span>
            </div>
          )}
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
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">Локация</span>
            <span className="text-[#ececec] font-medium">
              {selectedLocation.city}
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

      {/* Кнопки действий */}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={isDone}
          className="flex-1 bg-[#2f2f2f] hover:bg-[#3a3a3a] disabled:opacity-60 disabled:cursor-not-allowed text-[#8e8ea0] font-medium py-2.5 px-4 rounded-xl transition-colors text-sm border border-[#3a3a3a]"
        >
          Отмена
        </button>
        <button
          onClick={handleCreate}
          disabled={isDone}
          className="flex-[2] bg-[#10a37f] hover:bg-[#0d8f6f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          {isCreating ? "Создаётся..." : "Создать сервер"}
        </button>
      </div>
    </div>
  );
}
