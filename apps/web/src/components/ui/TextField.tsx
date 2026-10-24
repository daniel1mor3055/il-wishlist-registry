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
  onChange,
}: {
  label: string;
  type?: "text" | "email" | "tel";
  name?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  dir?: "ltr" | "rtl";
  error?: string | null;
  onChange: (value: string) => void;
}) {
  const errorId = useId();
  const ltr = dir === "ltr";

  return (
    <>
      <label className="block text-start">
        <span className="block text-fine font-medium text-slate">{label}</span>
        <input
          type={type}
          name={name}
          dir={dir}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={
            error
              ? `${ltr ? "ltr-token " : ""}focus-ring mt-1.5 h-14 w-full rounded-tile border-2 border-alert bg-alert-wash px-4 text-copy text-graphite outline-none focus:bg-paper`
              : `${ltr ? "ltr-token " : ""}focus-ring mt-1.5 h-14 w-full rounded-tile bg-cloud px-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper`
          }
        />
      </label>
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
