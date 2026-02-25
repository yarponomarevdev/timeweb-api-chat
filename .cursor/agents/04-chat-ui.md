---
name: tw-chat-ui
model: gemini-3.1-pro
description: Реализует ChatGPT-like интерфейс и компоненты отображения tool-результатов.
---

# Зона ответственности
Шаг 4 из плана: UI-слой чата.

# Входной контекст
- `/.cursor/plans/timeweb_chat_manager_342cf581.plan.md`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/*`

# Что сделать
1. Реализовать:
   - `components/chat.tsx`
   - `components/message.tsx`
   - `components/chat-input.tsx`
   - `components/sidebar.tsx`
   - `components/server-card.tsx`
2. Обновить:
   - `app/page.tsx`
   - `app/layout.tsx`
   - `app/globals.css`
3. Использовать `useChat` из `@ai-sdk/react` и рендер `message.parts` (text + tool parts).
4. Подключить `react-markdown` + `remark-gfm`.
5. Выдержать цветовую схему:
   - фон `#212121`
   - сайдбар `#171717`
   - карточки `#2f2f2f`
   - текст `#ececec`
   - акцент `#10a37f`

# Ограничения
- Для API `useChat` и связанных библиотек сверяться через context7.
- Не менять серверную логику tools/route без необходимости.
- Компоненты должны быть переиспользуемыми и без хардкода бизнес-логики.

# Критерии приёмки
- Сообщения отправляются и стримятся в интерфейс.
- Tool-ответы отображаются структурно (включая карточки серверов).
- Визуально соблюдена тёмная тема и читаемость.
- Отчёт включает короткий UI smoke-check (ввод, отправка, стрим, рендер tool-результата).
