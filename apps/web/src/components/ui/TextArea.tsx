import { useId } from "react";

export function TextArea({
  label,
  value,
  placeholder,
  rows = 3,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  hint?: React.ReactNode;
  onChange: (value: string) => void;
}) {
  const hintId = useId();

  return (
    <label className="block text-start">
      <span className="block text-fine font-medium text-slate">{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-1.5 w-full resize-none rounded-tile bg-cloud px-4 py-3 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper"
      />
      {hint ? (
        <span id={hintId} className="mt-1.5 block text-fine text-slate">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
