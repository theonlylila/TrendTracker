"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDashboardData } from "@/app/actions";
import type { DashboardData } from "@/lib/types";

const SAVE_DELAY_MS = 800;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useDashboardStore(initialData: DashboardData) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback((next: DashboardData) => {
    setStatus("saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveDashboardData(next);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, SAVE_DELAY_MS);
  }, []);

  const update = useCallback(
    (updater: (prev: DashboardData) => DashboardData) => {
      setData((prev) => {
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Guard against the browser's back/forward cache (bfcache). If the user
  // navigates away and then hits the browser's own Back/Forward button,
  // the browser can restore this exact tab from memory instead of asking
  // the server for a fresh copy — meaning `data` here would still be
  // whatever it was before they left, even if the database has since
  // changed (e.g. edited in another tab). Because every edit here saves
  // the *entire* dashboard, editing a restored-from-memory tab would
  // silently overwrite anything newer with this stale snapshot. Forcing a
  // full reload when that happens ensures `initialData` always comes from
  // a fresh server fetch before any save can happen.
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return { data, update, status };
}
