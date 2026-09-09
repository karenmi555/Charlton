"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIdentity, AuthContextProvider } from "@/lib/identity/context";
import type { UserPublic } from "@/lib/types";

// Wraps authenticated routes. If the browser has no stored userId, or the
// stored id no longer matches any real user, kicks back to landing. Only
// mounts the AuthContext (which carries allUsers) once a valid identity is
// resolved — so the whitelist never reaches unauthenticated views.
export function AuthShell({
  allUsers,
  children,
}: {
  allUsers: UserPublic[];
  children: React.ReactNode;
}) {
  const { userId, hydrated, clearUserId } = useIdentity();
  const router = useRouter();

  const currentUser =
    userId != null ? allUsers.find((u) => u.id === userId) ?? null : null;

  useEffect(() => {
    if (hydrated && !currentUser) {
      if (userId) clearUserId();
      router.replace("/");
    }
  }, [hydrated, currentUser, userId, clearUserId, router]);

  if (!hydrated || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-soft text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <AuthContextProvider
      currentUser={currentUser}
      allUsers={allUsers}
      clearCurrentUser={clearUserId}
    >
      {children}
    </AuthContextProvider>
  );
}
