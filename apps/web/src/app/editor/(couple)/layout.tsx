import { getOwnerRegistry } from "@/lib/owner";
import { themeFromGender } from "@/lib/theme";

export default async function CoupleEditorLayout({ children }: { children: React.ReactNode }) {
  const state = await getOwnerRegistry();
  const theme = themeFromGender(state.signedIn ? state.registry?.babyGender : null);
  return (
    <div data-theme={theme} className="min-h-dvh">
      {children}
    </div>
  );
}
