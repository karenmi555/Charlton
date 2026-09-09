"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { UserPublic } from "@/lib/types";

const STORAGE_KEY = "apartment.currentUserId";

type Ctx = {
  currentUser: UserPublic | null;
  allUsers: UserPublic[];
  hydrated: boolean;
  setCurrentUserById: (id: string) => void;
  clearCurrentUser: () => void;
};

const UserContext = createContext<Ctx | null>(null);

export function UserProvider({
  allUsers,
  children,
}: {
  allUsers: UserPublic[];
  children: React.ReactNode;
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && allUsers.some((u) => u.id === stored)) {
      setCurrentUserId(stored);
    }
    setHydrated(true);
  }, [allUsers]);

  const currentUser = useMemo(
    () => allUsers.find((u) => u.id === currentUserId) ?? null,
    [allUsers, currentUserId]
  );

  const value = useMemo<Ctx>(
    () => ({
      currentUser,
      allUsers,
      hydrated,
      setCurrentUserById: (id) => {
        localStorage.setItem(STORAGE_KEY, id);
        setCurrentUserId(id);
      },
      clearCurrentUser: () => {
        localStorage.removeItem(STORAGE_KEY);
        setCurrentUserId(null);
      },
    }),
    [currentUser, allUsers, hydrated]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): Ctx {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used inside <UserProvider>");
  return ctx;
}
