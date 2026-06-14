import { useEffect, useState } from "react";

/**
 * Like useState, but the value survives in-tab navigation (and reloads) by
 * mirroring to sessionStorage under `key`. Used so expand/collapse state on
 * the home page persists while the user dips into a project detail and back.
 */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sessionStorage unavailable (private mode / quota) — non-fatal.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
