"use client";

import { useState, useRef, useCallback } from "react";

const CACHE_TTL = 60_000; // 60 секунд

interface ServerSummary {
  id: number;
  name: string;
  status: string;
  status_label: string;
  os: string;
  os_version?: string;
  cpu?: number;
  ram_mb?: number;
  disk_gb?: number;
  location?: string;
  created_at?: string;
}

interface PresetSummary {
  id: number;
  description: string;
  cpu: number;
  ram_gb: number;
  disk_gb: number;
  price_per_month: number;
}

export function useTimeweb(token: string) {
  const [servers, setServers] = useState<ServerSummary[] | null>(null);
  const [presets, setPresets] = useState<PresetSummary[] | null>(null);
  const [serversLoading, setServersLoading] = useState(false);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [serversError, setServersError] = useState<string | null>(null);
  const [presetsError, setPresetsError] = useState<string | null>(null);

  const serversFetchedAt = useRef<number>(0);
  const presetsFetchedAt = useRef<number>(0);

  const fetchServers = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && servers !== null && now - serversFetchedAt.current < CACHE_TTL) return;
    setServersLoading(true);
    setServersError(null);
    try {
      const res = await fetch("/api/servers", {
        headers: { "x-timeweb-token": token },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: { servers: ServerSummary[] } = await res.json();
      setServers(data.servers);
      serversFetchedAt.current = Date.now();
    } catch {
      setServersError("Не удалось загрузить список серверов.");
    } finally {
      setServersLoading(false);
    }
  }, [token, servers]);

  const fetchPresets = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && presets !== null && now - presetsFetchedAt.current < CACHE_TTL) return;
    setPresetsLoading(true);
    setPresetsError(null);
    try {
      const res = await fetch("/api/presets", {
        headers: { "x-timeweb-token": token },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: { presets: PresetSummary[] } = await res.json();
      setPresets(data.presets);
      presetsFetchedAt.current = Date.now();
    } catch {
      setPresetsError("Не удалось загрузить тарифы.");
    } finally {
      setPresetsLoading(false);
    }
  }, [token, presets]);

  return {
    servers,
    presets,
    serversLoading,
    presetsLoading,
    serversError,
    presetsError,
    fetchServers,
    fetchPresets,
  };
}
