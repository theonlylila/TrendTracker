# Working With This Project — A Guide for a First-Time Developer

You (the user) are new to git, GitHub, and the concepts of "secrets" and version control. This file exists so that Claude Code always follows a safe, teachable process when helping you — and so you understand *why* it's asking what it's asking. Nothing here is optional; these are standing rules for every session in this project.

---

## 1. Security Check Before Every Commit

**What's a "secret"?** Any piece of text that would let someone else access something private if they saw it — an API key, a database password, a login token, a `.env` file's contents. Think of it like the PIN to a bank card: fine to use, disastrous to publish.

**Why this matters:** Once something is pushed to GitHub, even a public repo you later delete the file from, it usually still exists in the repo's *history* forever (or until someone does surgery to remove it). "I'll just delete it after" does not undo a leak.

**What `.gitignore` does:** It's a list of files/folders that Git is told to never track or upload, no matter what. This project's `.gitignore` currently excludes things like `.env`, `.env.local`, and `node_modules`. If something sensitive isn't on that list, Git will happily commit it.

**The rule:** Before running `git add` / `git commit` on your behalf, Claude must:
1. Review exactly what files are being staged.
2. Scan for likely secrets — API keys, tokens, passwords, connection strings, `.env*` files, credentials of any kind.
3. Confirm sensitive files (like `.env.local`) are actually covered by `.gitignore`, not just assumed to be.
4. If anything looks like a secret or an ungitignored sensitive file, **stop and flag it to you before committing** — never commit first and ask forgiveness later.

---

## 2. Strategic Save Points — Always Ask Before Committing

Three different things people conflate as "saving," explained plainly:

| Action | What it does | Who can see it | How easy to undo |
|---|---|---|---|
| Saving a file | Writes to your disk | Only you | Trivial |
| `git commit` | Takes a labeled snapshot in your local project history | Only you (still local) | Easy |
| `git push` | Uploads your commits to GitHub | Anyone with repo access | Harder — it's now shared |

**The rule:** Claude will not commit or push just because code changed. At natural stopping points — a feature works, a bug is fixed, or before starting something experimental — Claude will pause and ask something like *"Want me to commit this as a checkpoint?"* rather than assuming yes or deciding silently.

**When to suggest a local commit vs. a push:**
- **Commit locally** often and cheaply — after any small working step. It costs nothing, stays private, and gives you an undo point.
- **Push to GitHub** when the work is either (a) ready to be backed up / shared, or (b) done enough that you'd be upset to lose it if your laptop died.
- Claude should make this distinction explicit each time, not bundle "commit" and "push" together as one action.

**Branching strategy (for a clean workflow):**
- `main` is the stable, known-good version of the app.
- Anything new, risky, or experimental (a redesign, an untested feature, "let's see if this works") gets its own **feature branch**, named for what it does (e.g. `pink-background`, `add-login-page`).
- Work and commit freely on the feature branch.
- Only merge into `main` after you've confirmed it works and you've explicitly said you want it merged.
- Claude should proactively suggest creating a branch when a change is experimental or unrelated to the current stable feature set, rather than committing straight to `main`.

---

## 3. Ask Before Large Overhauls — Prefer Editing Over Rewriting

**The rule:** If a requested change would significantly restructure, rewrite, or replace a meaningful chunk of existing, working code (as opposed to a small, contained addition or fix), Claude must stop and ask for your explicit go-ahead before making the change — explaining what would change and why.

**Default to modifying what already exists** rather than writing new one-off, bespoke code alongside it. Reasons this matters for you specifically:
- Duplicate or parallel code paths are easy to lose track of, especially if you're not yet fluent in reading the codebase — you could end up with two versions of something and not know which one is "real."
- Bespoke single-use helpers tend to go stale (unused, forgotten, quietly out of sync with the rest of the app) without you ever finding out they're there.
- Reusing and extending existing code keeps the app's behavior predictable and keeps its size/complexity from growing faster than you can follow.

If a rewrite genuinely is the better engineering choice, Claude should say so, explain the tradeoff in plain terms, and get your confirmation — not decide unilaterally.
