"use client";

import { useState } from "react";
import type { DashboardData, Stretch, StretchRoutine } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
  initialTab?: Tab;
};

type Tab = "stretches" | "routines" | "schedule";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ManageStretchesModal({ data, update, onClose, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "stretches");

  return (
    <Modal title="Manage stretches" onClose={onClose} wide>
      <div className="flex gap-1 mb-5 border-b border-line">
        {(
          [
            ["stretches", "Stretches"],
            ["routines", "Routines"],
            ["schedule", "Weekly schedule"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-clay text-clay"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stretches" && <StretchesTab data={data} update={update} />}
      {tab === "routines" && <RoutinesTab data={data} update={update} />}
      {tab === "schedule" && <ScheduleTab data={data} update={update} />}
    </Modal>
  );
}

function StretchesTab({ data, update }: Pick<Props, "data" | "update">) {
  const [name, setName] = useState("");

  function addStretch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const stretch: Stretch = { id: crypto.randomUUID(), name: name.trim() };
    update((prev) => ({ ...prev, stretches: [...prev.stretches, stretch] }));
    setName("");
  }

  function updateStretch(id: string, patch: Partial<Stretch>) {
    update((prev) => ({
      ...prev,
      stretches: prev.stretches.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function removeStretch(id: string) {
    update((prev) => ({
      ...prev,
      stretches: prev.stretches.filter((s) => s.id !== id),
      stretchRoutines: prev.stretchRoutines.map((r) => ({
        ...r,
        stretchIds: r.stretchIds.filter((sId) => sId !== id),
      })),
    }));
  }

  return (
    <div>
      <form onSubmit={addStretch} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Stretch name, e.g. Couch Stretch"
          className="field flex-1 text-sm"
        />
        <button type="submit" className="btn-secondary">
          Add
        </button>
      </form>

      {data.stretches.length === 0 ? (
        <p className="text-sm text-muted mt-4">No stretches yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.stretches.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <input
                value={s.name}
                onChange={(e) => updateStretch(s.id, { name: e.target.value })}
                className="field flex-1 py-1.5 text-sm"
              />
              <button
                onClick={() => removeStretch(s.id)}
                aria-label="Delete stretch"
                className="text-muted hover:text-clay text-xs px-1"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoutinesTab({ data, update }: Pick<Props, "data" | "update">) {
  const [name, setName] = useState("");

  function addRoutine(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const routine: StretchRoutine = { id: crypto.randomUUID(), name: name.trim(), stretchIds: [] };
    update((prev) => ({ ...prev, stretchRoutines: [...prev.stretchRoutines, routine] }));
    setName("");
  }

  function renameRoutine(id: string, newName: string) {
    update((prev) => ({
      ...prev,
      stretchRoutines: prev.stretchRoutines.map((r) => (r.id === id ? { ...r, name: newName } : r)),
    }));
  }

  // Same cleanup pattern as removeTemplate in ManageWorkoutsModal: clear the
  // routine from the default schedule and overrides, AND null it out of any
  // past logs that reference it, so nothing in the app is left holding an
  // id that no longer exists in stretchRoutines. Safe to null (rather than
  // delete) the log's routineId because StretchLog keeps its own
  // routineName snapshot — the log still shows what you did.
  function removeRoutine(id: string) {
    update((prev) => ({
      ...prev,
      stretchRoutines: prev.stretchRoutines.filter((r) => r.id !== id),
      stretchDefaultSchedule: prev.stretchDefaultSchedule.map((d) =>
        d.routineId === id ? { ...d, routineId: null } : d
      ),
      stretchScheduleOverrides: prev.stretchScheduleOverrides.map((o) =>
        o.routineId === id ? { ...o, routineId: null } : o
      ),
      stretchLogs: prev.stretchLogs.map((l) =>
        l.routineId === id ? { ...l, routineId: null } : l
      ),
    }));
  }

  function addStretchTo(routineId: string, stretchId: string) {
    if (!stretchId) return;
    update((prev) => ({
      ...prev,
      stretchRoutines: prev.stretchRoutines.map((r) =>
        r.id === routineId && !r.stretchIds.includes(stretchId)
          ? { ...r, stretchIds: [...r.stretchIds, stretchId] }
          : r
      ),
    }));
  }

  function removeStretchFrom(routineId: string, stretchId: string) {
    update((prev) => ({
      ...prev,
      stretchRoutines: prev.stretchRoutines.map((r) =>
        r.id === routineId
          ? { ...r, stretchIds: r.stretchIds.filter((id) => id !== stretchId) }
          : r
      ),
    }));
  }

  function moveStretch(routineId: string, index: number, dir: -1 | 1) {
    update((prev) => ({
      ...prev,
      stretchRoutines: prev.stretchRoutines.map((r) => {
        if (r.id !== routineId) return r;
        const next = [...r.stretchIds];
        const target = index + dir;
        if (target < 0 || target >= next.length) return r;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...r, stretchIds: next };
      }),
    }));
  }

  function stretchName(id: string) {
    return data.stretches.find((s) => s.id === id)?.name ?? "(deleted stretch)";
  }

  return (
    <div>
      <form onSubmit={addRoutine} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='New routine name, e.g. "Morning Routine"'
          className="field flex-1 text-sm"
        />
        <button type="submit" className="btn-secondary">
          Create
        </button>
      </form>

      {data.stretchRoutines.length === 0 ? (
        <p className="text-sm text-muted mt-4">
          No routines yet — create one above, then add stretches to it.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {data.stretchRoutines.map((r) => {
            const available = data.stretches.filter((s) => !r.stretchIds.includes(s.id));
            return (
              <li key={r.id} className="border border-line rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={r.name}
                    onChange={(e) => renameRoutine(r.id, e.target.value)}
                    className="field flex-1 py-1.5 text-sm font-medium"
                  />
                  <button
                    onClick={() => removeRoutine(r.id)}
                    aria-label="Delete routine"
                    className="text-muted hover:text-clay text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                {r.stretchIds.length > 0 && (
                  <ul className="mt-2.5 space-y-1">
                    {r.stretchIds.map((sId, i) => (
                      <li key={sId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1">{stretchName(sId)}</span>
                        <button
                          onClick={() => moveStretch(r.id, i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                          className="text-muted hover:text-clay text-xs disabled:opacity-30 px-1"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveStretch(r.id, i, 1)}
                          disabled={i === r.stretchIds.length - 1}
                          aria-label="Move down"
                          className="text-muted hover:text-clay text-xs disabled:opacity-30 px-1"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => removeStretchFrom(r.id, sId)}
                          aria-label="Remove from routine"
                          className="text-muted hover:text-clay text-xs px-1"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {available.length > 0 ? (
                  <select
                    value=""
                    onChange={(e) => addStretchTo(r.id, e.target.value)}
                    className="field w-full mt-2.5 py-1.5 text-sm"
                  >
                    <option value="">+ add stretch…</option>
                    {available.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : data.stretches.length === 0 ? (
                  <p className="text-xs text-muted mt-2.5">
                    Add stretches in the Stretches tab first.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ScheduleTab({ data, update }: Pick<Props, "data" | "update">) {
  function setDefaultForDay(dayOfWeek: number, routineId: string) {
    update((prev) => ({
      ...prev,
      stretchDefaultSchedule: prev.stretchDefaultSchedule.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, routineId: routineId || null } : d
      ),
    }));
  }

  return (
    <div>
      <p className="text-sm text-muted mb-3">
        Set your default stretch routine for each day. You can still swap a single day from
        the week view without changing this.
      </p>
      <ul className="space-y-1.5">
        {DAY_ORDER.map((dayOfWeek) => {
          const entry = data.stretchDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek);
          return (
            <li key={dayOfWeek} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-20 shrink-0">
                {DAY_NAMES[dayOfWeek]}
              </span>
              <select
                value={entry?.routineId ?? ""}
                onChange={(e) => setDefaultForDay(dayOfWeek, e.target.value)}
                className="field flex-1 py-1.5 text-sm"
              >
                <option value="">No stretching</option>
                {data.stretchRoutines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
