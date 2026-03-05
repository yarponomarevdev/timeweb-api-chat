import React, { useState, useEffect } from "react";
import { RefreshCw, Play, Square, RotateCcw, Trash2, AlertTriangle } from "lucide-react";

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

export function ServerCard({ server, onAction, timewebToken }: ServerCardProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [liveStatus, setLiveStatus] = useState(server.status);
  const [liveStatusLabel, setLiveStatusLabel] = useState(server.status_label);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  // Синхронизируем локальное состояние при обновлении пропсов
  useEffect(() => {
    setLiveStatus(server.status);
    setLiveStatusLabel(server.status_label);
  }, [server.id, server.status, server.status_label]);

  // Автообновление статуса каждые 5 секунд при переходных состояниях
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
        }
      } catch {
        // не прерываем работу при ошибке сети
      } finally {
        setAutoRefreshing(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [liveStatus, timewebToken, server.id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "on":
        return "bg-green-500";
      case "off":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const isTransitional = TRANSITIONAL_STATUSES.has(liveStatus);

  const handleConfirm = () => {
    if (!onAction) return;
    if (confirmAction === "shutdown") {
      onAction(`Выключи сервер ${server.id}`);
    } else if (confirmAction === "delete") {
      onAction(`Удали сервер ${server.id}`);
    }
    setConfirmAction(null);
    setDeleteInput("");
  };

  const handleCancel = () => {
    setConfirmAction(null);
    setDeleteInput("");
  };

  const deleteConfirmEnabled = confirmAction === "delete"
    ? deleteInput === server.name
    : true;

  return (
    <div className="bg-[#2f2f2f] rounded-xl p-4 border border-[#3a3a3a] flex flex-col gap-3 my-2 max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(liveStatus)}`} />
          <span className="font-bold text-[#ececec]">{server.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {autoRefreshing && (
            <RefreshCw size={11} className="text-[#10a37f] animate-spin" />
          )}
          {isTransitional && !autoRefreshing && (
            <span className="text-[10px] text-[#10a37f]/70 animate-pulse">обновляется</span>
          )}
          <span className="text-xs text-[#8e8ea0] bg-[#3a3a3a] px-2 py-1 rounded-md">
            {liveStatusLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-[#ececec]">
        <div className="flex justify-between">
          <span className="text-[#8e8ea0]">ОС:</span>
          <span>{server.os} {server.os_version}</span>
        </div>
        {server.cpu != null && (
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">CPU:</span>
            <span>{server.cpu} ядер</span>
          </div>
        )}
        {server.ram_mb != null && (
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">RAM:</span>
            <span>{Math.round(server.ram_mb / 1024)} GB</span>
          </div>
        )}
        {server.disk_gb != null && (
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">Диск:</span>
            <span>{server.disk_gb} GB NVMe</span>
          </div>
        )}
        {server.location && (
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">Локация:</span>
            <span>{server.location}</span>
          </div>
        )}
      </div>

      {/* Inline confirmation */}
      {confirmAction && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-300 text-sm font-medium">
            <AlertTriangle size={14} />
            {confirmAction === "shutdown"
              ? `Выключить сервер "${server.name}"?`
              : `Удалить сервер "${server.name}"?`}
          </div>
          {confirmAction === "delete" && (
            <>
              <p className="text-xs text-red-400/80">
                Это действие необратимо. Введите имя сервера для подтверждения:
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={server.name}
                className="bg-[#1a1a1a] border border-red-700/40 rounded-lg px-3 py-1.5 text-sm text-[#ececec] placeholder-[#555] focus:outline-none focus:border-red-500/60 font-mono"
              />
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#3a3a3a] text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#3a3a3a] transition-colors"
            >
              Отменить
            </button>
            <button
              onClick={handleConfirm}
              disabled={!deleteConfirmEnabled}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-red-700/80 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              {confirmAction === "shutdown" ? "Выключить" : "Удалить"}
            </button>
          </div>
        </div>
      )}

      {onAction && !confirmAction && (
        <div className="flex gap-2 pt-1 border-t border-[#3a3a3a] flex-wrap">
          {isTransitional && !timewebToken && (
            <ActionButton
              icon={<RefreshCw size={13} />}
              label="Обновить статус"
              onClick={() => onAction(`Обнови статус сервера ${server.id}`)}
            />
          )}
          {server.status === "on" && (
            <>
              <ActionButton
                icon={<RotateCcw size={13} />}
                label="Перезагрузить"
                onClick={() => onAction(`Перезагрузи сервер ${server.id}`)}
              />
              <ActionButton
                icon={<Square size={13} />}
                label="Выключить"
                onClick={() => setConfirmAction("shutdown")}
                variant="danger"
              />
            </>
          )}
          {server.status === "off" && (
            <>
              <ActionButton
                icon={<Play size={13} />}
                label="Запустить"
                onClick={() => onAction(`Запусти сервер ${server.id}`)}
                variant="success"
              />
              <ActionButton
                icon={<Trash2 size={13} />}
                label="Удалить"
                onClick={() => setConfirmAction("delete")}
                variant="danger"
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
}

function ActionButton({ icon, label, onClick, variant = "default" }: ActionButtonProps) {
  const colors = {
    default: "hover:bg-[#3a3a3a] text-[#8e8ea0] hover:text-[#ececec]",
    danger: "hover:bg-red-900/40 text-[#8e8ea0] hover:text-red-300",
    success: "hover:bg-green-900/40 text-[#8e8ea0] hover:text-green-300",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${colors[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}
