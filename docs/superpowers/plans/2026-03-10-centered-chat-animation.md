# Centered Chat Animation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить первый экран приложения на центрированный чат с Three.js-частицами и inline-чипами, с Framer Motion spring-анимацией перехода поля ввода вниз после первого сообщения.

**Architecture:** Два визуальных состояния (`isCentered = messages.length === 0`): (1) полноэкранный центрированный режим с Three.js-частицами, логотипом, большим textarea и чипами-подсказками; (2) стандартный чат с сайдбаром. Framer Motion `layoutId` анимирует перемещение поля ввода между двумя состояниями. `AnimatePresence` управляет появлением/исчезновением чипов и сайдбара.

**Tech Stack:** `framer-motion` v11+, `three` (динамический импорт через `useEffect`), React, Next.js App Router, Tailwind CSS v4.

---

## Chunk 1: Зависимости и компонент частиц

### Task 1: Установить зависимости

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Установить framer-motion и three**

```bash
cd C:/Users/yaros/DEV/timeweb-api-chat
npm install framer-motion three
npm install --save-dev @types/three
```

- [ ] **Step 2: Проверить установку**

```bash
node -e "require('framer-motion'); require('three'); console.log('OK')"
```

Ожидаемый вывод: `OK`

- [ ] **Step 3: Убедиться что сборка не сломалась**

```bash
npm run build 2>&1 | tail -5
```

Ожидаемый вывод: `✓ Compiled successfully` или без ошибок TypeScript.

---

### Task 2: Создать `components/particles-bg.tsx`

Три.js canvas с плавающими частицами. Компонент монтируется поверх фона в centered-состоянии. При `active=false` — плавно гаснет.

**Files:**
- Create: `components/particles-bg.tsx`

- [ ] **Step 1: Создать файл**

```tsx
"use client";

import { useEffect, useRef } from "react";

interface ParticlesBgProps {
  active: boolean;
}

export function ParticlesBg({ active }: ParticlesBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: import("three").WebGLRenderer;
    let scene: import("three").Scene;
    let camera: import("three").PerspectiveCamera;
    let points: import("three").Points;
    let mounted = true;

    import("three").then((THREE) => {
      if (!mounted) return;

      // Renderer
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);

      // Scene + Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      camera.position.z = 50;

      // Particles geometry
      const count = 120;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      // Speeds per particle
      const speeds = Array.from({ length: count }, () => 0.002 + Math.random() * 0.004);
      const offsets = Array.from({ length: count }, () => Math.random() * Math.PI * 2);

      const material = new THREE.PointsMaterial({
        color: 0x10a37f,
        size: 0.5,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      // Resize
      const onResize = () => {
        if (!renderer || !canvas) return;
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      // Animate
      let frame = 0;
      const tick = () => {
        if (!mounted) return;
        frame++;
        const pos = geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
          pos.array[i * 3 + 1] += Math.sin(frame * speeds[i] + offsets[i]) * 0.012;
          pos.array[i * 3] += Math.cos(frame * speeds[i] * 0.7 + offsets[i]) * 0.006;
        }
        pos.needsUpdate = true;
        points.rotation.y += 0.0003;
        renderer.render(scene, camera);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      return () => {
        window.removeEventListener("resize", onResize);
      };
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
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
```

- [ ] **Step 2: Проверить что сборка проходит**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓)" | head -10
```

Ожидаемый вывод: нет ошибок TypeScript.

- [ ] **Step 3: Коммит**

```bash
git add components/particles-bg.tsx
git commit -m "feat: добавление компонента частиц Three.js для фона"
```

---

## Chunk 2: Чипы и обновление ChatInput

### Task 3: Создать `components/suggestion-chips.tsx`

Кликабельные чипы-подсказки без смайликов. При клике вставляют текст в поле. Рендерятся через `AnimatePresence`.

**Files:**
- Create: `components/suggestion-chips.tsx`

- [ ] **Step 1: Создать файл**

```tsx
"use client";

import { motion } from "framer-motion";

