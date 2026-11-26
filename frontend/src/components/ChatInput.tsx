import { ArrowUp } from "lucide-react";
import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

const MAX_LENGTH = 1000;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !disabled;

  // Grow with the text, up to about six lines.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
    // Only show a scrollbar once the text is taller than the box.
    el.style.overflowY = el.scrollHeight > 168 ? "auto" : "hidden";
  }, [value]);

  const submit = () => {
    if (!canSend) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="relative z-10 bg-gradient-to-t from-ink-900 via-ink-900/95 to-transparent pt-6 pb-5">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex items-end gap-2 rounded-3xl border border-ink-600 bg-ink-800/90 p-2 pl-5 shadow-[0_20px_60px_-25px] shadow-black backdrop-blur-xl transition-colors focus-within:border-signal/50"
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder="Ask anything about the inventions…"
            aria-label="Your question"
            className="max-h-42 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-ink-100 placeholder:text-ink-400 focus:outline-none"
          />
          <motion.button
            type="submit"
            disabled={!canSend}
            aria-label="Send question"
            whileTap={canSend ? { scale: 0.9 } : undefined}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-signal text-ink-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-ink-600 disabled:text-ink-400"
          >
            <ArrowUp size={20} strokeWidth={2.6} />
          </motion.button>
        </form>
        <p className="mt-2 text-center text-xs text-ink-400">
          Enter to send · Shift + Enter for a new line
          {value.length > MAX_LENGTH * 0.8 && (
            <span className="ml-2 text-amber">
              {value.length}/{MAX_LENGTH}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
