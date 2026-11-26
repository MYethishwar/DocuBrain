import { RotateCcw, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { LogoMark } from "./LogoMark";

interface ChatHeaderProps {
  canReset: boolean;
  onReset: () => void;
}

export function ChatHeader({ canReset, onReset }: ChatHeaderProps) {
  return (
    <header className="relative z-10 border-b border-ink-700/70 bg-ink-900/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
        <LogoMark size={34} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg leading-tight font-bold tracking-tight">DocuBrain</h1>
          <p className="truncate text-xs text-ink-300">Ask the Yethishwar Archives</p>
        </div>

        <span className="hidden items-center gap-1.5 rounded-full border border-signal/25 bg-signal/8 px-3 py-1 text-xs font-medium text-signal sm:inline-flex">
          <ShieldCheck size={14} strokeWidth={2.2} />
          Guardrail on
        </span>

        <AnimatePresence>
          {canReset && (
            <motion.button
              type="button"
              onClick={onReset}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.94 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-100 transition-colors hover:border-ink-400 hover:bg-ink-800"
            >
              <RotateCcw size={13} strokeWidth={2.2} />
              New chat
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
