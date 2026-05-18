# CLAUDE.md

Family whiteboard app — single-page, Express + SQLite, plain JS frontend, no build step.

## Commands

### Node.js

```bash
npm install        # first-time setup
npm start          # http://localhost:3000
PORT=8080 npm start
```

### Docker

```bash
docker compose up -d       # start container
docker compose down        # stop
docker compose restart     # reload config.json changes
docker compose logs -f     # live logs
./docker-update.sh         # pull latest image and restart
```

No tests or linters configured.

## Configuration

`config.json` is gitignored (contains personal family names). Copy the template before running:

```bash
cp config.example.json config.json
```

Edit `config.json` to set `family` (name picker) and `admins` (can clear all notes).

## Server Startup

**Do not mix `npm start &` with follow-on commands in a single Bash tool call.** It causes internal tool errors in the sandboxed environment.

Use two separate tool calls:
1. Start with `run_in_background: true`
2. Then `curl` or other checks in a separate call

## Database

SQLite file lives at `data/whiteboard.db` (gitignored). Created automatically on first run.

## Docker / CI

Pushing to `main` triggers GitHub Actions (`.github/workflows/docker.yml`), which builds and publishes the image to `ghcr.io/ticketmonkey/whiteboard:latest`.

`docker-compose.yml` pulls from ghcr.io by default. To build from source instead, swap `image:` for `build: .`.

## Git Workflow

For every new feature or bug fix, create a branch off `main` **before making any code changes**, work there, and merge back when satisfied.

```bash
git checkout -b feature/short-description   # or fix/short-description
# ... make changes ...
git add <files>
git commit -m "description"
git checkout main
git merge feature/short-description
git branch -d feature/short-description
```

Always confirm with the user before merging or deleting branches.

## Docs

- [Architecture](.claude/docs/architecture.md) — request flow, auth identity, database, admin panel
- [Frontend & Styling](.claude/docs/frontend.md) — CSS design system, design tokens, admin settings (fonts, note shapes)
- [API & Configuration](.claude/docs/api.md) — REST endpoints, config.json
