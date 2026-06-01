"use client";

import { useState, useEffect, useCallback } from "react";
import type { Session } from "@/types";

const STORAGE_KEY = "english-practice-history";

export function useHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Session[];
        setSessions(parsed);
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever sessions change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (error) {
        console.error("Failed to save history to localStorage:", error);
      }
    }
  }, [sessions, isHydrated]);

  const addSession = useCallback((topic: string, text: string) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      topic,
      text,
      timestamp: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    return newSession;
  }, []);

  const clearHistory = useCallback(() => {
    setSessions([]);
  }, []);

  return {
    sessions,
    isHydrated,
    addSession,
    clearHistory,
  };
}
