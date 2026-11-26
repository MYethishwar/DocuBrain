import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

const SUGGESTIONS = [
  { label: "The Zero Hour", question: "When did the Zero Hour start, and how long did it last?" },
  { label: "MindReader", question: "How does the MindReader work and what are its limits?" },
  { label: "Wherever Door", question: "How do I enter a destination in the Wherever Door?" },
  { label: "Return Key", question: "What happens if the Return Key is lost?" },
];

export function EmptyState({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex min-h-full flex-col justify-center py-14">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-3 text-sm font-semibold tracking-[0.18em] text-signal uppercase"
      >
        Knowledge base · Guarded
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl"
      >
        What would you like to know about the{" "}
        <span className="bg-gradient-to-r from-signal to-iris bg-clip-text text-transparent">inventions</span>?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-4 max-w-xl text-base leading-relaxed text-ink-300"
      >
        Answers come only from the archive, and every question and answer passes through the guardrail.
      </motion.p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((item, index) => (
          <motion.button
            key={item.label}
            type="button"
            onClick={() => onPick(item.question)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 + index * 0.07 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group rounded-2xl border border-ink-700 bg-ink-850/80 p-4 text-left backdrop-blur transition-colors hover:border-signal/40 hover:bg-ink-800"
          >
            <span className="flex items-center justify-between text-xs font-semibold tracking-wide text-ink-400 uppercase">
              {item.label}
              <ArrowUpRight
                size={16}
                className="text-ink-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal"
              />
            </span>
            <span className="mt-2 block text-[15px] leading-snug text-ink-100">{item.question}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
