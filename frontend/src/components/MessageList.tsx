import { AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";

import type { ChatMessage } from "../types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isLoading]);

  return (
    <div className="flex flex-col gap-6 py-8" aria-live="polite">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <AnimatePresence>{isLoading && <TypingIndicator key="typing" />}</AnimatePresence>
      <div ref={endRef} className="h-2" />
    </div>
  );
}
