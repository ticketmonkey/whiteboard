# Architecture

All backend logic lives in two files (`server.js`, `db.js`); the frontend is plain JS with no build step.

## Request Flow

1. Browser loads `public/index.html` + `public/app.js` (served as static files by Express)
2. `app.js` fetches `/api/notes` on load, then opens a WebSocket connection to the same host
3. After any create/edit/delete, the server calls `broadcast()` which sends `{ type: "notes_updated" }` to all connected WebSocket clients — each client re-fetches `/api/notes` and re-renders

## Author Identity

Stored in `localStorage` (key: `author`). On first visit the frontend fetches `/api/config` for the family name list and shows a name-picker modal. The chosen name is sent with every mutating request. The server validates it against `config.json` and enforces that only the author can edit/delete their own notes. There is no real authentication — ownership is convenience-only.

## Database

`db.js` is a synchronous `better-sqlite3` wrapper around `whiteboard.db`. Schema is created on startup; the `author` column is added via migration check if absent (for databases predating the author feature).

## Admin Panel

Accessible to users listed in `config.json → admins`. Admins see an **Admin** button in the header (hidden for others). Panel sections:

- **Clear Whiteboard** — `DELETE /api/notes?admin=Name`; server validates against admins set before wiping and broadcasting `notes_updated`
- **Note Font** — 14 fonts across three groups; persists to `localStorage` (key: `noteFont`) per user
- **Note Shape** — 4 shape styles (Uniform, Scattered, Crystalline, Warped); persists to `localStorage` (key: `noteStyle`) per user

Admin settings are purely client-side preferences; no server involvement.
