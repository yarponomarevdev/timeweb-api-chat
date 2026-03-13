"use client";

import { useRef, useEffect } from "react";
import type { VoiceModeState } from "@/hooks/use-voice-mode";

interface VoiceWaveformProps {
  state: VoiceModeState;
  micAnalyserRef: React.RefObject<AnalyserNode | null>;
  speakerAnalyserRef: React.RefObject<AnalyserNode | null>;
}

// Параметры волн
const WAVE_LAYERS = [
  { frequency: 0.015, speed: 0.025, baseAmplitude: 0.12, opacity: 0.7 },
  { frequency: 0.022, speed: -0.018, baseAmplitude: 0.09, opacity: 0.5 },
  { frequency: 0.030, speed: 0.032, baseAmplitude: 0.06, opacity: 0.35 },
  { frequency: 0.012, speed: -0.012, baseAmplitude: 0.15, opacity: 0.25 },
];

const ACCENT = { r: 16, g: 163, b: 127 }; // #10a37f

export function VoiceWaveform({ state, micAnalyserRef, speakerAnalyserRef }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phasesRef = useRef(WAVE_LAYERS.map(() => Math.random() * Math.PI * 2));
  const animRef = useRef<number>(0);
  const smoothedDataRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Получаем аудио данные
      const analyser =
        state === "speaking"
          ? speakerAnalyserRef.current
          : state === "listening"
            ? micAnalyserRef.current
            : micAnalyserRef.current; // idle — мягкая реакция на фон

      let audioData: Float32Array;
      const binCount = analyser?.frequencyBinCount ?? 64;

      if (!smoothedDataRef.current || smoothedDataRef.current.length !== binCount) {
        smoothedDataRef.current = new Float32Array(binCount);
      }

      if (analyser) {
        const raw = new Uint8Array(binCount);
        analyser.getByteFrequencyData(raw);
        for (let i = 0; i < binCount; i++) {
          const normalized = raw[i] / 255;
          const smoothing = state === "idle" ? 0.95 : 0.85;
          smoothedDataRef.current[i] =
            smoothedDataRef.current[i] * smoothing + normalized * (1 - smoothing);
        }
        audioData = smoothedDataRef.current;
      } else {
        audioData = smoothedDataRef.current;
        // Затухание при отсутствии analyser
        for (let i = 0; i < audioData.length; i++) {
          audioData[i] *= 0.95;
        }
      }

      // Множитель амплитуды по состоянию
      const ampMultiplier =
        state === "listening" ? 2.5 :
        state === "speaking" ? 3.0 :
        state === "processing" ? 0.6 :
        0.4; // idle

      // Рисуем волны
      for (let li = 0; li < WAVE_LAYERS.length; li++) {
        const layer = WAVE_LAYERS[li];
        phasesRef.current[li] += layer.speed;

        ctx.beginPath();

        // Glow
        ctx.shadowBlur = state === "idle" ? 8 : 20;
        ctx.shadowColor = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${layer.opacity * 0.6})`;

        for (let x = 0; x <= w; x += 2) {
          // Индекс в аудио данных (0..binCount-1) пропорционально x
          const audioIdx = Math.floor((x / w) * (audioData.length - 1));
          const audioMod = audioData[audioIdx] ?? 0;

          const baseWave = Math.sin(x * layer.frequency + phasesRef.current[li]);
          // Дополнительная гармоника для сложности
          const harmonic = Math.sin(x * layer.frequency * 2.3 + phasesRef.current[li] * 1.5) * 0.3;

          const baseFactor = state === "idle" || state === "processing" ? 0.5 : 0.2;
          const amplitude =
            h * layer.baseAmplitude * (baseFactor + audioMod * ampMultiplier) +
            (state === "processing" ? Math.sin(Date.now() / 500 + li) * h * 0.03 : 0);

          const y = centerY + (baseWave + harmonic) * amplitude;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${layer.opacity})`;
        ctx.lineWidth = state === "idle" ? 1.5 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [state, micAnalyserRef, speakerAnalyserRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: "200px" }}
    />
  );
}
