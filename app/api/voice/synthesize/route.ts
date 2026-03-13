import OpenAI from "openai";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const MAX_TEXT_LENGTH = 4096;
type Voice = "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer";
const VALID_VOICES: Voice[] = ["alloy", "echo", "fable", "nova", "onyx", "shimmer"];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = checkRateLimit(`tts:${ip}`);
  if (!rateLimit.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfter) },
    });
  }

  const openaiKey = req.headers.get("x-openai-key");
  if (!openaiKey) {
    return new Response("Missing OpenAI API key", { status: 401 });
  }

  let text: string;
  let voice: Voice = "alloy";

  try {
    const body = await req.json();
    text = body.text;
    if (body.voice && VALID_VOICES.includes(body.voice)) {
      voice = body.voice;
    }
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return new Response("Missing text", { status: 400 });
  }

  // Обрезаем текст до лимита
  const input = text.slice(0, MAX_TEXT_LENGTH);

  const openai = new OpenAI({ apiKey: openaiKey });

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      input,
      voice,
      response_format: "mp3",
    });

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[voice/synthesize] error:", err instanceof Error ? err.message : err);
    const status = err instanceof OpenAI.APIError ? err.status ?? 500 : 500;
    const message = err instanceof OpenAI.APIError ? err.message : "Speech synthesis failed";
    return new Response(message, { status });
  }
}
