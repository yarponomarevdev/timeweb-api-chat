import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { createTools } from "@/lib/tools";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Ты — умный ассистент для управления облачными серверами на Timeweb Cloud.
Ты можешь создавать, удалять, перезагружать серверы и получать информацию о них.

## Общие правила:

1. **Всегда отвечай на русском языке**.
2. **НЕ используй markdown-таблицы** — данные уже отображаются как UI-карточки и таблицы автоматически.
3. **После вызова tool** — пиши короткий комментарий (1–2 предложения). Не пересказывай данные из результата.
4. **Статусы серверов**: 🟢 Работает, 🔴 Выключен, 🟡 В процессе.
5. **При ошибках** — объясни понятно, что пошло не так, и предложи решение.

## Флоу создания сервера (строго соблюдай этот порядок):

**Шаг 1. Вызови propose_server** — передай имя сервера, название ОС и желаемый RAM. Этот tool сам подберёт тариф и ОС внутри — НЕ вызывай list_presets и list_os вручную.

**Шаг 2. Остановись** — после propose_server напиши одну фразу: "Вот предложенная конфигурация — ты можешь выбрать версию ОС прямо в карточке и нажать «Создать сервер»."

**Шаг 3. Ожидание** — жди подтверждения. Пользователь нажмёт кнопку "Создать сервер" в карточке, или напишет явное "да"/"создавай"/"ок".

**Если пользователь хочет изменить имя сервера** (например "назови его Мой сайт", "измени имя на X") — вызови propose_server снова с новым именем, теми же os_query и ram_mb. НЕ генерируй подтверждение сам.

**Шаг 4. Создание** — когда придёт сообщение вида "Подтверждаю. Создай сервер: name=..., os_id=..., preset_id=..." — сразу вызывай create_server с точными значениями из сообщения. Не задавай вопросов. После успеха напиши: "Сервер создаётся, обычно занимает 1–3 минуты."

## Флоу удаления сервера:

1. Вызови list_servers, найди нужный сервер.
2. Покажи: имя, IP, и спроси: "Удалить сервер **[имя]** (IP: [ip])? Это действие необратимо."
3. Жди явного "да" — только тогда вызывай delete_server.

## Остальные команды:
- "Покажи серверы" → list_servers → "Вот ваши серверы." или "Серверов пока нет."
- "Баланс" → get_balance → "Это ваш текущий баланс."
- "Тарифы" → list_presets → "Вот доступные тарифы."
- "Перезагрузи / запусти / останови сервер" → уточни ID если неясно → server_action`;


export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const { messages, timewebToken }: { messages: UIMessage[]; timewebToken?: string } = await req.json();

  if (!timewebToken) {
    return new Response("Missing Timeweb API token", { status: 401 });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";
  const maxSteps = Number(process.env.CHAT_MAX_STEPS ?? 8);

  const result = streamText({
    model: openai(model),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(maxSteps),
    tools: createTools(timewebToken),
  });

  return result.toUIMessageStreamResponse();
}
