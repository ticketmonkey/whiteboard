# Family Whiteboard

A simple shared whiteboard for your family — create, edit, and delete notes. Updates appear live for everyone without refreshing.

---

## Quick Start with Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

**1. Copy the config template and add your family members:**

```bash
cp config.example.json config.json
```

Edit `config.json`:

```json
{
  "family": ["Mom", "Dad", "Alice", "Bob"],
  "admins": ["Mom", "Dad"]
}
```

**2. Start the container:**

```bash
docker compose up -d
```

Open **http://localhost:3000** in your browser.

### Keeping it up to date

When a new version is published, pull and restart:

```bash
./docker-update.sh
```

Or manually:

```bash
docker compose pull
docker compose up -d
```

### Other useful commands

```bash
docker compose down          # stop
docker compose logs -f       # live logs
docker compose restart       # reload config.json changes (no pull needed)
```

### Notes

- Notes are stored in a Docker volume (`whiteboard_data`) and persist across restarts and updates.
- `config.json` is never included in the image — your family members stay private.
- To run on a different port, change `3000:3000` to e.g. `8080:3000` in `docker-compose.yml`.

---

## Run Without Docker (Node.js)

Requires [Node.js](https://nodejs.org/) v18 or later.

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

To run on a different port: `PORT=8080 npm start`

Notes are stored in `data/whiteboard.db` in the project folder.

---

## Configuration

Copy `config.example.json` to `config.json` and fill in your family:

| Field | Description |
|-------|-------------|
| `family` | List of names shown in the "Who are you?" picker |
| `admins` | Names that can clear all notes at once |

With Docker, edit `config.json` and run `docker compose restart` to apply changes — no rebuild needed.
