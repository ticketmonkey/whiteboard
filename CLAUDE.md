# CLAUDE.md

Family whiteboard app — single-page, Express + SQLite, plain JS frontend, no build step.

## Commands

```bash
npm install        # first-time setup
npm start          # http://localhost:3000
PORT=8080 npm start
```

No tests or linters configured.

## Server Startup

**Do not mix `npm start &` with follow-on commands in a single Bash tool call.** It causes internal tool errors in the sandboxed environment.

Use two separate tool calls:
1. Start with `run_in_background: true`
2. Then `curl` or other checks in a separate call

## Git Workflow

For every new feature or bug fix, create a branch off `main`, work there, and merge back when satisfied.

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
