"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { patchRegistry } from "@/app/editor/actions";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { GenderChips } from "@/components/editor/GenderChips";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";
import { coverSrc } from "@/lib/cover";
import { themeFromGender, type BabyGender } from "@/lib/theme";

/**
 * Cover is a URL paste for the POC. Empty string keeps the default teddy.
 * List colour is live on this form so they see the palette before save.
 */
export function StoryForm({
  story,
  coverImageUrl,
  babyGender,
}: {
  story: string;
  coverImageUrl: string | null;
  babyGender: BabyGender;
}) {
  const [storyText, setStory] = useState(story);
  const [cover, setCover] = useState(coverImageUrl ?? "");
  const [gender, setGender] = useState<BabyGender>(babyGender);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const preview = coverSrc(cover);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await patchRegistry({
        story: storyText.trim(),
        coverImageUrl: cover.trim() || null,
        babyGender: gender,
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else setError(result.error);
    });
  }

  return (
    <div data-theme={themeFromGender(gender)} className="flex flex-1 flex-col gap-5">
      <p className="text-small text-ink-muted">{copy.editor.story.body}</p>
      <GenderChips value={gender} onChange={setGender} />
      <Field label={copy.editor.story.storyLabel}>
        <textarea
          value={storyText}
          onChange={(event) => setStory(event.target.value)}
          placeholder={copy.editor.story.storyPlaceholder}
          maxLength={2000}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>
      <Field label={copy.editor.story.coverLabel} hint={copy.editor.story.coverHint}>
        <input
          value={cover}
          onChange={(event) => setCover(event.target.value)}
          placeholder={copy.editor.story.coverPlaceholder}
          maxLength={500}
          dir="ltr"
          className={`${inputClass} text-start`}
        />
      </Field>
      {preview && (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card border border-border bg-image-bg">
          {/* Arbitrary pasted URLs are not on the Next image allowlist. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={copy.hero.defaultCoverAlt}
            className="h-full w-full object-cover object-center"
          />
        </div>
      )}
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <FormError message={error} />
        {saved && (
          <p role="status" className="text-small text-success">
            {copy.editor.story.saved}
          </p>
        )}
        <PrimaryButton onClick={save} disabled={pending}>
          {pending ? copy.editor.story.saving : copy.editor.story.save}
        </PrimaryButton>
      </div>
    </div>
  );
}
