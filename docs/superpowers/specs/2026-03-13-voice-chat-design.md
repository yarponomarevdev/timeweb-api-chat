# Голосовое общение с LLM в чате

## Контекст

Чат-интерфейс для управления Timeweb Cloud сейчас поддерживает только текстовый ввод/вывод. Пользователи хотят возможность голосового общения: говорить запросы голосом и слушать ответы ассистента. Это особенно удобно на мобильных устройствах и при hands-free сценариях.

## Решение

Два новых API-эндпоинта (STT через OpenAI Whisper, TTS через OpenAI TTS) + клиентский хук `useVoice` + UI-элементы в ChatInput и Message. Полностью BYOK — используется OpenAI ключ пользователя.

## Архитектура

### Новые API-эндпоинты

#### `POST /api/voice/transcribe`

- **Вход:** `FormData` с полем `audio` (Blob) + заголовок `x-openai-key`
- **Логика:** Создаёт OpenAI клиент → `openai.audio.transcriptions.create({ model: "whisper-1", file: audio })` (без `language` — Whisper автодетектит, чтобы поддержать и русский, и английские термины)
- **Выход:** `{ text: string }`
- **Rate limiting:** Отдельный пул `stt:${ip}` через `lib/rate-limit.ts` — 20 req/min
- **Ошибки:** 401 если нет ключа, 400 если нет аудио, 429 при rate limit

#### `POST /api/voice/synthesize`

- **Вход:** JSON `{ text: string, voice?: string }` + заголовок `x-openai-key`
- **Голоса:** `alloy` (по умолчанию), `echo`, `nova`, `shimmer`, `onyx`, `fable`
- **Логика:** `openai.audio.speech.create({ model: "tts-1", input: text, voice, response_format: "mp3" })`
- **Выход:** Аудио-стрим с `Content-Type: audio/mpeg`
- **Rate limiting:** Отдельный пул `tts:${ip}` — 20 req/min
- **Ограничение:** Максимум 4096 символов на запрос (лимит OpenAI TTS)

### Клиентский хук `useVoice`

**Файл:** `hooks/use-voice.ts`

**Сигнатура:** `useVoice(openaiKey: string): UseVoiceReturn`

**Состояния:**
```
type VoiceState = "idle" | "recording" | "transcribing" | "speaking"
```

**API:**
```typescript
interface UseVoiceReturn {
  state: VoiceState
  startRecording: () => Promise<void>  // запрос микрофона + MediaRecorder.start()
  stopRecording: () => Promise<string> // stop + отправка на transcribe → текст
  speak: (text: string) => Promise<void> // отправка на synthesize → воспроизведение
  stopSpeaking: () => void             // остановка Audio
  lastInputWasVoice: boolean           // флаг для автоозвучки
  setLastInputWasVoice: (v: boolean) => void
  isSupported: boolean                 // MediaRecorder + getUserMedia доступны
}
```

**Внутренняя реализация:**
- Определение mimeType: `MediaRecorder.isTypeSupported("audio/webm;codecs=opus")` → `audio/webm;codecs=opus`, иначе `audio/mp4` (Safari fallback)
- Аудиоданные собираются в массив chunks → Blob при остановке
- Максимальная длительность записи: **120 секунд** — автостоп при превышении
- `speak()`: fetch → blob → `URL.createObjectURL()` → `new Audio(url).play()` → `URL.revokeObjectURL()` в обработчике `ended`/`error`
- **Правило одного источника:** начало новой записи или воспроизведения останавливает текущее воспроизведение; начало записи останавливает playback
- Cleanup при размонтировании: остановка MediaRecorder, Audio, revoke всех object URLs

### Функция `extractTextForTTS`

**Файл:** `hooks/use-voice.ts` (вспомогательная функция)