const CHIPS = [
  "Мои серверы",
  "Создать сервер",
  "Баланс",
  "SSH-ключи",
  "Бэкапы",
  "Маркетплейс",
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap gap-2 justify-center max-w-md"
    >
      {CHIPS.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="px-3 py-1.5 rounded-full text-sm text-[#8e8ea0] bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#10a37f44] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
        >
          {text}
        </button>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 2: Коммит**

```bash
git add components/suggestion-chips.tsx
git commit -m "feat: добавление компонента чипов-подсказок"
```

---

### Task 4: Обновить `components/chat-input.tsx`

Добавить prop `isCentered` для увеличения поля в centered-режиме.

**Files:**
- Modify: `components/chat-input.tsx`

- [ ] **Step 1: Добавить `isCentered` prop в интерфейс**

Найти строку:
```tsx
interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  hasMessages?: boolean;
  onClear?: () => void;
}
```

Заменить на:
```tsx
interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  hasMessages?: boolean;
  onClear?: () => void;
  isCentered?: boolean;
}
```

- [ ] **Step 2: Добавить `isCentered` в деструктуризацию**

Найти:
```tsx
export function ChatInput({ input, isLoading, onInputChange, onSubmit, hasMessages, onClear }: ChatInputProps) {
```

Заменить на:
```tsx
export function ChatInput({ input, isLoading, onInputChange, onSubmit, hasMessages, onClear, isCentered }: ChatInputProps) {
```

- [ ] **Step 3: Обновить `useEffect` для высоты textarea**

Найти:
```tsx
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const newHeight = Math.min(el.scrollHeight, 200);
      el.style.height = `${newHeight}px`;
      el.style.overflowY = newHeight >= 200 ? "auto" : "hidden";
    }
  }, [input]);
```

Заменить на:
```tsx
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const maxHeight = isCentered ? 300 : 200;
      const newHeight = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${newHeight}px`;
      el.style.overflowY = newHeight >= maxHeight ? "auto" : "hidden";
    }
  }, [input, isCentered]);
```

- [ ] **Step 4: Добавить `minHeight` на textarea**

Найти:
```tsx
      className="w-full max-h-[200px] bg-transparent text-[#ececec] placeholder-[#8e8ea0] resize-none focus:outline-none p-2 no-scrollbar"
      rows={1}
```

Заменить на:
```tsx
      className="w-full bg-transparent text-[#ececec] placeholder-[#8e8ea0] resize-none focus:outline-none p-2 no-scrollbar"
      style={{ minHeight: isCentered ? "80px" : undefined, maxHeight: isCentered ? "300px" : "200px" }}
      rows={1}
```

- [ ] **Step 5: Проверить сборку**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓)" | head -10
```

- [ ] **Step 6: Коммит**

```bash
git add components/chat-input.tsx
git commit -m "feat: поддержка увеличенного textarea в centered-режиме"
```

---

## Chunk 3: Рефакторинг chat.tsx

### Task 5: Переработать `components/chat.tsx`

Добавить два состояния (centered / chat), Framer Motion `layoutId` для поля ввода, `AnimatePresence` для чипов и сайдбара.

**Files:**
- Modify: `components/chat.tsx`

- [ ] **Step 1: Добавить импорты Framer Motion и новых компонентов**

Найти строку:
```tsx
import { Sidebar } from "./sidebar";
```

Заменить на:
```tsx
import { Sidebar } from "./sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { ParticlesBg } from "./particles-bg";
import { SuggestionChips } from "./suggestion-chips";
```

- [ ] **Step 2: Заменить весь JSX в `return` на новую структуру**

Два отдельных действия:
1. **Перед `return (`** — вставить строку: `const isCentered = !hasMessages;`
2. **`return (...)` блок** — заменить полностью на JSX ниже.

Найти весь блок от `return (` до последней закрывающей скобки функции.

Заменить на следующий JSX (вставить полностью):

