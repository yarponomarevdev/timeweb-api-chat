"use client";

import { useEffect, useRef } from "react";

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

interface MonitoredServer {
  id: number;
  name: string;
  status: string;
}

export function useServerMonitor(
  servers: MonitoredServer[],
  timewebToken: string,
  onStatusChange: (serverId: number, serverName: string, newStatus: string, newLabel: string) => void
) {
  // Храним текущие статусы, чтобы определять изменения
  const knownStatuses = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    const transitional = servers.filter((s) => TRANSITIONAL_STATUSES.has(s.status));
    if (transitional.length === 0 || !timewebToken) return;

    // Инициализируем известные статусы
    for (const s of servers) {
      if (!knownStatuses.current.has(s.id)) {
        knownStatuses.current.set(s.id, s.status);
      }
    }

    const interval = setInterval(async () => {
      for (const server of transitional) {
        try {
          const res = await fetch(`/api/server-status?id=${server.id}`, {
            headers: { "x-timeweb-token": timewebToken },
          });
          if (!res.ok) continue;
          const data: { status: string; status_label: string } = await res.json();
          const prev = knownStatuses.current.get(server.id);
          if (prev !== data.status) {
            knownStatuses.current.set(server.id, data.status);
            onStatusChange(server.id, server.name, data.status, data.status_label);
          }
        } catch {
          // не прерываем работу при ошибке сети
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [servers, timewebToken, onStatusChange]);
}
