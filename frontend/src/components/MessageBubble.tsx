import { Check, Copy, FileText, ShieldAlert, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import Markdown from "react-markdown";

import type { ChatMessage } from "../types/chat";
import { LogoMark } from "./LogoMark";

const enter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 320, damping: 28 },
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <motion.div {...enter} className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-signal px-4 py-2.5 text-[15px] leading-relaxed font-medium whitespace-pre-wrap text-ink-950 shadow-[0_8px_30px_-12px] shadow-signal/40">
          {message.text}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...enter} className="group flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        <LogoMark size={30} />
      </div>
      <div className="min-w-0 flex-1">
        {message.status === "blocked" && (
          <StatusLabel tone="coral" icon={<ShieldAlert size={14} strokeWidth={2.2} />} text="Blocked by guardrail" />
        )}
        {message.status === "error" && (
          <StatusLabel tone="amber" icon={<TriangleAlert size={14} strokeWidth={2.2} />} text="Request failed" />
        )}

        <div
          className={[
            "rounded-2xl rounded-tl-md border px-4 py-3 text-[15px] leading-relaxed",
            message.status === "blocked" && "border-coral/40 bg-coral/8 text-ink-100",
            message.status === "error" && "border-amber/40 bg-amber/8 text-ink-100",
            message.status === "ok" && "border-ink-700 bg-ink-850/90 text-ink-100 backdrop-blur",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Markdown components={markdownComponents}>{message.text}</Markdown>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {message.sources.length > 0 && (
            <span className="text-[11px] font-semibold tracking-[0.14em] text-ink-400 uppercase">Sources</span>
          )}
          {message.sources.map((uri) => (
            <span
              key={uri}
              title={uri}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-ink-700 bg-ink-850 px-2.5 py-1 text-xs text-ink-300"
            >
              <FileText size={12} className="shrink-0 text-signal" />
              <span className="truncate">{fileName(uri)}</span>
            </span>
          ))}
          {message.status === "ok" && <CopyButton text={message.text} />}
        </div>
      </div>
    </motion.div>
  );
}

function StatusLabel({ tone, icon, text }: { tone: "coral" | "amber"; icon: React.ReactNode; text: string }) {
  const color = tone === "coral" ? "text-coral" : "text-amber";
  return (
    <span className={`mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase ${color}`}>
      {icon}
      {text}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy answer"
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink-100 focus-visible:opacity-100"
    >
      {copied ? <Check size={13} className="text-signal" /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function fileName(uri: string): string {
  const last = uri.split("/").pop() || uri;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

const markdownComponents = {
  p: (props: React.ComponentProps<"p">) => <p className="mb-3 last:mb-0" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
  ol: (props: React.ComponentProps<"ol">) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => <strong className="font-semibold text-white" {...props} />,
  code: (props: React.ComponentProps<"code">) => (
    <code className="rounded bg-ink-700 px-1.5 py-0.5 font-mono text-[13px] text-signal" {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a className="text-signal underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
  ),
};
