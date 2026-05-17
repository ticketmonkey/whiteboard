# API & Configuration

## Configuration

`config.json` — edit `family` to add/remove members, `admins` (subset of `family`) to control admin panel access. Restart the server after changes. Both lists are served via `GET /api/config` and validated server-side on every write.

## REST Endpoints

| Method | Path | Body / Query | Notes |
|--------|------|-------------|-------|
| GET | `/api/config` | — | Returns `{ family: [...], admins: [...] }` |
| GET | `/api/notes` | — | All notes, newest first |
| POST | `/api/notes` | `{ content, author }` | Author must be in family list |
| PUT | `/api/notes/:id` | `{ content, author }` | 403 if author doesn't match |
| DELETE | `/api/notes/:id` | `?author=Name` | 403 if author doesn't match |
| DELETE | `/api/notes` | `?admin=Name` | Clears all notes; 403 if not in admins list |
