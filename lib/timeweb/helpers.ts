import type { TimewebServer } from "@/types/timeweb";

/**
 * Возвращает размер диска сервера в ГБ.
 * Сначала проверяет поле disk, затем суммирует массив disks[].size.
 * Если значение > 1000 — считаем МБ и делим на 1024, иначе уже ГБ.
 */
export function getServerDiskGB(server: TimewebServer): number {
  const raw = server.disk
    || server.disks?.reduce((sum, d) => sum + (d.size ?? 0), 0)
    || 0;
  if (!raw) return 0;
  return raw > 1000 ? Math.round(raw / 1024) : raw;
}

export function getStatusLabel(status: TimewebServer["status"]): string {
  const map: Record<string, string> = {
    on: "Работает",
    off: "Выключен",
    installing: "Установка",
    removing: "Удаление",
    rebooting: "Перезагрузка",
    starting: "Запуск",
    stopping: "Остановка",
    resetting_password: "Сброс пароля",
    reinstalling: "Переустановка",
    backup_creating: "Создание бэкапа",
    backup_restoring: "Восстановление",
    cloning: "Клонирование",
    migrating: "Миграция",
  };
  return map[status] ?? status;
}
