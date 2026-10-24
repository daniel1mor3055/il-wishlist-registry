export function Switch({
  label,
  checked,
  onChange,
  disabled = false,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="focus-ring flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 py-1 text-start disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="min-w-0">
        <span className="block text-copy text-graphite">{label}</span>
        {hint ? <span className="mt-0.5 block text-badge text-slate">{hint}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-pill ${
          checked ? "bg-brand-deep" : "bg-hairline-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-paper shadow-lift-xs ${
            checked ? "end-0.5" : "start-0.5"
          }`}
        />
      </span>
    </button>
  );
}
