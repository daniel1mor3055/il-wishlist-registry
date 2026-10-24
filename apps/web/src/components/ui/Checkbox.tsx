export function Checkbox({
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
    <label
      className={`flex min-h-11 items-start gap-3 py-1 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] border-2 border-hairline-strong bg-paper text-transparent peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-paper peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-deep"
      >
        <svg
          className="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </span>
      <span>
        <span className="block text-copy text-graphite">{label}</span>
        {hint ? <span className="mt-0.5 block text-badge text-slate">{hint}</span> : null}
      </span>
    </label>
  );
}
