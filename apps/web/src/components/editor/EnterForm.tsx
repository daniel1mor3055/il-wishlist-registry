"use client";

import { useState, useTransition } from "react";
import { requestMagicLink } from "@/app/editor/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { copy } from "@/lib/copy";

/** Sent state confirms the mail left and does not say whether the address is registered (D23). */
export function EnterForm({ deadLink = false }: { deadLink?: boolean }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(
    deadLink ? copy.editor.enter.linkDead : null,
  );
  const [pending, startTransition] = useTransition();

  function sendLink(address: string, onOk: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await requestMagicLink(address);
      if (result.ok) onOk();
      else setError(result.error);
    });
  }

  function submit() {
    sendLink(email, () => setSentTo(email.trim()));
  }

  function resend() {
    if (!sentTo) return;
    sendLink(sentTo, () => setResent(true));
  }

  const fieldError = error === copy.editor.enter.invalidEmail ? error : null;

  return sentTo ? (
    <section className="relative overflow-hidden rounded-sheet bg-paper shadow-lift-md">
      <div aria-hidden="true" className="pastel-field relative h-20 overflow-hidden">
        <svg className="absolute -top-6 -start-8 w-32 fill-paper opacity-55">
          <use href="#sh-arch" />
        </svg>
        <svg className="absolute -bottom-10 end-6 w-24 fill-paper opacity-50">
          <use href="#sh-flower" />
        </svg>
      </div>
      <div className="px-5 pb-6 lg:px-8 lg:pb-8">
        <span
          aria-hidden="true"
          className="relative z-10 -mt-8 grid size-16 place-items-center rounded-full border-4 border-paper bg-sticker text-graphite shadow-lift-sm"
        >
          <svg
            className="size-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </span>
        <p className="mt-4 text-lead font-medium text-graphite">{sentLine(sentTo)}</p>
        {resent ? (
          <p role="status" className="mt-2 text-fine text-mint-ink">
            {copy.editor.enter.resent}
          </p>
        ) : (
          <p className="mt-2 text-fine text-slate">
            {copy.editor.enter.sentHint}{" "}
            <button
              type="button"
              className="font-medium text-brand-link underline hover:text-brand-hover focus-ring disabled:opacity-60"
              disabled={pending}
              onClick={resend}
            >
              {pending ? copy.editor.enter.sending : copy.editor.enter.resend}
            </button>
          </p>
        )}
        {error ? (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}
      </div>
    </section>
  ) : (
    <>
      {error && !fieldError ? <Alert>{error}</Alert> : null}
      <form
        noValidate
        className="rounded-sheet bg-paper shadow-lift-md"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="px-5 pb-6 pt-6 lg:px-8 lg:pt-8">
          <TextField
            label={copy.editor.enter.emailLabel}
            type="email"
            name="email"
            dir="ltr"
            autoComplete="email"
            placeholder={copy.editor.enter.emailPlaceholder}
            value={email}
            onChange={setEmail}
            error={fieldError}
          />
        </div>
        <div className="border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
          <Button type="submit" disabled={pending || email.trim().length === 0} pending={pending}>
            {pending ? copy.editor.enter.sending : copy.editor.enter.submit}
          </Button>
        </div>
      </form>
    </>
  );
}

function sentLine(email: string) {
  const text = copy.editor.enter.sent(email);
  const at = text.indexOf(email);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="ltr-token">{email}</span>
      {text.slice(at + email.length)}
    </>
  );
}
