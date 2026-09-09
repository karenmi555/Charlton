"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/lib/identity/context";
import { updateUserColor } from "@/lib/actions/users";
import type { UserPublic } from "@/lib/types";

export function SettingsClient({ users }: { users: UserPublic[] }) {
  const { clearCurrentUser, currentUser } = useUserContext();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.color]))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function saveColor(userId: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await updateUserColor(userId, drafts[userId]);
        setMessage("Saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  function onSwitchUser() {
    clearCurrentUser();
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-beige-border bg-white/40 p-4 sm:p-6">
        <h3 className="font-serif text-xl font-semibold text-ink mb-4">Colors</h3>
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full border border-beige-border shrink-0"
                style={{ backgroundColor: drafts[u.id] }}
              />
              <span className="w-20 text-ink">{u.name}</span>
              <input
                type="color"
                value={drafts[u.id]}
                onChange={(e) => setDrafts((d) => ({ ...d, [u.id]: e.target.value }))}
                className="h-8 w-14 rounded border border-beige-border cursor-pointer"
              />
              <input
                type="text"
                value={drafts[u.id]}
                onChange={(e) => setDrafts((d) => ({ ...d, [u.id]: e.target.value }))}
                className="w-28 rounded-lg border border-beige-border bg-white/60 px-2 py-1 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => saveColor(u.id)}
                disabled={pending || drafts[u.id] === u.color}
                className="rounded-lg bg-ink px-3 py-1.5 text-xs text-cream font-medium hover:bg-ink/90 disabled:opacity-40"
              >
                Save
              </button>
            </li>
          ))}
        </ul>
        {message && <p className="text-sm text-ink-soft mt-3">{message}</p>}
        {error && <p className="text-sm text-maroon mt-3">{error}</p>}
      </section>

      <section className="rounded-2xl border border-beige-border bg-white/40 p-4 sm:p-6">
        <h3 className="font-serif text-xl font-semibold text-ink mb-2">Signed in</h3>
        <p className="text-ink-soft text-sm mb-4">
          You are currently signed in as{" "}
          <span className="text-ink font-medium">{currentUser?.name ?? "unknown"}</span>.
        </p>
        <button
          type="button"
          onClick={onSwitchUser}
          className="rounded-lg border border-maroon/40 px-4 py-2 text-sm text-maroon hover:bg-maroon/10"
        >
          Switch user
        </button>
      </section>
    </div>
  );
}
