export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 4v16" />
        <path d="M7 4h6a4 4 0 0 1 0 8H7" />
        <path d="M7 12h7a4 4 0 0 1 0 8H7" />
      </svg>
    </span>
  );
}
