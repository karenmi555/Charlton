"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/lib/identity/context";

export function LandingForm() {
  const { allUsers, currentUser, hydrated, setCurrentUserById } = useUserContext();
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && currentUser) {
      router.replace("/calendar");
    }
  }, [hydrated, currentUser, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim().toLowerCase();
    const match = allUsers.find((u) => u.name.toLowerCase() === trimmed);
    if (!match) {
      setError("Name not recognized. Please check the spelling.");
      return;
    }
    setCurrentUserById(match.id);
    router.push("/calendar");
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
          className="w-full rounded-lg border border-beige-border bg-white/60 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-maroon/40"
          placeholder="Karen, Cathy, Jeff, or Charlie"
        />
      </label>
      {error && (
        <p className="text-sm text-maroon" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-lg bg-ink px-4 py-3 text-cream font-medium hover:bg-ink/90 transition-colors"
      >
        Continue
      </button>
    </form>
  );
}
