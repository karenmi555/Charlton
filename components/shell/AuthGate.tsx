"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/lib/identity/context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { hydrated, currentUser } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !currentUser) {
      router.replace("/");
    }
  }, [hydrated, currentUser, router]);

  if (!hydrated || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-soft text-sm">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
