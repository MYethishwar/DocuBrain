import { motion, useReducedMotion } from "motion/react";

/** Two slow-drifting colour glows over a faint dot grid. Purely decorative. */
export function BackgroundGlow() {
  const reduceMotion = useReducedMotion();
  const drift = (x: number, y: number, duration: number) =>
    reduceMotion
      ? {}
      : {
          animate: { x: [0, x, 0], y: [0, y, 0] },
          transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(var(--color-ink-300)_1px,transparent_1px)] [background-size:24px_24px]" />
      <motion.div
        className="absolute -top-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-signal/12 blur-[130px]"
        {...drift(90, 50, 20)}
      />
      <motion.div
        className="absolute -right-32 -bottom-56 h-[34rem] w-[34rem] rounded-full bg-iris/18 blur-[150px]"
        {...drift(-70, -60, 24)}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--color-ink-900)_80%)]" />
    </div>
  );
}
