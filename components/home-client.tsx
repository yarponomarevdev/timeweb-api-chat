"use client";

import { useState } from "react";
import { Chat } from "@/components/chat";
import { ApiKeySetup } from "@/components/api-key-setup";

const TIMEWEB_KEY = "timeweb_api_key";
const OPENAI_KEY = "openai_api_key";

export default function HomeClient() {
  const [timewebToken, setTimewebToken] = useState<string>(
    () => localStorage.getItem(TIMEWEB_KEY) ?? ""
  );
  const [openaiKey, setOpenaiKey] = useState<string>(
    () => localStorage.getItem(OPENAI_KEY) ?? ""
  );
  const [showKeySetup, setShowKeySetup] = useState(false);

  const handleSave = (tw: string, oai: string) => {
    localStorage.setItem(TIMEWEB_KEY, tw);
    localStorage.setItem(OPENAI_KEY, oai);
    setTimewebToken(tw);
    setOpenaiKey(oai);
    setShowKeySetup(false);
  };

  if (!timewebToken || !openaiKey) {
    return (
      <ApiKeySetup
        initialTimewebKey={timewebToken}
        initialOpenaiKey={openaiKey}
        onSave={handleSave}
      />
    );
  }

  if (showKeySetup) {
    return (
      <ApiKeySetup
        initialTimewebKey={timewebToken}
        initialOpenaiKey={openaiKey}
        onSave={handleSave}
        onCancel={() => setShowKeySetup(false)}
      />
    );
  }

  return (
    <Chat
      key={timewebToken}
      timewebToken={timewebToken}
      openaiKey={openaiKey}
      onChangeToken={() => setShowKeySetup(true)}
    />
  );
}
