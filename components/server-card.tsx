"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Cpu,
  MemoryStick,
  HardDrive,
  MapPin,
  Monitor,
  Copy,
  Check,
} from "lucide-react";

interface ServerCardProps {
  server: {
    id: number;
    name: string;
    status: string;
    status_label: string;
    os: string;
    os_version?: string;
    cpu?: number;
    ram_mb?: number;
    disk_gb?: number;
    comment?: string;
    created_at?: string;
    location?: string;
    networks?: Array<{ type: string; ips: Array<{ ip: string; is_main: boolean; type: string }> }>;
  };
  onAction?: (text: string) => void;
  timewebToken?: string;
}

const TRANSITIONAL_STATUSES = new Set([
  "installing",
  "removing",
  "rebooting",
  "starting",
  "stopping",
  "resetting_password",
  "reinstalling",
  "backup_creating",
  "backup_restoring",
  "cloning",
  "migrating",
]);

type ConfirmAction = "shutdown" | "delete" | null;

const LOCATION_NAMES: Record<string, string> = {
  "ru-1": "Москва",
  "ru-2": "Санкт-Петербург",
  "pl-1": "Варшава",
  "nl-1": "Амстердам",
  "kz-1": "Алматы",
};

function locationLabel(code: string) {
  return LOCATION_NAMES[code] ?? code;
}

function cpuLabel(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} ядро`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} ядра`;
  return `${n} ядер`;
}

