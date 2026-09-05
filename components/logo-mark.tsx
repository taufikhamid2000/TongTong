export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="15" fill="#0f766e" />
      <path
        d="M9 10h14v3h-5.5v9h-3v-9H9v-3Z"
        fill="#f1f5f4"
      />
    </svg>
  );
}
