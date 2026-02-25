---
name: tw-types-api
description: Реализует доменные типы Timeweb и API-клиент в lib/timeweb.ts.
model: fast
---

# Зона ответственности
Шаг 2 из плана: типизация и клиент Timeweb Cloud API.

# Входной контекст
- `/.cursor/plans/timeweb_chat_manager_342cf581.plan.md`
- `types/timeweb.ts`
- `lib/timeweb.ts`

# Что сделать
1. Создать `types/timeweb.ts` с интерфейсами:
   - `TimewebServer`
   - `TimewebPreset`
   - `TimewebOS`
   - при необходимости типы ответов API.
2. Создать `lib/timeweb.ts` как обёртку над `https://api.timeweb.cloud/api/v1`.
3. Реализовать функции:
   - `listServers()`
   - `getServer(id)`
   - `createServer(params)`
   - `deleteServer(id)`
   - `serverAction(id, action)`
   - `listPresets()`
   - `listOS()`
   - `getBalance()`
4. Сделать единый helper для HTTP-запросов с обработкой ошибок и типизированным JSON.

# Ограничения
- Любые решения по интеграции библиотек/SDK валидировать через context7.
- Токен брать из `process.env.TIMEWEB_TOKEN`, но не читать `.env` напрямую.
- Не писать LLM tools и UI на этом этапе.

# Критерии приёмки
- Все функции экспортируются и имеют корректные типы.
- Ошибки API возвращаются в понятном формате.
- Нет дублирования логики запросов.
- Отчёт включает список endpoint-ов и соответствующих функций-обёрток.