```tsx
  const isCentered = !hasMessages;

  return (
    <div className="flex bg-[#212121]" style={{ height: "100dvh" }}>

      {/* Сайдбар — десктоп: появляется только когда есть сообщения */}
      <AnimatePresence>
        {!isCentered && (
          <motion.div
            key="sidebar-desktop"
            className="hidden lg:block flex-shrink-0"
            initial={{ x: -256, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -256, opacity: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
          >
            <Sidebar
              onAction={handleQuickAction}
              onChangeToken={onChangeToken}
              onOpenServers={() => { fetchServers(); setShowServersPanel(true); }}
              onOpenBalance={() => { fetchBalance(); setShowBalancePanel(true); }}
              onOpenPresets={() => { fetchPresets(); setShowPresetsPanel(true); }}
              onOpenToolLog={() => setShowToolLog(true)}
              toolStats={toolStats}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Мобильный оверлей сайдбара */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="flex-shrink-0">
            <Sidebar
              onAction={handleQuickAction}
              onChangeToken={onChangeToken}
              onClose={() => setSidebarOpen(false)}
              onOpenServers={() => { fetchServers(); setShowServersPanel(true); setSidebarOpen(false); }}
              onOpenBalance={() => { fetchBalance(); setShowBalancePanel(true); setSidebarOpen(false); }}
              onOpenPresets={() => { fetchPresets(); setShowPresetsPanel(true); setSidebarOpen(false); }}
              onOpenToolLog={() => { setShowToolLog(true); setSidebarOpen(false); }}
              toolStats={toolStats}
            />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Основной контент */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Частицы Three.js — только в centered-режиме */}
        <ParticlesBg active={isCentered} />

        {/* Header — только когда есть сообщения */}
        <AnimatePresence>
          {!isCentered && (
            <motion.header
              key="header"
              className="flex items-center justify-between px-4 h-12 border-b border-[#2a2a2a] flex-shrink-0 lg:hidden"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
                  title="Меню"
                >
                  <Menu size={18} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { fetchServers(); setShowServersPanel(true); }}
                  className="flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Server size={14} />
                  <span className="hidden sm:inline">Серверы</span>
                </button>
                <button
                  onClick={() => { fetchBalance(); setShowBalancePanel(true); }}
                  className="flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <CreditCard size={14} />
                  <span className="hidden sm:inline">Баланс</span>
                </button>
                <button
                  onClick={() => { fetchPresets(); setShowPresetsPanel(true); }}
                  className="flex items-center gap-1.5 text-sm text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">Тарифы</span>
                </button>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Область сообщений — только когда есть сообщения */}
        <AnimatePresence>
          {!isCentered && (
            <motion.div
              key="messages"
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="max-w-2xl mx-auto px-4 py-6">
                {messages.map((m, i) => {
                  const userText = m.parts?.find((p) => isTextUIPart(p))?.text ?? "";
                  const isLastAssistantMessage = m.role === "assistant" && i === lastAssistantIndex;
                  return (
                    <Message
                      key={m.id}
                      message={m}
                      onRetry={
                        m.role === "user" && !isLoading
                          ? () => handleRetry(i, userText)
                          : undefined
                      }
                      onSendMessage={!isLoading ? handleQuickAction : undefined}
                      timewebToken={timewebToken}
                      showSuggestions={isLastAssistantMessage}
                    />
                  );
                })}
                {isLoading && !errorMsg && (
                  <div className="flex items-center gap-1.5 text-[#8e8ea0] py-4 pl-1">
                    <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.3s]" />
                    <div className="w-1.5 h-1.5 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.5s]" />
                  </div>
                )}
                {(errorMsg || retryAfter > 0) && (
                  <div className="flex items-center justify-between gap-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 my-2 text-sm text-red-300">
                    <span>
                      {retryAfter > 0
                        ? `Запросы временно ограничены. Следующий запрос через ${retryAfter} сек.`
                        : errorMsg}
                    </span>
                    <button
                      onClick={() => { setErrorMsg(null); setRetryAfter(0); }}
                      className="text-red-400 hover:text-red-200 transition-colors flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Centered-состояние: логотип + подсказки */}
        <AnimatePresence>
          {isCentered && (
            <motion.div
              key="centered-hero"
              className="flex-1 flex flex-col items-center justify-center px-4 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Кнопка меню на мобильном */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden absolute top-4 left-4 p-2 rounded-lg text-[#8e8ea0] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
                title="Меню"
              >
                <Menu size={18} />
              </button>

              <motion.h1
                className="text-2xl font-bold text-[#ececec] mb-2 text-center"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                evolvin.cloud
              </motion.h1>
              <motion.p
                className="text-[#8e8ea0] text-sm mb-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                Управляй своими серверами на Timeweb естественным языком
              </motion.p>

              {/* Поле ввода — centered */}
              <motion.div
                layoutId="chat-input-area"
                className="w-full max-w-xl z-10"
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
              >
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onInputChange={handleInputChange}
                  onSubmit={onSubmit}
                  hasMessages={false}
                  isCentered={true}
                />
              </motion.div>

              {/* Чипы */}
              <div className="mt-4">
                <AnimatePresence>
                  {isCentered && (
                    <SuggestionChips onSelect={(text) => setInput(text)} />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Нижняя панель — только когда есть сообщения */}
        <AnimatePresence>
          {!isCentered && (
            <motion.div
              key="bottom-panel"
              className="flex-shrink-0 bg-[#212121] border-t border-[#2a2a2a] px-4 pt-3 relative z-10"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                layoutId="chat-input-area"
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
              >
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onInputChange={handleInputChange}
                  onSubmit={onSubmit}
                  hasMessages={hasMessages}
                  onClear={() => setMessages([])}
                  isCentered={false}
                />
              </motion.div>
              {/* Свечение «парения» */}
              <div
                className="pointer-events-none absolute left-0 right-0 -top-6 h-8"
                style={{ background: "linear-gradient(to top, rgba(16,163,127,0.06), transparent)" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Уведомления */}
        <ServerNotificationToast toasts={toasts} onDismiss={dismissToast} />

        {/* Журнал вызовов инструментов */}
        <ToolCallLogModal
          messages={messages}
          isOpen={showToolLog}
          onClose={() => setShowToolLog(false)}
        />

        {/* Панель серверов */}
        <QuickViewPanel
          title="Мои серверы"
          isOpen={showServersPanel}
          onClose={() => setShowServersPanel(false)}
          onRefresh={() => fetchServers(true)}
          isLoading={serversLoading}
          error={serversError}
        >
          {cachedServers && cachedServers.length === 0 && (
            <p className="text-[#8e8ea0] text-sm text-center py-8">Серверов нет</p>
          )}
          {cachedServers?.map((s) => (
            <ServerCard
              key={s.id}
              server={s}
              onAction={(text) => { handleQuickAction(text); setShowServersPanel(false); }}
              timewebToken={timewebToken}
            />
          ))}
        </QuickViewPanel>

        {/* Панель баланса */}
        <QuickViewPanel
          title="Баланс"
          isOpen={showBalancePanel}
          onClose={() => setShowBalancePanel(false)}
          onRefresh={() => fetchBalance(true)}
          isLoading={balanceLoading}
          error={balanceError}
        >
          {cachedBalance && (
            <div className="flex flex-col gap-3">
              <div className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8e8ea0]">Баланс</span>
                  <span className={`text-xl font-bold ${(cachedBalance.balance ?? 0) < 0 ? "text-red-400" : "text-[#10a37f]"}`}>
                    {(cachedBalance.balance ?? 0).toFixed(2)} {cachedBalance.currency}
                  </span>
                </div>
                {(cachedBalance.promocode_balance ?? 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#8e8ea0]">Промокод</span>
                    <span className="text-sm font-medium text-[#ececec]">
                      {cachedBalance.promocode_balance!.toFixed(2)} {cachedBalance.currency}
                    </span>
                  </div>
                )}
                <div className="h-px bg-[#3a3a3a]" />
                {cachedBalance.total != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#8e8ea0]">Итого</span>
                    <span className="text-sm font-medium text-[#ececec]">
                      {cachedBalance.total.toFixed(2)} {cachedBalance.currency}/мес
                    </span>
                  </div>
                )}
                {cachedBalance.days_left != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#8e8ea0]">Хватит на</span>
                    <span className={`text-sm font-medium ${cachedBalance.days_left < 7 ? "text-red-400" : "text-[#ececec]"}`}>
                      {cachedBalance.days_left} дн.
                    </span>
                  </div>
                )}
                {cachedBalance.is_blocked && (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-sm text-red-300">
                    Аккаунт заблокирован
                  </div>
                )}
              </div>
              <button
                onClick={() => { handleQuickAction("Какой у меня баланс?"); setShowBalancePanel(false); }}
                className="text-sm text-[#8e8ea0] hover:text-[#10a37f] transition-colors text-center py-1"
              >
                Подробнее через ИИ →
              </button>
            </div>
          )}
        </QuickViewPanel>

        {/* Панель тарифов */}
        <QuickViewPanel
          title="Тарифы"
          isOpen={showPresetsPanel}
          onClose={() => setShowPresetsPanel(false)}
          onRefresh={() => fetchPresets(true)}
          isLoading={presetsLoading}
          error={presetsError}
        >
          {cachedPresets && (
            <div className="flex flex-col gap-2">
              {cachedPresets.map((p) => (
                <div key={p.id} className="bg-[#2f2f2f] rounded-xl border border-[#3a3a3a] p-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-[#ececec]">{p.description}</span>
                    <span className="text-xs text-[#8e8ea0]">
                      {p.cpu} CPU · {p.ram_gb} ГБ RAM · {p.disk_gb} ГБ
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-[#10a37f]">{p.price_per_month} ₽/мес</span>
                    <button
                      onClick={() => { handleQuickAction(`Создай сервер с тарифом ${p.ram_gb} ГБ RAM и ${p.disk_gb} ГБ диском`); setShowPresetsPanel(false); }}
                      className="text-xs text-[#8e8ea0] hover:text-[#10a37f] transition-colors"
                    >
                      Выбрать →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </QuickViewPanel>

      </div>
    </div>
  );
```

