"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/lib/identity/context";
import { resolveName } from "@/lib/actions/users";

export function LandingForm() {
  const { userId, hydrated, setUserId } = useIdentity();
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (hydrated && userId) {
      router.replace("/calendar");
    }
  }, [hydrated, userId, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await resolveName(name);
      if (!result.valid) {
        setError("Name not recognized.");
        return;
      }
      setUserId(result.id);
      router.push("/calendar");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-ink-soft text-sm mb-2 block">Enter your name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          autoFocus
          autoComplete="off"
          className="w-full rounded-lg border border-beige-border bg-white/60 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-maroon/40"
        />
      </label>
      {error && (
        <p className="text-sm text-maroon" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="w-full rounded-lg bg-ink px-4 py-3 text-cream font-medium hover:bg-ink/90 disabled:opacity-50 transition-colors"
      >
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
