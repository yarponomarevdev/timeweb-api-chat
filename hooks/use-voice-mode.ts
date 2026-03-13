"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceModeState =
  | "idle"        // ожидание речи, VAD активен
  | "listening"   // речь обнаружена, идёт запись
  | "processing"  // транскрибируется / ожидание LLM
  | "speaking";   // воспроизведение TTS

interface UseVoiceModeOptions {
  openaiKey: string;
  onTranscription: (text: string) => void;
  enabled: boolean;
}

// Пороги VAD
const SPEECH_THRESHOLD = 15;   // порог начала речи (RMS из 0-255)
const SILENCE_THRESHOLD = 10;  // порог тишины
const SILENCE_DURATION = 1500; // мс тишины для остановки записи
const SPEECH_MIN_DURATION = 300; // мс речи для начала записи (защита от кликов)

function getMediaRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

export function useVoiceMode({ openaiKey, onTranscription, enabled }: UseVoiceModeOptions) {
  const [state, setState] = useState<VoiceModeState>("idle");

  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechStartRef = useRef<number>(0);
  const silenceStartRef = useRef<number>(0);
  const isRecordingRef = useRef(false);
  const stateRef = useRef<VoiceModeState>("idle");
  const enabledRef = useRef(enabled);

  // Синхронизируем ref с state для доступа из интервалов/колбэков
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // Вычисляем RMS из frequency data
  const getRMS = useCallback(() => {
    const analyser = micAnalyserRef.current;
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length;
  }, []);

  // Старт записи (внутренний)
  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || isRecordingRef.current) return;

    const mimeType = getMediaRecorderMimeType();
    if (!mimeType) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start();
    isRecordingRef.current = true;
    setState("listening");
  }, []);

  // Стоп записи и отправка на транскрибацию (внутренний)
  const stopRecordingAndTranscribe = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    isRecordingRef.current = false;
    setState("processing");

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];

        if (blob.size === 0) {
          if (enabledRef.current) setState("idle");
          resolve();
          return;
        }

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            headers: { "x-openai-key": openaiKey },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text?.trim()) {
              onTranscription(data.text.trim());
            } else if (enabledRef.current) {
              setState("idle");
            }
          } else if (enabledRef.current) {
            setState("idle");
          }
        } catch {
          if (enabledRef.current) setState("idle");
        }
        resolve();
      };

      recorder.stop();
    });
  }, [openaiKey, onTranscription]);

  // VAD loop
  const startVAD = useCallback(() => {
    if (vadIntervalRef.current) return;

    vadIntervalRef.current = setInterval(() => {
      if (!enabledRef.current) return;

      const rms = getRMS();
      const now = Date.now();
      const currentState = stateRef.current;

      if (currentState === "idle") {
        if (rms > SPEECH_THRESHOLD) {
          if (speechStartRef.current === 0) {
            speechStartRef.current = now;
          } else if (now - speechStartRef.current >= SPEECH_MIN_DURATION) {
            speechStartRef.current = 0;
            silenceStartRef.current = 0;
            startRecording();
          }
        } else {
          speechStartRef.current = 0;
        }
      } else if (currentState === "listening") {
        if (rms < SILENCE_THRESHOLD) {
          if (silenceStartRef.current === 0) {
            silenceStartRef.current = now;
          } else if (now - silenceStartRef.current >= SILENCE_DURATION) {
            silenceStartRef.current = 0;
            stopRecordingAndTranscribe();
          }
        } else {
          silenceStartRef.current = 0;
        }
      }
    }, 50);
  }, [getRMS, startRecording, stopRecordingAndTranscribe]);

  const stopVAD = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    speechStartRef.current = 0;
    silenceStartRef.current = 0;
  }, []);

  // Инициализация микрофона и аудио-контекста
  const start = useCallback(async () => {
    if (streamRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Analyser для микрофона
    const micAnalyser = ctx.createAnalyser();
    micAnalyser.fftSize = 256;
    micAnalyser.smoothingTimeConstant = 0.8;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(micAnalyser);
    micAnalyserRef.current = micAnalyser;

    // Analyser для TTS вывода
    const speakerAnalyser = ctx.createAnalyser();
    speakerAnalyser.fftSize = 256;
    speakerAnalyser.smoothingTimeConstant = 0.8;
    speakerAnalyserRef.current = speakerAnalyser;

    setState("idle");
    startVAD();
  }, [startVAD]);

  // Полная остановка
  const stop = useCallback(() => {
    stopVAD();

    if (isRecordingRef.current && mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
      isRecordingRef.current = false;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    micAnalyserRef.current = null;
    speakerAnalyserRef.current = null;

    setState("idle");
  }, [stopVAD]);

  // TTS — озвучить текст
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Остановить предыдущее воспроизведение
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

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

      if (!res.ok) throw new Error(await res.text());

      const audioBlob = await res.blob();
      const url = URL.createObjectURL(audioBlob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      // Подключаем к speaker analyser для визуализации
      const ctx = audioContextRef.current;
      const speakerAnalyser = speakerAnalyserRef.current;
      if (ctx && speakerAnalyser) {
        const source = ctx.createMediaElementSource(audio);
        source.connect(speakerAnalyser);
        speakerAnalyser.connect(ctx.destination);
      }

      audio.onended = () => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        audioRef.current = null;
        if (enabledRef.current) setState("idle");
      };

      audio.onerror = () => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        audioRef.current = null;
        if (enabledRef.current) setState("idle");
      };

      await audio.play();
    } catch (err) {
      console.error("[useVoiceMode] speak error:", err);
      if (enabledRef.current) setState("idle");
    }
  }, [openaiKey]);

  // Остановить воспроизведение
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (enabledRef.current) setState("idle");
  }, []);

  // Пауза/возобновление VAD при смене enabled
  useEffect(() => {
    if (enabled && streamRef.current && !vadIntervalRef.current) {
      // Сброс состояния при повторном включении
      if (isRecordingRef.current && mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
        isRecordingRef.current = false;
      }
      speechStartRef.current = 0;
      silenceStartRef.current = 0;
      setState("idle");
      startVAD();
    } else if (!enabled) {
      stopVAD();
      // Остановить запись если шла
      if (isRecordingRef.current && mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
        isRecordingRef.current = false;
      }
      setState("idle");
    }
  }, [enabled, startVAD, stopVAD]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    setState,
    micAnalyser: micAnalyserRef.current,
    speakerAnalyser: speakerAnalyserRef.current,
    micAnalyserRef,
    speakerAnalyserRef,
    start,
    stop,
    speak,
    stopSpeaking,
  };
}
