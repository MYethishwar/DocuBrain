import { motion } from "motion/react";

import { LogoMark } from "./LogoMark";

/** Shown while the API searches the knowledge base and writes the answer. */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="flex items-start gap-3"
    >
      <div className="mt-0.5 shrink-0">
        <LogoMark size={30} />
      </div>
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-ink-700 bg-ink-850/90 px-4 py-3">
        <span className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-signal"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15, ease: "easeInOut" }}
            />
          ))}
        </span>
        <span className="text-sm text-ink-300">Searching the archives…</span>
      </div>
    </motion.div>
  );
}
