# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды

```bash
npm run dev      # dev сервер на http://localhost:3000
npm run build    # production сборка (обязательно перед коммитом)
npm run lint     # ESLint проверка
npm run start    # запуск production сборки
```

Тесты отсутствуют. Перед коммитом запускать `npm run build` для проверки TypeScript.

## Архитектура

**Принцип BYOK (Bring Your Own Key):** ключи API хранятся только в `localStorage` браузера и передаются с каждым запросом в заголовках (`x-timeweb-token`, `x-openai-key`). Бэкенд не хранит ключи.

### Поток данных

```
HomeClient → ApiKeySetup (первый запуск) → Chat → API route
                                                       ↓
                                              lib/tools.ts (8 Vercel AI tools)
                                                       ↓
                                              lib/timeweb.ts (REST клиент)
                                                       ↓
                                              api.timeweb.com/api/v1
```

### Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `app/api/chat/route.ts` | Единственный API endpoint. Принимает ключи из заголовков, передаёт их в tools через `toolContext`. Rate limiting (20 req/min). |
| `lib/tools.ts` | 8 AI tools: `list_servers`, `get_server`, `create_server`, `delete_server`, `server_action`, `propose_server`, `list_presets`, `list_os`, `get_balance`. |
| `lib/timeweb.ts` | REST клиент Timeweb API. Все методы получают `token` как параметр. |
| `lib/rate-limit.ts` | In-memory sliding window лимитер. |
| `components/home-client.tsx` | Управляет состоянием ключей, переключает между `ApiKeySetup` и `Chat`. |
| `components/chat.tsx` | Основной чат: история в `localStorage`, scroll-lock, retry. |
| `components/message.tsx` | Рендер сообщений и tool-результатов (ServerCard, ServerCreateForm, таблицы, баланс). |

### Двухшаговое создание серверов

`propose_server` → `ServerCreateForm` (пользователь подтверждает) → `create_server`. Форма рендерится через специальный `toolInvocation` с типом `propose_server`.

### Env переменные

```
TIMEWEB_TOKEN   # fallback токен (если не передан из клиента)
OPENAI_API_KEY  # fallback ключ OpenAI (если не передан из клиента)
```

Файл `.env.local.example` содержит шаблон.

## Стек

- **Next.js 16** App Router, SSR отключён для чата (`dynamic('...', { ssr: false })`)
- **Vercel AI SDK** v6: `streamText`, `tool` из `ai`; `@ai-sdk/openai` провайдер; `useChat` из `@ai-sdk/react`
- **Tailwind CSS v4** + `tw-animate-css`
- **shadcn/ui** компоненты в `components/ui/`
- **Zod v4** — схемы параметров для tools
- **react-markdown** + **remark-gfm** — рендер ответов ассистента

## Соглашения

- Все комментарии и строки интерфейса — на **русском языке**
- Коммит-сообщения — на **русском языке** с префиксом (`feat:`, `fix:`, `chore:` и т.д.)
- Тёмная тема: фон `#212121`, акцент `#10a37f` (определены в `globals.css` как CSS-переменные)
- shadcn компоненты добавлять через `npx shadcn add <component>`
