import OpenAI from "openai";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = checkRateLimit(`stt:${ip}`);
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const audio = formData.get("audio");
  if (!audio || !(audio instanceof Blob)) {
    return new Response("Missing audio file", { status: 400 });
  }

  const openai = new OpenAI({ apiKey: openaiKey });

  try {
    // Конвертируем Blob в File для OpenAI SDK
    const file = new File([audio], "recording.webm", { type: audio.type || "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
    });

    return Response.json({ text: transcription.text });
  } catch (err) {
    console.error("[voice/transcribe] error:", err instanceof Error ? err.message : err);
    const status = err instanceof OpenAI.APIError ? err.status ?? 500 : 500;
    const message = err instanceof OpenAI.APIError ? err.message : "Transcription failed";
    return new Response(message, { status });
  }
}
