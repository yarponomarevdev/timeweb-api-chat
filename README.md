# Timeweb API Chat

Чат-интерфейс для управления облачными серверами [Timeweb Cloud](https://timeweb.cloud) через AI-ассистента. Вместо кликов по панели управления — просто пишете в чат: «создай сервер Ubuntu 22.04 на 2 ГБ RAM» или «покажи список серверов».

## Стек

- **Next.js 16** (App Router) + **TypeScript**
- **AI SDK v6** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) — стриминг ответов и tool calls
- **Tailwind CSS v4** + **shadcn/ui** — интерфейс
- **Timeweb Cloud API** — управление серверами

## Возможности

| Команда в чате | Tool |
|---|---|
| Показать список серверов | `list_servers` |
| Информация о сервере | `get_server` |
| Создать сервер | `propose_server` → `create_server` |
| Удалить сервер | `delete_server` |
| Запустить / остановить / перезагрузить | `server_action` |
| Показать тарифы | `list_presets` |
| Показать ОС | `list_os` |
| Баланс аккаунта | `get_balance` |

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/timeweb-api-chat.git
cd timeweb-api-chat

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
cp .env.local.example .env.local
# Заполнить TIMEWEB_TOKEN и OPENAI_API_KEY

# 4. Запустить dev-сервер
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Переменные окружения

```env
TIMEWEB_TOKEN=        # API-токен Timeweb Cloud (панель → API → Токены)
OPENAI_API_KEY=       # OpenAI API Key
```

## Структура проекта

```
app/
  api/chat/           # API route: стриминг + tool calls
  page.tsx            # Главная страница
components/
  chat.tsx            # Основной компонент чата
  chat-input.tsx      # Поле ввода
  message.tsx         # Рендер сообщений (markdown)
  server-card.tsx     # Карточка сервера
  server-create-form.tsx  # Форма создания сервера
  sidebar.tsx         # Боковая панель
lib/
  timeweb.ts          # Клиент Timeweb Cloud API
  tools.ts            # AI SDK tools (8 инструментов)
  utils.ts            # Утилиты
```

## Скрипты

```bash
npm run dev      # Запуск в режиме разработки
npm run build    # Сборка для продакшена
npm run start    # Запуск собранного приложения
npm run lint     # ESLint
```
