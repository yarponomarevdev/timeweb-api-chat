"use client";

import { useState } from "react";
import { Chat } from "@/components/chat";
import { ApiKeySetup } from "@/components/api-key-setup";

const STORAGE_KEY = "timeweb_api_key";

export default function HomeClient() {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ""
  );

  const handleSave = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  };

  const handleChangeToken = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey("");
  };

  if (!apiKey) {
    return <ApiKeySetup onSave={handleSave} />;
  }

  return (
    <Chat
      key={apiKey}
      timewebToken={apiKey}
      onChangeToken={handleChangeToken}
    />
  );
}