export function ServerCard({ server, onAction, timewebToken }: ServerCardProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [liveStatus, setLiveStatus] = useState(server.status);
  const [liveStatusLabel, setLiveStatusLabel] = useState(server.status_label);
  const [liveNetworks, setLiveNetworks] = useState(server.networks);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLiveStatus(server.status);
    setLiveStatusLabel(server.status_label);
    setLiveNetworks(server.networks);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- networks сравнивается по ссылке, синхронизируем только при смене сервера/статуса
  }, [server.id, server.status, server.status_label]);

  useEffect(() => {
    if (!TRANSITIONAL_STATUSES.has(liveStatus) || !timewebToken) return;
    const interval = setInterval(async () => {
      try {
        setAutoRefreshing(true);
        const res = await fetch(`/api/server-status?id=${server.id}`, {
          headers: { "x-timeweb-token": timewebToken },
        });
        if (res.ok) {
          const data = await res.json();
          setLiveStatus(data.status);
          setLiveStatusLabel(data.status_label);
          if (data.networks) setLiveNetworks(data.networks);
        }
      } catch {
        // не прерываем при ошибке
      } finally {
        setAutoRefreshing(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [liveStatus, timewebToken, server.id]);

  const mainIp = liveNetworks
    ?.flatMap((n) => n.ips)
    .find((ip) => ip.is_main && ip.type === "ipv4")?.ip;

  const statusBadge: Record<string, string> = {
    on: "bg-[#1a2d1a] text-green-400 border-[#1f4a1f]",
    off: "bg-[#2d1a1a] text-red-400 border-[#4a1f1f]",
  };
  const badgeClass = statusBadge[liveStatus] ?? "bg-[#2a2318] text-yellow-400 border-[#4a401f]";

  const isTransitional = TRANSITIONAL_STATUSES.has(liveStatus);

  const handleConfirm = () => {
    if (!onAction) return;
    if (confirmAction === "shutdown") onAction(`Выключи сервер ${server.id}`);
    else if (confirmAction === "delete") onAction(`Удали сервер ${server.id}`);
    setConfirmAction(null);
    setDeleteInput("");
  };

  const handleCopyIp = () => {
    if (!mainIp) return;
    navigator.clipboard.writeText(mainIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const deleteConfirmEnabled = confirmAction === "delete" ? deleteInput === server.name : true;

  const ramGb = server.ram_mb != null ? Math.round(server.ram_mb / 1024) : null;

  return (
    <div className="bg-[#252525] rounded-2xl border border-[#333] flex flex-col my-2 w-full max-w-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 gap-2">
        <div className="flex items-center min-w-0">
          <span className="font-semibold text-[#ececec] truncate">{server.name}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {autoRefreshing && <RefreshCw size={10} className="text-[#10a37f] animate-spin" />}
          {isTransitional && !autoRefreshing && (
            <span className="text-[10px] text-[#0d8068] animate-pulse">обновляется</span>
          )}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
            {liveStatusLabel}
          </span>
        </div>
      </div>

      {/* Specs grid — CPU / RAM / Disk */}
      {(server.cpu != null || ramGb != null || server.disk_gb != null) && (
        <div className="grid grid-cols-3 gap-px bg-[#2e2e2e] border-t border-[#2e2e2e]">
          {server.cpu != null && (
            <div className="bg-[#252525] flex flex-col items-center gap-1 py-3 px-2">
              <Cpu size={14} className="text-[#10a37f]" />
              <span className="text-sm font-medium text-[#ececec]">{cpuLabel(server.cpu)}</span>
              <span className="text-[10px] text-[#8e8ea0] uppercase tracking-wide">CPU</span>
            </div>
          )}
          {ramGb != null && (
            <div className="bg-[#252525] flex flex-col items-center gap-1 py-3 px-2">
              <MemoryStick size={14} className="text-[#10a37f]" />
              <span className="text-sm font-medium text-[#ececec]">{ramGb} ГБ</span>
              <span className="text-[10px] text-[#8e8ea0] uppercase tracking-wide">RAM</span>
            </div>
          )}
          {server.disk_gb != null && (
            <div className="bg-[#252525] flex flex-col items-center gap-1 py-3 px-2">
              <HardDrive size={14} className="text-[#10a37f]" />
              <span className="text-sm font-medium text-[#ececec]">{server.disk_gb} ГБ</span>
              <span className="text-[10px] text-[#8e8ea0] uppercase tracking-wide">Диск</span>
            </div>
          )}
        </div>
      )}

      {/* OS / Location tiles */}
      {(server.os || server.location) && (
        <div className="grid grid-cols-2 gap-px bg-[#2e2e2e] border-t border-b border-[#2e2e2e]">
          {server.os && (
            <div className="bg-[#252525] flex flex-col items-center gap-1 py-3 px-2">
              <Monitor size={14} className="text-[#10a37f]" />
              <span className="text-sm font-medium text-[#ececec] text-center leading-tight">
                {server.os} {server.os_version}
              </span>
              <span className="text-[10px] text-[#8e8ea0] uppercase tracking-wide">ОС</span>
            </div>
          )}
          {server.location && (
            <div className="bg-[#252525] flex flex-col items-center gap-1 py-3 px-2">
              <MapPin size={14} className="text-[#10a37f]" />
              <span className="text-sm font-medium text-[#ececec]">{locationLabel(server.location)}</span>
              <span className="text-[10px] text-[#8e8ea0] uppercase tracking-wide">Локация</span>
            </div>
          )}
        </div>
      )}

      {/* IP */}
      {mainIp && (
        <button
          onClick={handleCopyIp}
          className="flex items-center justify-between px-4 py-2 text-xs text-[#8e8ea0] hover:bg-[#2a2a2a] transition-colors group border-b border-[#2e2e2e]"
        >
          <span className="font-mono group-hover:text-[#ececec] transition-colors">{mainIp}</span>
          {copied
            ? <Check size={12} className="text-[#10a37f]" />
            : <Copy size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          }
        </button>
      )}

      {/* Inline confirmation */}
      {confirmAction && (
        <div className="mx-3 mb-3 mt-2 bg-[#2d1a1a] border border-[#6b2929] rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-300 text-sm font-medium">
            <AlertTriangle size={14} />
            {confirmAction === "shutdown"
              ? `Выключить сервер «${server.name}»?`
              : `Удалить сервер «${server.name}»?`}
          </div>
          {confirmAction === "delete" && (
            <>
              <p className="text-xs text-red-400">Это необратимо. Введите имя сервера:</p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={server.name}
                className="bg-[#1a1a1a] border border-[#6b2929] rounded-lg px-3 py-1.5 text-sm text-[#ececec] placeholder-[#555] focus:outline-none focus:border-red-500 font-mono"
              />
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setConfirmAction(null); setDeleteInput(""); }}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#3a3a3a] text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#3a3a3a] transition-colors"
            >
              Отменить
            </button>
            <button
              onClick={handleConfirm}
              disabled={!deleteConfirmEnabled}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[#b02a2a] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              {confirmAction === "shutdown" ? "Выключить" : "Удалить"}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {onAction && !confirmAction && (
        <div className="flex gap-px bg-[#2e2e2e] border-t border-[#2e2e2e]">
          {isTransitional && !timewebToken && (
            <ActionButton
              icon={<RefreshCw size={12} />}
              label="Обновить"
              onClick={() => onAction(`Обнови статус сервера ${server.id}`)}
              fullWidth
            />
          )}
          {liveStatus === "on" && (
            <>
              <ActionButton
                icon={<RotateCcw size={12} />}
                label="Перезагрузить"
                onClick={() => onAction(`Перезагрузи сервер ${server.id}`)}
                fullWidth
              />
              <ActionButton
                icon={<Square size={12} />}
                label="Выключить"
                onClick={() => setConfirmAction("shutdown")}
                variant="danger"
                fullWidth
              />
            </>
          )}
          {liveStatus === "off" && (
            <>
              <ActionButton
                icon={<Play size={12} />}
                label="Запустить"
                onClick={() => onAction(`Запусти сервер ${server.id}`)}
                variant="success"
                fullWidth
              />
              <ActionButton
                icon={<Trash2 size={12} />}
                label="Удалить"
                onClick={() => setConfirmAction("delete")}
                variant="danger"
                fullWidth
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
  fullWidth?: boolean;
}

function ActionButton({ icon, label, onClick, variant = "default", fullWidth }: ActionButtonProps) {
  const colors = {
    default: "bg-[#252525] hover:bg-[#2f2f2f] text-[#8e8ea0] hover:text-[#ececec]",
    danger: "bg-[#252525] hover:bg-[#2d1a1a] text-[#8e8ea0] hover:text-red-300",
    success: "bg-[#252525] hover:bg-[#1a2d1a] text-[#8e8ea0] hover:text-green-300",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 transition-colors ${colors[variant]} ${fullWidth ? "flex-1" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}
