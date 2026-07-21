"use client";

import type { DashboardData } from "@/lib/types";

type Props = {
  weekKey: string;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

export function ReflectionsCard({ weekKey, data, update }: Props) {
  const entry = data.reflections.find((r) => r.weekKey === weekKey);
  const text = entry?.text ?? "";

  function setText(value: string) {
    update((prev) => {
      const exists = prev.reflections.some((r) => r.weekKey === weekKey);
      const reflections = exists
        ? prev.reflections.map((r) => (r.weekKey === weekKey ? { ...r, text: value } : r))
        : [...prev.reflections, { weekKey, text: value }];
      return { ...prev, reflections };
    });
  }

  return (
    <div className="card">
      <p className="eyebrow">Reflections</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="How's the week going? Anything on your mind..."
        rows={4}
        className="field w-full mt-3 resize-none text-sm leading-relaxed"
      />
    </div>
  );
}