- [ ] **Step 3: Убрать `QuickActionsGrid` из импортов (больше не используется в этой ветке)**

Найти:
```tsx
import { QuickActionsGrid } from "./quick-actions-grid";
```

Удалить эту строку.

- [ ] **Step 4: Убедиться в корректности `ref={scrollContainerRef}`**

Так как `scrollContainerRef` теперь навешен на `motion.div` внутри `AnimatePresence`, Framer Motion корректно пробрасывает ref на DOM-элемент. Проверить, что импорт `useRef` остался.

- [ ] **Step 5: Проверить TypeScript сборку**

```bash
npm run build 2>&1 | grep -E "(error TS|Error)" | head -20
```

Ожидаемый вывод: нет ошибок.

- [ ] **Step 6: Запустить dev-сервер и проверить вручную**

```bash
npm run dev
```

Открыть http://localhost:3000 и проверить:
1. ✅ Первый экран: центрированный логотип + input + чипы + частицы фоном
2. ✅ Клик по чипу вставляет текст в поле
3. ✅ Отправка сообщения: чипы исчезают, input анимированно уходит вниз, появляются сообщения и сайдбар
4. ✅ Очистка чата: возврат в centered-режим с чипами и частицами
5. ✅ Мобильный: кнопка меню видна в centered-режиме

- [ ] **Step 7: Финальный коммит**

```bash
git add components/chat.tsx
git commit -m "feat: центрированный первый экран с Three.js-частицами и Framer Motion анимацией (DEVTEAM-149)"
```

---

## Chunk 4: Финальная сборка и проверка

### Task 6: Production build + cleanup

**Files:**
- Modify: `.gitignore` (добавить `.superpowers/`)

- [ ] **Step 1: Добавить `.superpowers/` в `.gitignore`**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | tail -10
```

Ожидаемый вывод: нет ошибок ESLint.

- [ ] **Step 3: Production build**

```bash
npm run build 2>&1 | tail -15
```

Ожидаемый вывод: `✓ Compiled successfully`, без ошибок TypeScript.

- [ ] **Step 4: Финальный коммит**

```bash
git add .gitignore
git commit -m "chore: добавление .superpowers/ в .gitignore"
```

---

> **Итого файлов:** 2 новых (`particles-bg.tsx`, `suggestion-chips.tsx`) + 2 изменённых (`chat.tsx`, `chat-input.tsx`) + конфигурация (`.gitignore`, `package.json`)
