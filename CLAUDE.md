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

## Docs

- [Architecture](.claude/docs/architecture.md) — request flow, auth identity, database, admin panel
- [Frontend & Styling](.claude/docs/frontend.md) — CSS design system, design tokens, admin settings (fonts, note shapes)
- [API & Configuration](.claude/docs/api.md) — REST endpoints, config.json
