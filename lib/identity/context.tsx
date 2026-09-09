"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { UserPublic } from "@/lib/types";

const STORAGE_KEY = "apartment.currentUserId";

// Root-level identity: knows only the userId in localStorage. Available on
// every route including the public landing page. Does NOT carry names or
// colors of other users — that data only enters the tree behind AuthShell.
type IdentityCtx = {
  userId: string | null;
  hydrated: boolean;
  setUserId: (id: string) => void;
  clearUserId: () => void;
};

const IdentityContext = createContext<IdentityCtx | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUserIdState(localStorage.getItem(STORAGE_KEY));
    setHydrated(true);
  }, []);

  const value = useMemo<IdentityCtx>(
    () => ({
      userId,
      hydrated,
      setUserId: (id) => {
        localStorage.setItem(STORAGE_KEY, id);
        setUserIdState(id);
      },
      clearUserId: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUserIdState(null);
      },
    }),
    [userId, hydrated]
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityCtx {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used inside <IdentityProvider>");
  return ctx;
}

// Auth-only: adds the resolved current user + all-users list. Provided
// inside AuthShell, which only mounts once a user is authenticated. So the
// whitelist never reaches unauthenticated routes.
type AuthCtx = {
  currentUser: UserPublic;
  allUsers: UserPublic[];
  clearCurrentUser: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthContextProvider({
  currentUser,
  allUsers,
  clearCurrentUser,
  children,
}: AuthCtx & { children: React.ReactNode }) {
  const value = useMemo(
    () => ({ currentUser, allUsers, clearCurrentUser }),
    [currentUser, allUsers, clearCurrentUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthShell>");
  return ctx;
}
