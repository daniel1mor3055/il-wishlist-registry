import { RegistryShell } from "@/components/registry/RegistryShell";
import { copy } from "@/lib/copy";

/** Assume a WhatsApp link that got truncated on copy (PRD section 7). */
export default function RegistryNotFound() {
  return <RegistryShell message={copy.shell.notFound} />;
}
