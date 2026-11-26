import { useCallback, useState } from "react";

import { ApiError, askQuestion } from "../api/docubrainApi";
import type { ChatMessage } from "../types/chat";

/** Holds the conversation and sends questions to the API. */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || isLoading) return;

      const add = (message: Omit<ChatMessage, "id">) =>
        setMessages((current) => [...current, { id: crypto.randomUUID(), ...message }]);

      add({ role: "user", text, status: "ok", sources: [] });
      setIsLoading(true);
      try {
        const result = await askQuestion(text);
        add({
          role: "assistant",
          text: result.answer,
          status: result.guardrail_action === "INTERVENED" ? "blocked" : "ok",
          sources: result.sources,
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Something unexpected went wrong.";
        add({ role: "assistant", text: message, status: "error", sources: [] });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const reset = useCallback(() => setMessages([]), []);

  return { messages, isLoading, send, reset };
}
