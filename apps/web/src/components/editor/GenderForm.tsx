"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { patchRegistry } from "@/app/editor/actions";
import { FormError } from "@/components/editor/EditorShell";
import { GenderChips } from "@/components/editor/GenderChips";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";
import { themeFromGender, type BabyGender } from "@/lib/theme";

/**
 * Later edit of the list colour. Wizard step 2 is the first pick; this
 * screen is the settings door, not the story.
 */
export function GenderForm({ babyGender }: { babyGender: BabyGender }) {
  const [gender, setGender] = useState<BabyGender>(babyGender);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await patchRegistry({ babyGender: gender });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else setError(result.error);
    });
  }

  return (
    <div data-theme={themeFromGender(gender)} className="flex flex-1 flex-col gap-5">
      <GenderChips value={gender} onChange={setGender} />
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <FormError message={error} />
        {saved && (
          <p role="status" className="text-small text-success">
            {copy.editor.gender.saved}
          </p>
        )}
        <PrimaryButton onClick={save} disabled={pending}>
          {pending ? copy.editor.gender.saving : copy.editor.gender.save}
        </PrimaryButton>
      </div>
    </div>
  );
}
