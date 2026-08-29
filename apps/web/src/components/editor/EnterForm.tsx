"use client";

import { useState, useTransition } from "react";
import { requestMagicLink } from "@/app/editor/actions";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";

/**
 * The door. One field, one button, no password (D23).
 *
 * The success state says the mail was sent and stops. It cannot say "check your
 * inbox, we found your account" without turning this form into a way to ask
 * whether an address is registered here.
 */
export function EnterForm({ deadLink = false }: { deadLink?: boolean }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    deadLink ? copy.editor.enter.linkDead : null,
  );
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await requestMagicLink(email);
      if (result.ok) setSentTo(email.trim());
      else setError(result.error);
    });
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <p className="text-body font-medium text-ink">{copy.editor.enter.sent(sentTo)}</p>
        <p className="text-small text-ink-muted">{copy.editor.enter.sentHint}</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <p className="text-small text-ink-muted">{copy.editor.enter.body}</p>

      <Field label={copy.editor.enter.emailLabel}>
        <input
          type="email"
          name="email"
          autoComplete="email"
          dir="ltr"
          placeholder={copy.editor.enter.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`${inputClass} text-start`}
        />
      </Field>

      <FormError message={error} />

      <PrimaryButton type="submit" disabled={pending || email.trim().length === 0}>
        {pending ? copy.editor.enter.sending : copy.editor.enter.submit}
      </PrimaryButton>
    </form>
  );
}
