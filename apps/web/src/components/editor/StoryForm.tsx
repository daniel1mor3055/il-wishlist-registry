"use client";

import { useState, useTransition } from "react";
import { patchRegistry } from "@/app/editor/actions";
import { C6StoryPortrait } from "@/components/illustrations/C6StoryPortrait";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Sprite";
import { SavedStatus } from "@/components/ui/SavedStatus";
import { copy } from "@/lib/copy";
import { coverIsCustom, coverSrc } from "@/lib/cover";

const cloudField =
  "focus-ring mt-1.5 w-full resize-none rounded-tile bg-cloud px-4 py-3 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper";

/** Empty cover stays null; guests still get the default teddy. */
export function StoryForm({
  story,
  coverImageUrl,
}: {
  story: string;
  coverImageUrl: string | null;
}) {
  const [storyText, setStory] = useState(story);
  const [cover, setCover] = useState(coverImageUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const customCover = coverIsCustom(cover);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await patchRegistry({
        story: storyText.trim(),
        coverImageUrl: cover.trim() || null,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <C6StoryPortrait
        src={customCover ? coverSrc(cover) : null}
        alt={copy.hero.defaultCoverAlt}
      />
      <div className="flex min-w-0 flex-col">
        <div className="px-5 pb-6 pt-5 lg:px-8 lg:pt-8">
          <p className="text-copy text-charcoal lg:text-lead">{copy.editor.story.body}</p>
          <label className="mt-6 block text-start">
            <span className="block text-fine font-medium text-slate">
              {copy.editor.story.storyLabel}
            </span>
            <textarea
              value={storyText}
              onChange={(event) => setStory(event.target.value)}
              placeholder={copy.editor.story.storyPlaceholder}
              maxLength={2000}
              rows={4}
              className={cloudField}
            />
          </label>
          <label className="mt-5 block text-start">
            <span className="flex items-center gap-1.5 text-fine font-medium text-slate">
              <Icon name="ic-photo" className="size-4 text-brand-deep" />
              {copy.editor.story.coverLabel}
            </span>
            <input
              value={cover}
              onChange={(event) => setCover(event.target.value)}
              placeholder={copy.editor.story.coverPlaceholder}
              maxLength={500}
              dir="ltr"
              className={
                customCover
                  ? "ltr-token focus-ring mt-1.5 h-14 w-full truncate rounded-tile bg-cloud px-4 text-fine text-graphite outline-none placeholder:text-slate focus:bg-paper"
                  : "ltr-token focus-ring mt-1.5 h-14 w-full rounded-tile bg-cloud px-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper"
              }
            />
          </label>
        </div>
        <div className="mt-auto border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
          {error ? <Alert>{error}</Alert> : null}
          <div className="flex flex-col items-center gap-3 lg:flex-row">
            <Button type="button" onClick={save} pending={pending} fit>
              {pending ? copy.editor.story.saving : copy.editor.story.save}
            </Button>
            {saved ? <SavedStatus>{copy.editor.story.saved}</SavedStatus> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