Извлекает чистый текст из сообщения ассистента для озвучки:
- Убирает markdown-заголовки (`#`, `##`, ...) — оставляет текст
- Убирает markdown-форматирование (`**`, `*`, `` ` ``, `[text](url)` → `text`)
- Полностью удаляет блоки кода (``` ... ```)
- Удаляет tool invocation результаты и JSON
- Сохраняет содержимое списков (убирая маркеры `-`, `*`, `1.`)
- Результат обрезается до 4096 символов

## UI / UX

### Кнопка микрофона (ChatInput)

**Расположение:** справа от textarea, слева от кнопки отправки

**Состояния:**
- **idle:** иконка `Mic` (lucide), серый фон `#3a3a3a`, hover → `#10a37f`
- **recording:** иконка `Mic`, красный фон с CSS-анимацией пульсации (`animate-pulse`), textarea показывает placeholder "Говорите...", отображается таймер записи (секунды)
- **transcribing:** иконка `Loader2` с `animate-spin`, кнопка disabled

**Доступность:** `aria-label="Записать голосовое сообщение"`, `aria-pressed` при recording

**Условие отображения:** кнопка рендерится только если `isSupported === true`

### Процесс записи (push-to-talk)

1. Нажатие → `startRecording()` → запрос `getUserMedia({ audio: true })`
2. Запись идёт, кнопка пульсирует красным, таймер отсчитывает секунды
3. Повторное нажатие (или автостоп после 120с) → `stopRecording()` → Blob отправляется на `/api/voice/transcribe`
4. Текст появляется в textarea — пользователь может отредактировать
5. Пользователь нажимает Send или Enter для отправки
6. Устанавливается `lastInputWasVoice = true`

### Кнопка "прослушать" (Message)

- Иконка `Volume2` — появляется у каждого сообщения ассистента (рядом с текстом)
- `aria-label="Прослушать сообщение"`
- При нажатии → `speak(extractTextForTTS(message))`
- Во время воспроизведения → иконка `Square` (стоп), повторное нажатие останавливает
- Начало нового воспроизведения автоматически останавливает предыдущее

### Автоозвучка

- Срабатывает когда: `lastInputWasVoice === true` И `status` перешёл в `"idle"` (стриминг завершён)
- Озвучивается только текстовая часть последнего сообщения ассистента (через `extractTextForTTS`)
- Tool invocations, JSON, код — пропускаются
- Если текст > 4096 символов — озвучиваются первые 4096
- `lastInputWasVoice` сбрасывается после озвучки
- Пользователь может остановить воспроизведение

### Обработка ошибок

| Ситуация | Поведение |
|----------|-----------|
| Нет доступа к микрофону | Toast: "Разрешите доступ к микрофону в настройках браузера" |
| Ошибка транскрибации | Toast с текстом ошибки, состояние → idle |
| Ошибка TTS | Тихий лог в console, текст остаётся читаемым |
| Нет OpenAI ключа | Toast: "Для голосовых функций нужен OpenAI API ключ" |
| Браузер без MediaRecorder | Кнопка микрофона не отображается (`isSupported`) |
| Сетевая ошибка при voice fetch | Toast: "Ошибка сети. Проверьте подключение" |

## Интеграция в chat.tsx

```typescript
// В Chat компоненте:
const voice = useVoice(openaiKey)

// Передать в ChatInput:
<ChatInput
  voiceState={voice.state}
  onStartRecording={voice.startRecording}
  onStopRecording={async () => {
    const text = await voice.stopRecording()
    if (text) setInput(text)
  }}
  isVoiceSupported={voice.isSupported}
  ...
/>

// Передать speak в Message:
<Message speak={voice.speak} stopSpeaking={voice.stopSpeaking} voiceState={voice.state} ... />

// Автоозвучка через useEffect:
useEffect(() => {
  if (status === "idle" && voice.lastInputWasVoice && messages.length > 0) {
    const last = messages[messages.length - 1]
    if (last.role === "assistant") {
      const text = extractTextForTTS(last)
      if (text) voice.speak(text)
      voice.setLastInputWasVoice(false)
    }
  }
}, [status])
```

## Файловая структура

### Новые файлы
- `app/api/voice/transcribe/route.ts` — STT эндпоинт
- `app/api/voice/synthesize/route.ts` — TTS эндпоинт
- `hooks/use-voice.ts` — клиентский хук + `extractTextForTTS`

### Модифицируемые файлы
- `components/chat-input.tsx` — кнопка микрофона, состояния записи, таймер
- `components/chat.tsx` — интеграция useVoice, автоозвучка, передача props
- `components/message.tsx` — кнопка "прослушать"

## Поток данных

```
Голосовой ввод:
  Mic button → MediaRecorder → Blob (WebM/MP4)
    → POST /api/voice/transcribe (x-openai-key)
    → OpenAI Whisper → { text }
    → textarea → (редактирование) → sendMessage()
    → lastInputWasVoice = true

Автоозвучка:
  status: "streaming" → "idle" + lastInputWasVoice
    → extractTextForTTS(lastAssistantMessage)
    → POST /api/voice/synthesize (x-openai-key)
    → OpenAI TTS → audio/mpeg → Audio.play()
    → lastInputWasVoice = false

Ручная озвучка:
  Кнопка Volume2 у сообщения
    → extractTextForTTS(message)
    → POST /api/voice/synthesize → Audio.play()
```

## Верификация

1. `npm run build` — проверить что TypeScript компилируется
2. Открыть чат → нажать кнопку микрофона → разрешить доступ → произнести фразу → остановить → проверить что текст появился в textarea
3. Отправить голосовое сообщение → дождаться ответа → проверить что ответ автоматически озвучивается
4. Нажать кнопку "прослушать" у любого сообщения ассистента → проверить воспроизведение
5. Проверить на мобильном устройстве (Safari — mp4 fallback)
6. Проверить обработку ошибок: отклонить доступ к микрофону, отправить без OpenAI ключа
7. Проверить автостоп записи после 120 секунд
8. Проверить что начало новой озвучки останавливает предыдущую
