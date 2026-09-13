import { getOwnerRegistry } from "@/lib/owner";
import { themeFromGender } from "@/lib/theme";

/**
 * Palette for every editor screen. Never redirect from here: /editor/enter
 * must stay reachable for a couple who is not signed in.
 */
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const state = await getOwnerRegistry();
  const theme = themeFromGender(state.signedIn ? state.registry?.babyGender : null);
  return (
    <div data-theme={theme} className="min-h-dvh">
      {children}
    </div>
  );
}
