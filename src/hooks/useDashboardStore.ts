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

  // Holds whatever the most recent *unsaved* edit is, independent of the
  // setTimeout below. The timeout's own callback already "knows" the data
  // it's about to save (it's captured in its closure), but nothing outside
  // that callback can see it — so if we need to save early (see `flush`
  // below), there'd be no way to get at "the latest edit" without this ref.
  // A ref (not more React state) on purpose: this is bookkeeping read by
  // event handlers, not something that should ever cause a re-render.
  const pendingDataRef = useRef<DashboardData | null>(null);

  const scheduleSave = useCallback((next: DashboardData) => {
    pendingDataRef.current = next;
    setStatus("saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      timeoutRef.current = null;
      try {
        await saveDashboardData(next);
        pendingDataRef.current = null;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, SAVE_DELAY_MS);
  }, []);

  // Saves whatever's pending *right now*, instead of waiting out the rest of
  // the 800ms delay. This exists because that delay is only safe to wait out
  // if the page sticks around — if the user navigates away (e.g. clicking
  // "Training trends") before the timer fires, the timer never gets to run
  // and the edit is silently lost (it only ever existed in this tab's
  // memory, never reached the database). `flush` is the fix: callers that
  // are about to navigate away can `await flush()` first to guarantee the
  // save actually happens before they leave.
  //
  // Returns `true`/`false` for whether it's now safe to proceed (saved, or
  // there was nothing to save) vs. not (the save failed). Callers should use
  // this return value rather than reading `status` afterwards — `status` is
  // a piece of React state, so a value read from a closure right after
  // `await flush()` can still reflect how things looked *before* the flush
  // started, not the outcome that just happened.
  const flush = useCallback(async (): Promise<boolean> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const pending = pendingDataRef.current;
    if (pending === null) return true; // nothing unsaved — nothing to do, safe to proceed

    setStatus("saving");
    try {
      await saveDashboardData(pending);
      pendingDataRef.current = null;
      setStatus("saved");
      return true;
    } catch {
      // Deliberately leave pendingDataRef set on failure, rather than
      // clearing it, so a later flush (or the next debounced save) still
      // has the edit to retry — we never want a failed save to make an
      // edit disappear from what we consider "still needs saving".
      setStatus("error");
      return false;
    }
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

  // Guard against a second cause of the same problem: simply switching away
  // to another tab/app and back. If this tab sits in the background for a
  // while, another tab (or the same tab, earlier) may have saved newer data
  // in the meantime. Rather than let a later edit here silently save this
  // tab's now-outdated copy over that newer data, refresh as soon as this
  // tab becomes visible again — but only if there's no save currently
  // in-flight, so we never discard something the user just typed.
  //
  // The other half of this same handler covers the *leaving* side: the
  // moment the tab is hidden (switched away from, or about to close), flush
  // any pending edit immediately rather than hoping the remaining part of
  // the 800ms delay survives in the background — a backgrounded tab's
  // timers can be throttled or the tab can be closed outright before the
  // timer ever gets to run.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        flush(); // best-effort — see note on `pagehide` below
      } else if (document.visibilityState === "visible" && !timeoutRef.current) {
        window.location.reload();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [flush]);

  // A second, more reliable "the page is going away" signal. `visibilitychange`
  // doesn't fire consistently across every browser/OS combination right
  // before a same-tab navigation or tab close, but `pagehide` does — so this
  // is a backstop on top of the backstop above. Note this (and the handler
  // above) are both "fire and forget": once a page is actually being torn
  // down, JavaScript can't guarantee an in-flight save finishes. They lower
  // the odds of losing an edit in the unpredictable cases (closing the tab,
  // switching apps), but they're not a hard guarantee the way an *awaited*
  // `flush()` before an intentional in-app navigation is (see WeekView's
  // "Training trends" link, which does exactly that).
  useEffect(() => {
    function handlePageHide() {
      flush();
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [flush]);

  // A last line of defense, distinct from the handlers above: those try to
  // save automatically on the way out, but a save can only succeed if
  // there's actually a network connection right then — e.g. `status ===
  // "error"` means a save already failed once, so silently retrying on
  // pagehide could easily fail again the exact same way. Rather than let
  // that edit vanish with no warning, `beforeunload` lets us pop the
  // browser's native "leave site? changes may not be saved" confirmation
  // whenever there's still an unsaved edit (`pendingDataRef.current` isn't
  // null) or the last save attempt errored out — giving the user a chance
  // to stay, notice the "Couldn't save" message, and fix their connection
  // before losing the edit for good. Browsers ignore any custom message
  // text here and show their own wording, but `preventDefault` + setting
  // `returnValue` is still the standard way to trigger that dialog at all.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (pendingDataRef.current !== null || status === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  return { data, update, status, flush };
}
