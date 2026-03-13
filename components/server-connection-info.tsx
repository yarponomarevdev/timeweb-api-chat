"use client";

import { useState, useEffect, useRef } from "react";
import { ConnectionInfo, serverConnectionFields, type ConnectionField } from "./connection-info";

interface ServerConnectionInfoProps {
  /** Начальный output из create_server / get_server */
  initialData: Record<string, unknown>;
  /** ID сервера для polling */
  serverId: number;
  /** Токен для запросов */
  timewebToken?: string;
}

/**
 * Обёртка над ConnectionInfo, которая подгружает IP-адрес,
 * если он не был доступен в начальных данных.
 */
export function ServerConnectionInfo({ initialData, serverId, timewebToken }: ServerConnectionInfoProps) {
  const [data, setData] = useState(initialData);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const attemptRef = useRef(0);

  const hasIp = (() => {
    const networks = data.networks as Array<{ ips?: Array<{ ip: string }> }> | undefined;
    return networks?.some((n) => n.ips?.some((ip) => ip.ip)) ?? false;
  })();

  useEffect(() => {
    if (hasIp || !timewebToken || !serverId) return;

    const poll = async () => {
      attemptRef.current++;
      try {
        const res = await fetch(`/api/server-status?id=${serverId}`, {
          headers: { "x-timeweb-token": timewebToken },
        });
        if (!res.ok) return;
        const fresh = await res.json();
        // API /server-status возвращает { status, status_label, networks? }
        if (fresh.networks?.some((n: { ips?: Array<{ ip: string }> }) => n.ips?.some((ip: { ip: string }) => ip.ip))) {
          setData((prev) => ({ ...prev, networks: fresh.networks }));
        }
      } catch { /* игнорируем */ }

      // Останавливаем после 15 попыток (~2 мин)
      if (attemptRef.current >= 15 && pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };

    pollingRef.current = setInterval(poll, 8000);
    // Первый запрос сразу через 3 сек
    const timeout = setTimeout(poll, 3000);

    return () => {
      clearInterval(pollingRef.current);
      clearTimeout(timeout);
    };
  }, [hasIp, serverId, timewebToken]);

  const fields: ConnectionField[] = serverConnectionFields(data);
  return <ConnectionInfo fields={fields} />;
}
