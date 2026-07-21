# Agent Working Guide — TrendTracker

This project is maintained by someone new to git, GitHub, and version control concepts (secrets, `.gitignore`, branching). Any AI agent working in this repo follows the process below — it's written to be understandable to the project owner too, since they should be able to read this and know exactly how their assistant will behave.

---

## 1. Security Check Before Every Commit

A "secret" is any text that grants access if seen by the wrong person — API keys, passwords, tokens, database connection strings. Once pushed to GitHub, it can persist in history indefinitely, even after the file is later deleted.

`.gitignore` is the list of files/folders Git will never track. Sensitive files (e.g. `.env`, `.env.local`) must be on that list — being "probably fine" is not enough to assume.

**Before any `git add` / `git commit`:**
1. Review exactly what's staged.
2. Scan for likely secrets — keys, tokens, passwords, credentials, connection strings, un-ignored `.env*` files.
3. Verify `.gitignore` actually covers anything sensitive present in the project.
4. If anything looks off, stop and flag it to the user before committing. Never commit first and clean up after.

---

## 2. Always Ask Before Committing — Explain Local vs. Push

Distinguish these clearly to the user every time it's relevant:
- **Saving a file** — local disk only, visible to no one, trivially undone.
- **`git commit`** — a local snapshot/checkpoint. Still private, easy to undo.
- **`git push`** — uploads commits to GitHub. Now shared/visible, harder to undo.

**Rule:** Never commit or push automatically just because code changed. At logical stopping points (a feature works, a bug's fixed, before trying something risky), pause and ask the user whether to commit — don't assume.

- Suggest **local commits** frequently and cheaply — they're free checkpoints.
- Suggest a **push** only when work is ready to be backed up, shared, or is substantial enough that losing it would hurt.
- Always name the two as separate decisions, not one bundled action.

**Branching:**
- `main` = the stable, working version of the app.
- New, risky, or experimental work gets its own descriptively-named feature branch (e.g. `pink-background`).
- Merge to `main` only after the user confirms the branch works and explicitly wants it merged.
- Proactively suggest a feature branch when a change is experimental or separate from the current stable feature set, rather than defaulting to `main`.

---

## 3. Ask Before Significant Overhauls — Prefer Extending Existing Code

If a change would significantly restructure, rewrite, or replace a meaningful portion of existing working code (beyond a small, contained fix or addition), stop and get explicit user permission first, explaining what would change and why.

Default to **modifying existing code** rather than adding new bespoke, single-use code alongside it:
- Parallel/duplicate code paths are easy for a non-expert user to lose track of.
- One-off helpers tend to go stale silently, without the user ever learning they exist.
- Reuse keeps the app's behavior and complexity predictable and easy to follow as it grows.

If a full rewrite is genuinely the right engineering call, say so, explain the tradeoff in plain terms, and get explicit confirmation before proceeding — never decide this unilaterally.
