"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Server } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ChatInput } from "./chat-input";
import { Message } from "./message";

export function Chat() {
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const [input, setInput] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleQuickAction = (text: string) => {
    sendMessage({ text });
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen w-full bg-[#212121] overflow-hidden">
      <Sidebar onNewChat={handleNewChat} onQuickAction={handleQuickAction} />
      
      <div className="flex flex-col flex-1 h-full relative">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-[#2f2f2f] rounded-2xl flex items-center justify-center mb-6">
                <Server size={32} className="text-[#10a37f]" />
              </div>
              <h1 className="text-3xl font-bold text-[#ececec] mb-2">Timeweb Manager</h1>
              <p className="text-[#8e8ea0] mb-8">Управляй серверами через естественный язык</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  "Покажи все мои серверы",
                  "Какой у меня баланс?",
                  "Какие есть тарифы?",
                  "Создай сервер Ubuntu 2GB"
                ].map((hint, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(hint)}
                    className="bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-[#3a3a3a] rounded-xl p-4 text-left transition-colors text-sm text-[#ececec]"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col pb-24">
              {messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-[#8e8ea0] text-sm">
                  <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.3s]" />
                  <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce [animation-delay:-.5s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10 pb-6 px-4">
          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={onSubmit}
          />
          <div className="text-center text-xs text-[#8e8ea0] mt-3">
            AI может допускать ошибки. Проверяйте важную информацию.
          </div>
        </div>
      </div>
    </div>
  );
}
