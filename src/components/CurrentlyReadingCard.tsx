"use client";

import { useState } from "react";
import type { CurrentlyReading, DashboardData } from "@/lib/types";

type Props = {
  weekKey: string;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

export function CurrentlyReadingCard({ weekKey, data, update }: Props) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const book = data.currentlyReading.find((b) => b.weekKey === weekKey);

  function setBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const entry: CurrentlyReading = {
      id: crypto.randomUUID(),
      weekKey,
      title: title.trim(),
      author: author.trim(),
    };

    update((prev) => ({
      ...prev,
      currentlyReading: [
        ...prev.currentlyReading.filter((b) => b.weekKey !== weekKey),
        entry,
      ],
    }));
    setTitle("");
    setAuthor("");
  }

  function clearBook() {
    update((prev) => ({
      ...prev,
      currentlyReading: prev.currentlyReading.filter((b) => b.weekKey !== weekKey),
    }));
  }

  return (
    <div className="card">
      <p className="eyebrow">Currently reading</p>

      {book ? (
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{book.title}</p>
            {book.author && <p className="text-xs text-muted mt-0.5">{book.author}</p>}
          </div>
          <button
            onClick={clearBook}
            className="text-xs text-muted hover:text-clay shrink-0"
          >
            Clear
          </button>
        </div>
      ) : (
        <form onSubmit={setBook} className="mt-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
            className="field w-full text-sm"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="field w-full text-sm"
          />
          <button type="submit" className="btn-secondary w-full">
            Set as reading
          </button>
        </form>
      )}
    </div>
  );
}
