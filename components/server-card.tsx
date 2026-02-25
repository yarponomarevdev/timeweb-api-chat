import React from "react";

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
}

export function ServerCard({ server }: ServerCardProps) {
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
    </div>
  );
}
