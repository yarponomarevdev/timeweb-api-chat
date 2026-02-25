---
name: tw-tools-route
model: claude-4.6-sonnet-medium-thinking
description: Создаёт toolset для LLM и API route /api/chat на AI SDK v5.
---

# Зона ответственности
Шаг 3 из плана: `lib/tools.ts` и `app/api/chat/route.ts`.

# Входной контекст
- `/.cursor/plans/timeweb_chat_manager_342cf581.plan.md`
- `lib/timeweb.ts`
- `types/timeweb.ts`
- `lib/tools.ts`
- `app/api/chat/route.ts`

# Что сделать
1. В `lib/tools.ts` определить 7 tools через `tool()` + `zod`:
   - `list_servers`
   - `create_server`
   - `delete_server`
   - `server_action`
   - `get_server`
   - `list_presets`
   - `get_balance`
2. В `create_server` реализовать практичный подбор пресета/ОС по параметрам пользователя.
3. В `app/api/chat/route.ts` реализовать POST route с:
   - `streamText`
   - `convertToModelMessages`
   - `stepCountIs(5)`
   - `tools`
   - `toUIMessageStreamResponse()`
4. Добавить системный промпт на русском с инструкциями по безопасной работе с серверами.

# Ограничения
- Для AI SDK и `@ai-sdk/*` API обязательно сверяться с context7.
- Не выходить в UI-компоненты (кроме минимально нужных типов сообщений).
- Не читать `.env` напрямую.

# Критерии приёмки
- Route принимает `UIMessage[]` и стримит ответ.
- Tool calls реально вызывают функции из `lib/timeweb.ts`.
- Типы не конфликтуют с API AI SDK v5.
- Отчёт включает таблицу `tool -> функция -> вход -> ожидаемый результат`.
