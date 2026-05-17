# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install   # first-time setup
npm start     # start the server (http://localhost:3000)
PORT=8080 npm start  # run on a different port
```

There are no tests or linters configured.

## Testing / Server Startup

**Do not mix `npm start &` with follow-on commands in a single Bash tool call.** Backgrounding the server and running `sleep` + `curl` in the same shell string causes internal tool errors in Claude Code's sandboxed environment.

Instead, use two separate tool calls:
1. Start the server with `run_in_background: true` on its own.
2. Once confirmed running, issue `curl` or other test commands in a separate call.

## Architecture

This is a single-page family whiteboard app. All backend logic is in two files; the frontend is plain JS with no build step.

**Frontend styling:** "Cyber Whiteboard" dark theme — glassmorphism cards, neon cyan/violet accents, CSS-only dot-grid background, sticky frosted-glass header with shimmer animation, card entry/exit animations. Fonts loaded from Google Fonts: `Inter` (UI chrome) and 14 selectable note fonts across three categories (Handwriting, Futuristic, Monospace). The active note font is controlled by the `--font-note` CSS custom property; changing it via JS updates all note text instantly. All design tokens are CSS custom properties in `:root` at the top of `style.css`. No CSS framework or build step.

**Request flow:**
1. Browser loads `public/index.html` + `public/app.js` (served as static files by Express)
2. `app.js` fetches `/api/notes` on load, then opens a WebSocket connection to the same host
3. After any create/edit/delete, the server calls `broadcast()` which sends `{ type: "notes_updated" }` to all connected WebSocket clients — each client then re-fetches `/api/notes` and re-renders

**Author identity** is stored in `localStorage` (key: `author`). On first visit, the frontend fetches `/api/config` to get the family name list and shows a name-picker modal. The chosen name is sent with every mutating API request. The server validates it against `config.json` and enforces that only the author can edit/delete their own notes. There is no real authentication — ownership is convenience-only.

**Admin panel** is accessible to users listed in `config.json → admins`. Admins see an **Admin** button in the header (hidden for non-admins). The panel has two sections:
- **Clear Whiteboard** — calls `DELETE /api/notes?admin=Name`, which the server validates against the admins set before wiping all notes and broadcasting `notes_updated`.
- **Note Font** — 14 fonts in three groups (Handwriting, Futuristic, Monospace); selection updates `--font-note` and persists to `localStorage` (key: `noteFont`) per user.

**Database** (`db.js`): synchronous `better-sqlite3` wrapper around `whiteboard.db`. The schema is created on startup; the `author` column is added via a migration check if it doesn't exist (for databases created before the author feature was added).

## Configuration

`config.json` — edit the `family` array to add or remove family members, and the `admins` array (subset of `family`) to control who can access the admin panel. Restart the server after changes. Both lists are served to the frontend via `GET /api/config` and validated server-side on every write.

## API

| Method | Path | Body / Query | Notes |
|--------|------|-------------|-------|
| GET | `/api/config` | — | Returns `{ family: [...], admins: [...] }` |
| GET | `/api/notes` | — | All notes, newest first |
| POST | `/api/notes` | `{ content, author }` | Author must be in family list |
| PUT | `/api/notes/:id` | `{ content, author }` | 403 if author doesn't match |
| DELETE | `/api/notes/:id` | `?author=Name` | 403 if author doesn't match |
| DELETE | `/api/notes` | `?admin=Name` | Clears all notes; 403 if not in admins list |
