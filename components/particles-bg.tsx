"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

interface ParticlesBgProps {
  active: boolean;
}

export function ParticlesBg({ active }: ParticlesBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: import("three").WebGLRenderer | undefined;
    let mounted = true;
    let cleanupFn: (() => void) | null = null;

    import("three").then((THREE) => {
      if (!mounted) return;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);

      const scene = new THREE.Scene();
      // Камера дальше — частицы не могут приблизиться до критической дистанции
      const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 1, 500);
      camera.position.z = 60;

      const count = 160;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 140; // X: ±70 (весь экран)
        positions[i * 3 + 1] = (Math.random() - 0.5) * 90;  // Y: ±45 (весь экран)
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;  // Z: ±10 (далеко от камеры)
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      // Скорости в рад/сек — непрерывная анимация без оборота счётчика
      const speeds  = Array.from({ length: count }, () => 0.08 + Math.random() * 0.12);
      const offsets = Array.from({ length: count }, () => Math.random() * Math.PI * 2);
      const initialPositions = new Float32Array(positions);

      // Круглая soft-dot текстура, чтобы не было квадратов
      const dotCanvas = document.createElement("canvas");
      dotCanvas.width  = 32;
      dotCanvas.height = 32;
      const ctx = dotCanvas.getContext("2d")!;
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0,   "rgba(255,255,255,1)");
      grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
      grad.addColorStop(1,   "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      const dotTexture = new THREE.CanvasTexture(dotCanvas);

      const material = new THREE.PointsMaterial({
        color: 0x10a37f,
        size: 0.7,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
        map: dotTexture,
        alphaMap: dotTexture,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const onResize = () => {
        if (!renderer || !canvas) return;
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanupFn = () => {
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
        dotTexture.dispose();
      };

      const tick = () => {
        if (!mounted) return;
        if (!activeRef.current) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        // performance.now() в секундах — непрерывное время без разрывов
        const t = performance.now() * 0.001;
        const pos = geometry.attributes.position as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = 0; i < count; i++) {
          arr[i * 3]     = initialPositions[i * 3]     + Math.cos(t * speeds[i] * 0.7 + offsets[i]) * 3;
          arr[i * 3 + 1] = initialPositions[i * 3 + 1] + Math.sin(t * speeds[i]       + offsets[i]) * 2;
          // Z фиксирован — никакой ротации, частицы не летят на камеру
        }
        pos.needsUpdate = true;

        renderer!.render(scene, camera);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
      cleanupFn?.();
      renderer?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0,
        opacity: active ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    />
  );
}
