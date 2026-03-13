"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface ServerConnectionInfoProps {
  initialData: Record<string, unknown>;
  serverId: number;
  timewebToken?: string;
}

type NetworkIp = { ip: string; is_main: boolean; type: string };
type Network = { type: string; ips: NetworkIp[] };

function extractMainIp(networks?: Network[]): string | undefined {
  return networks?.flatMap((n) => n.ips).find((ip) => ip.is_main && ip.type === "ipv4")?.ip;
}

export function ServerConnectionInfo({ initialData, serverId, timewebToken }: ServerConnectionInfoProps) {
  const [networks, setNetworks] = useState(initialData.networks as Network[] | undefined);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const attemptRef = useRef(0);
  const [copied, setCopied] = useState(false);

  const mainIp = extractMainIp(networks);

  useEffect(() => {
    if (mainIp || !timewebToken || !serverId) return;

    const poll = async () => {
      attemptRef.current++;
      try {
        const res = await fetch(`/api/server-status?id=${serverId}`, {
          headers: { "x-timeweb-token": timewebToken },
        });
        if (!res.ok) return;
        const fresh = await res.json();
        if (fresh.networks) setNetworks(fresh.networks);
      } catch { /* игнорируем */ }

      if (attemptRef.current >= 15 && pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };

    pollingRef.current = setInterval(poll, 8000);
    const timeout = setTimeout(poll, 3000);

    return () => {
      clearInterval(pollingRef.current);
      clearTimeout(timeout);
    };
  }, [mainIp, serverId, timewebToken]);

  const sshCommand = mainIp ? `ssh root@${mainIp}` : null;

  const handleCopy = () => {
    if (!sshCommand) return;
    navigator.clipboard.writeText(sshCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!mainIp) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#8e8ea0] my-1 px-1">
        <div className="w-3 h-3 rounded-full border-2 border-t-[#10a37f] border-[#3a3a3a] animate-spin" />
        IP-адрес назначается...
      </div>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 bg-[#1e2a24] hover:bg-[#243028] border border-[#2d5a3d] rounded-lg px-3 py-2 my-1 transition-colors group max-w-sm w-full"
    >
      <Terminal size={14} className="text-[#10a37f] flex-shrink-0" />
      <span className="font-mono text-sm text-[#ececec] truncate flex-1 text-left">{sshCommand}</span>
      {copied ? (
        <Check size={14} className="text-[#10a37f] flex-shrink-0" />
      ) : (
        <Copy size={14} className="text-[#8e8ea0] group-hover:text-[#ececec] transition-colors flex-shrink-0" />
      )}
    </button>
  );
}
