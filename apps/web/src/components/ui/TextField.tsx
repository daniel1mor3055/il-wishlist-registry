import { useId } from "react";

export function TextField({
  label,
  type = "text",
  name,
  value,
  placeholder,
  autoComplete,
  dir,
  error,
  hint,
  autoFocus,
  inputMode,
  onChange,
}: {
  label: string;
  type?: "text" | "email" | "tel" | "date";
  name?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  dir?: "ltr" | "rtl";
  error?: string | null;
  hint?: React.ReactNode;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
}) {
  const errorId = useId();
  const hintId = useId();
  const ltr = dir === "ltr";
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <label className="block text-start">
        <span className="block text-fine font-medium text-slate">{label}</span>
        <input
          type={type}
          name={name}
          dir={dir}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className={
            error
              ? `${ltr ? "ltr-token " : ""}focus-ring mt-1.5 h-14 w-full rounded-tile border-2 border-alert bg-alert-wash px-4 text-copy text-graphite outline-none focus:bg-paper`
              : `${ltr ? "ltr-token " : ""}focus-ring mt-1.5 h-14 w-full rounded-tile bg-cloud px-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper`
          }
        />
      </label>
      {hint ? (
        <p id={hintId} className="mt-2 flex items-center gap-2 text-fine text-slate">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-fine font-medium text-alert-ink"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}
