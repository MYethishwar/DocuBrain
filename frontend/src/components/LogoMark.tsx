/** DocuBrain mark: a lime tile with a "lens" — searching the archive. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-signal)" />
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="var(--color-ink-900)" strokeWidth="2.6" />
      <circle cx="16" cy="16" r="2.2" fill="var(--color-ink-900)" />
    </svg>
  );
}
