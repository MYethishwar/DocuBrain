import { BackgroundGlow } from "./components/BackgroundGlow";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { EmptyState } from "./components/EmptyState";
import { MessageList } from "./components/MessageList";
import { useChat } from "./hooks/useChat";

export default function App() {
  const { messages, isLoading, send, reset } = useChat();
  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <BackgroundGlow />

      <ChatHeader canReset={hasMessages && !isLoading} onReset={reset} />

      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          {hasMessages ? (
            <MessageList messages={messages} isLoading={isLoading} />
          ) : (
            <EmptyState onPick={send} />
          )}
        </div>
      </main>

      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
}
