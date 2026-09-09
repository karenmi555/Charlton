import Link from "next/link";
import { AuthGate } from "@/components/shell/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen">
        <header className="mx-auto max-w-6xl px-6 pt-8 pb-4 flex items-start justify-between gap-4">
          <div>
            <Link href="/calendar">
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-none">
                The apartment
              </h1>
            </Link>
            <p className="text-ink-soft text-sm mt-1">Shared calendar</p>
          </div>
          <nav className="flex gap-2 shrink-0">
            <Link
              href="/history"
              className="rounded-lg border border-beige-border px-4 py-2 text-sm text-ink hover:bg-beige-button transition-colors"
            >
              History
            </Link>
            <Link
              href="/settings"
              className="rounded-lg border border-beige-border px-4 py-2 text-sm text-ink hover:bg-beige-button transition-colors"
            >
              Settings
            </Link>
          </nav>
        </header>
        <div className="mx-auto max-w-6xl px-6 pb-16">{children}</div>
      </div>
    </AuthGate>
  );
}
