import React from "react";
import { RefreshCw, Play, Square, RotateCcw } from "lucide-react";

interface ServerCardProps {
  server: {
    id: number;
    name: string;
    status: string;
    status_label: string;
    ip: string;
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

export function ServerCard({ server, onAction }: ServerCardProps) {
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

  const isTransitional = TRANSITIONAL_STATUSES.has(server.status);

  return (
    <div className="bg-[#2f2f2f] rounded-xl p-4 border border-[#3a3a3a] flex flex-col gap-3 my-2 max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`} />
          <span className="font-bold text-[#ececec]">{server.name}</span>
        </div>
        <span className="text-xs text-[#8e8ea0] bg-[#3a3a3a] px-2 py-1 rounded-md">
          {server.status_label}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-sm text-[#ececec]">
        <div className="flex justify-between">
          <span className="text-[#8e8ea0]">IP:</span>
          <span className="font-mono">{server.ip}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8e8ea0]">ОС:</span>
          <span>{server.os} {server.os_version}</span>
        </div>
        {(server.cpu || server.ram_mb || server.disk_gb) && (
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">Ресурсы:</span>
            <span>
              {server.cpu} CPU / {server.ram_mb ? Math.round(server.ram_mb / 1024) : 0} GB RAM / {server.disk_gb} GB NVMe
            </span>
          </div>
        )}
        {server.location && (
          <div className="flex justify-between">
            <span className="text-[#8e8ea0]">Локация:</span>
            <span>{server.location}</span>
          </div>
        )}
      </div>

      {onAction && (
        <div className="flex gap-2 pt-1 border-t border-[#3a3a3a] flex-wrap">
          {isTransitional && (
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
                onClick={() => onAction(`Выключи сервер ${server.id}`)}
                variant="danger"
              />
            </>
          )}
          {server.status === "off" && (
            <ActionButton
              icon={<Play size={13} />}
              label="Запустить"
              onClick={() => onAction(`Запусти сервер ${server.id}`)}
              variant="success"
            />
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
