"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff, Link } from "lucide-react";

export interface ConnectionField {
  label: string;
  value: string;
  /** Чувствительное поле (пароль) — скрыто по умолчанию */
  sensitive?: boolean;
  /** Моноширинный шрифт */
  mono?: boolean;
}

interface ConnectionInfoProps {
  title?: string;
  fields: ConnectionField[];
}

export function ConnectionInfo({ title = "Данные для подключения", fields }: ConnectionInfoProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (fields.length === 0) return null;

  const handleCopy = (value: string, idx: number) => {
    navigator.clipboard.writeText(value);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleCopyAll = () => {
    const text = fields.map((f) => `${f.label}: ${f.value}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const toggleReveal = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="bg-[#1e2a24] rounded-xl border border-[#2d5a3d] my-2 overflow-hidden w-full max-w-md">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2d5a3d]">
        <div className="flex items-center gap-2 text-sm font-medium text-[#10a37f]">
          <Link size={14} />
          {title}
        </div>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 text-xs text-[#8e8ea0] hover:text-[#ececec] transition-colors px-2 py-1 rounded-md hover:bg-[#2a3a30]"
        >
          {copiedAll ? (
            <>
              <Check size={12} className="text-[#10a37f]" />
              <span className="text-[#10a37f]">Скопировано</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              Копировать всё
            </>
          )}
        </button>
      </div>

      {/* Поля */}
      <div className="divide-y divide-[#2a3a30]">
        {fields.map((field, idx) => {
          const isRevealed = revealed.has(idx);
          const displayValue = field.sensitive && !isRevealed
            ? "••••••••"
            : field.value;

          return (
            <div
              key={idx}
              className="flex items-center justify-between px-4 py-2 gap-3 group hover:bg-[#243028] transition-colors"
            >
              <span className="text-xs text-[#8e8ea0] min-w-[100px] flex-shrink-0">
                {field.label}
              </span>
              <span
                className={`text-sm text-[#ececec] truncate flex-1 text-right ${
                  field.mono || field.sensitive ? "font-mono" : ""
                } ${field.sensitive && !isRevealed ? "tracking-wider text-[#8e8ea0]" : ""}`}
              >
                {displayValue}
              </span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {field.sensitive && (
                  <button
                    onClick={() => toggleReveal(idx)}
                    className="p-1 rounded text-[#8e8ea0] hover:text-[#ececec] transition-colors"
                    title={isRevealed ? "Скрыть" : "Показать"}
                  >
                    {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
                <button
                  onClick={() => handleCopy(field.value, idx)}
                  className="p-1 rounded text-[#8e8ea0] hover:text-[#ececec] transition-colors"
                  title="Копировать"
                >
                  {copiedIdx === idx ? (
                    <Check size={13} className="text-[#10a37f]" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Хелперы для построения полей из tool output ───

type ServerNetworks = Array<{ type: string; ips: Array<{ ip: string; is_main: boolean; type: string }> }>;

/** Поля подключения для сервера */
export function serverConnectionFields(output: Record<string, unknown>): ConnectionField[] {
  const fields: ConnectionField[] = [];

  const networks = output.networks as ServerNetworks | undefined;
  const allIps = networks?.flatMap((n) => n.ips) ?? [];
  const mainIp = allIps.find((ip) => ip.is_main && ip.type === "ipv4")?.ip;
  const extraIpv4 = allIps
    .filter((ip) => ip.type === "ipv4" && !ip.is_main)
    .map((ip) => ip.ip);

  if (mainIp) {
    fields.push({ label: "IP-адрес", value: mainIp, mono: true });
  } else {
    // Если IP ещё не назначен — показываем placeholder
    fields.push({ label: "IP-адрес", value: "Назначается..." });
  }

  for (const ip of extraIpv4) {
    fields.push({ label: "Доп. IP", value: ip, mono: true });
  }

  fields.push({ label: "Логин", value: "root", mono: true });
  fields.push({ label: "Пароль", value: "Отправлен на email аккаунта" });
  fields.push({ label: "SSH-порт", value: "22", mono: true });

  if (mainIp) {
    fields.push({ label: "Подключение", value: `ssh root@${mainIp}`, mono: true });
  }

  const os = output.os as string | undefined;
  const osVersion = output.os_version as string | undefined;
  if (os) fields.push({ label: "ОС", value: osVersion ? `${os} ${osVersion}` : os });

  const software = output.software as string | undefined;
  if (software) fields.push({ label: "ПО", value: software });

  return fields;
}

/** Поля подключения для базы данных */
export function databaseConnectionFields(output: Record<string, unknown>): ConnectionField[] {
  const fields: ConnectionField[] = [];

  const host = (output.host ?? output.external_hostname) as string | undefined;
  const port = output.port as number | undefined;
  const login = output.login as string | undefined;
  const password = output.password as string | undefined;
  const type = output.type as string | undefined;
  const ip = output.ip as string | undefined;

  if (host) fields.push({ label: "Хост", value: host, mono: true });
  if (ip && ip !== host) fields.push({ label: "IP", value: ip, mono: true });
  if (port) fields.push({ label: "Порт", value: String(port), mono: true });
  if (login) fields.push({ label: "Логин", value: login, mono: true });
  if (password) fields.push({ label: "Пароль", value: password, sensitive: true, mono: true });
  if (type) fields.push({ label: "Тип БД", value: type.toUpperCase() });

  return fields;
}

/** Поля подключения для почтового ящика */
export function mailConnectionFields(output: Record<string, unknown>): ConnectionField[] {
  const fields: ConnectionField[] = [];

  const email = output.email as string | undefined;
  const password = output.password as string | undefined;
  const imap = output.imap as { host: string; port: number; ssl: boolean } | undefined;
  const smtp = output.smtp as { host: string; port: number; ssl: boolean } | undefined;
  const webmail = output.webmail as string | undefined;

  if (email) fields.push({ label: "Email", value: email, mono: true });
  if (password) fields.push({ label: "Пароль", value: password, sensitive: true, mono: true });
  if (imap) fields.push({ label: "IMAP", value: `${imap.host}:${imap.port} (SSL)`, mono: true });
  if (smtp) fields.push({ label: "SMTP", value: `${smtp.host}:${smtp.port} (SSL)`, mono: true });
  if (webmail) fields.push({ label: "Веб-почта", value: webmail, mono: true });

  return fields;
}

/** Поля подключения для S3 бакета */
export function bucketConnectionFields(output: Record<string, unknown>): ConnectionField[] {
  const fields: ConnectionField[] = [];

  const name = output.name as string | undefined;
  const hostname = output.hostname as string | undefined;
  const s3Endpoint = output.s3_endpoint as string | undefined;
  const accessKey = output.access_key as string | undefined;
  const secretKey = output.secret_key as string | undefined;

  if (name) fields.push({ label: "Бакет", value: name, mono: true });
  if (hostname) fields.push({ label: "Hostname", value: hostname, mono: true });
  if (s3Endpoint) fields.push({ label: "Endpoint", value: s3Endpoint, mono: true });
  if (accessKey) fields.push({ label: "Access Key", value: accessKey, mono: true });
  if (secretKey) fields.push({ label: "Secret Key", value: secretKey, sensitive: true, mono: true });

  return fields;
}

/** Поля подключения для K8s кластера */
export function k8sConnectionFields(output: Record<string, unknown>): ConnectionField[] {
  const fields: ConnectionField[] = [];

  const name = output.name as string | undefined;
  const version = output.k8s_version as string | undefined;
  const region = output.region as string | undefined;
  const driver = output.network_driver as string | undefined;

  if (name) fields.push({ label: "Кластер", value: name });
  if (version) fields.push({ label: "Версия K8s", value: version, mono: true });
  if (driver) fields.push({ label: "Сеть", value: driver });
  if (region) fields.push({ label: "Регион", value: region });

  return fields;
}

/** Определить, есть ли в output данные для ConnectionInfo */
export function hasConnectionData(output: Record<string, unknown>): boolean {
  return !!(
    output.password ||
    output.host ||
    output.hostname ||
    output.access_key ||
    output.imap ||
    output.s3_endpoint ||
    (output.networks && Array.isArray(output.networks) && (output.networks as unknown[]).length > 0)
  );
}
