# Claude Code — инструкции для автоматической работы

## Режим работы
Работай **полностью автономно**. Пользователь даёт задачу — выполняй без лишних уточнений.
- Не спрашивай разрешения на чтение/редактирование/создание файлов
- Не спрашивай разрешения на запуск `npm run build`, `npm run lint`, `npm run dev`
- Не спрашивай разрешения на `git add`, `git commit`
- Задавай вопрос только если задача **принципиально неоднозначна** и без ответа нельзя двигаться дальше

## Рабочий процесс для каждой задачи
1. Прочитай нужные файлы
2. Выполни изменения
3. Запусти `npm run lint` и `npm run build` для проверки
4. Исправь ошибки если есть
5. Сделай git commit с понятным сообщением на русском языке
6. Отчитайся кратко: что сделано, что изменено

## Проект: timeweb-api-chat

**Стек:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + AI SDK (Vercel) + Zod

**Структура:**
```
app/
  page.tsx          — главная страница (UI чата)
  layout.tsx        — корневой layout
  globals.css       — глобальные стили
  api/
    chat/route.ts   — API роут для чата с LLM + Timeweb API tools
components/
  ui/               — shadcn компоненты (button, input, scroll-area, avatar, separator)
lib/
  utils.ts          — утилиты (cn)
types/              — TypeScript типы
```

**Переменные окружения** (не читать .env файлы):
- `TIMEWEB_TOKEN` — токен Timeweb API
- `OPENAI_API_KEY` — ключ OpenAI

**Ключевые зависимости:**
- `ai` + `@ai-sdk/openai` + `@ai-sdk/react` — Vercel AI SDK
- `zod` — валидация схем для tools
- `react-markdown` + `remark-gfm` — рендер markdown в чате
- `shadcn/ui` — UI компоненты

## Команды
```bash
npm run dev    # запуск dev сервера
npm run build  # сборка (обязательная проверка перед коммитом)
npm run lint   # линтер
```

## Git-конвенция
Коммит-сообщения на русском:
- `feat: <описание>` — новая функциональность
- `fix: <описание>` — исправление бага
- `refactor: <описание>` — рефакторинг
- `chore: <описание>` — настройки, зависимости

## Ограничения
- Не читать и не писать `.env`, `.env.local`, `.env.*`
- Не пушить в remote без явного запроса пользователя
- Не удалять файлы без явного запроса

## Работа с Timeweb API
Timeweb Cloud API: https://timeweb.cloud/api-docs
- REST API для управления облачными серверами, хранилищами, DNS и т.д.
- Аутентификация через Bearer token (`TIMEWEB_TOKEN`)
- Инструменты (tools) для AI SDK описывают операции Timeweb API
