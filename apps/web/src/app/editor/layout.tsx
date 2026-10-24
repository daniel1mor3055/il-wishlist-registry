/**
 * Never redirect from here: /editor/enter must stay reachable for a couple
 * who is not signed in.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
