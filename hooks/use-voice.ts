"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { UIMessage } from "ai";
import { isTextUIPart } from "ai";

export type VoiceState = "idle" | "recording" | "transcribing" | "speaking";

const MAX_RECORDING_SECONDS = 120;

function getMediaRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

/**
 * Извлекает чистый текст из сообщения для TTS.
 * Убирает markdown, код, tool calls.
 */
export function extractTextForTTS(message: UIMessage): string {
  const textParts = message.parts?.filter(isTextUIPart) ?? [];
  const raw = textParts.map((p) => p.text).join("\n");

  let text = raw
    // Убираем блоки кода (```...```)
    .replace(/```[\s\S]*?```/g, "")
    // Убираем инлайн-код
    .replace(/`([^`]+)`/g, "$1")
    // Убираем заголовки (оставляем текст)
    .replace(/^#{1,6}\s+/gm, "")
    // Убираем ссылки [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Убираем жирный и курсив
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Убираем маркеры списков
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Убираем горизонтальные линии
    .replace(/^---+$/gm, "")
    // Убираем пустые строки (множественные → одна)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.slice(0, 4096);
}

export function useVoice(openaiKey: string) {
  const [state, setState] = useState<VoiceState>("idle");
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined" &&
    !!getMediaRecorderMimeType();

  // Очистка object URL
  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Остановка воспроизведения
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    revokeObjectUrl();
    setState((s) => (s === "speaking" ? "idle" : s));
  }, [revokeObjectUrl]);

  // Остановка таймера записи
  const stopRecordingTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingSeconds(0);
  }, []);

  // Остановка записи (внутренняя)
  const stopMediaRecorder = useCallback(() => {
    stopRecordingTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [stopRecordingTimer]);

  // Начать запись
  const startRecording = useCallback(async () => {
    if (!isSupported) return;

    // Остановить текущее воспроизведение
    stopSpeaking();

    const mimeType = getMediaRecorderMimeType();
    if (!mimeType) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setState("recording");
      setRecordingSeconds(0);

      // Таймер
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s + 1 >= MAX_RECORDING_SECONDS) {
            // Автостоп — вызовет onstop через stopMediaRecorder
            stopMediaRecorder();
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("[useVoice] getUserMedia error:", err);
      throw err;
    }
  }, [isSupported, stopSpeaking, stopMediaRecorder]);

  // Остановить запись и транскрибировать
  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setState("idle");
        resolve("");
        return;
      }

      recorder.onstop = async () => {
        // Останавливаем треки
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];

        if (blob.size === 0) {
          setState("idle");
          resolve("");
          return;
        }

        setState("transcribing");

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            headers: { "x-openai-key": openaiKey },
            body: formData,
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP ${res.status}`);
          }

          const data = await res.json();
          setState("idle");
          resolve(data.text ?? "");
        } catch (err) {
          setState("idle");
          reject(err);
        }
      };

      stopRecordingTimer();
      recorder.stop();
    });
  }, [openaiKey, stopRecordingTimer]);

  // Озвучить текст
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Остановить предыдущее воспроизведение
    stopSpeaking();

    setState("speaking");

    try {
      const res = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-key": openaiKey,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const audioBlob = await res.blob();
      const url = URL.createObjectURL(audioBlob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        revokeObjectUrl();
        audioRef.current = null;
        setState("idle");
      };

      audio.onerror = () => {
        revokeObjectUrl();
        audioRef.current = null;
        setState("idle");
      };

      await audio.play();
    } catch (err) {
      console.error("[useVoice] speak error:", err);
      setState("idle");
    }
  }, [openaiKey, stopSpeaking, revokeObjectUrl]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      stopMediaRecorder();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [stopMediaRecorder]);

  return {
    state,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
    lastInputWasVoice,
    setLastInputWasVoice,
    isSupported,
    recordingSeconds,
  };
}
