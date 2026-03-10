"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

interface ParticlesBgProps {
  active: boolean;
}

export function ParticlesBg({ active }: ParticlesBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

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
      const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      camera.position.z = 50;

      const count = 120;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const speeds = Array.from({ length: count }, () => 0.002 + Math.random() * 0.004);
      const offsets = Array.from({ length: count }, () => Math.random() * Math.PI * 2);

      const material = new THREE.PointsMaterial({
        color: 0x10a37f,
        size: 0.5,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
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

      // Сохраняем cleanup для внешнего return
      cleanupFn = () => {
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
      };

      let frame = 0;
      const tick = () => {
        if (!mounted) return;
        frame++;
        const pos = geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
          (pos.array as Float32Array)[i * 3 + 1] += Math.sin(frame * speeds[i] + offsets[i]) * 0.012;
          (pos.array as Float32Array)[i * 3] += Math.cos(frame * speeds[i] * 0.7 + offsets[i]) * 0.006;
        }
        pos.needsUpdate = true;
        points.rotation.y += 0.0003;
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
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    />
  );
}
