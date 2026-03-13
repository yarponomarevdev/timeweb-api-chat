/** Запрос разрешения на push-уведомления браузера */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Проверка: разрешены ли уведомления */
export function isNotificationGranted(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/** Проверка: поддерживаются ли уведомления */
export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

const STATUS_LABELS: Record<string, string> = {
  on: "запущен",
  off: "выключен",
  installing: "устанавливается",
  removing: "удаляется",
  rebooting: "перезагружается",
  starting: "запускается",
  stopping: "останавливается",
};

const FINAL_STATUSES = new Set(["on", "off"]);

/** Отправить браузерное уведомление о смене статуса сервера */
export function notifyServerStatus(
  serverName: string,
  newStatus: string,
  statusLabel: string
) {
  if (!isNotificationGranted()) return;

  // Уведомляем только о финальных статусах (сервер готов / выключен)
  if (!FINAL_STATUSES.has(newStatus)) return;

  const label = STATUS_LABELS[newStatus] ?? statusLabel;
  const icon = newStatus === "on" ? "✅" : "⏹️";

  const notification = new Notification(`${icon} ${serverName}`, {
    body: `Сервер ${label}`,
    icon: "/favicon.ico",
    tag: `server-${serverName}-${newStatus}`, // дедупликация
  });

  // Фокус на вкладку при клике
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
