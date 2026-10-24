"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { patchRegistry } from "@/app/editor/actions";
import { EditorFrame } from "@/components/editor/EditorFrame";
import { GenderChips } from "@/components/editor/GenderChips";
import { C6aGenderPreview } from "@/components/illustrations/C6aGenderPreview";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SavedStatus } from "@/components/ui/SavedStatus";
import { copy } from "@/lib/copy";
import { themeFromGender, type BabyGender } from "@/lib/theme";

/** Settings edit of the list colour. Wizard step 2 is the first pick. */
export function GenderForm({
  babyGender,
  coupleNames,
}: {
  babyGender: BabyGender;
  coupleNames: string;
}) {
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
    <div data-theme={themeFromGender(gender)}>
      <EditorFrame
        title={copy.editor.gender.label}
        lead={coupleNames}
        back="/editor/settings"
        nav="settings"
      >
        <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
          <C6aGenderPreview />
          <div className="flex min-w-0 flex-col">
            <div className="px-5 pb-7 pt-6 lg:flex lg:flex-1 lg:items-center lg:px-8 lg:py-10">
              {/* Chips label the group; the banner heading is the same question. */}
              <div className="w-full [&_p]:sr-only [&_[role=radiogroup]]:mt-0">
                <GenderChips value={gender} onChange={setGender} />
              </div>
            </div>
            <div className="mt-auto border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
              {error ? <Alert>{error}</Alert> : null}
              <div className="flex flex-col items-center gap-3 lg:flex-row">
                <Button type="button" onClick={save} pending={pending} fit>
                  {pending ? copy.editor.gender.saving : copy.editor.gender.save}
                </Button>
                {saved ? <SavedStatus>{copy.editor.gender.saved}</SavedStatus> : null}
              </div>
            </div>
          </div>
        </div>
      </EditorFrame>
    </div>
  );
}
