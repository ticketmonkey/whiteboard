# Family Whiteboard

A simple shared whiteboard for your family — create, edit, and delete notes. Updates appear live for everyone without refreshing.

## Requirements

- [Node.js](https://nodejs.org/) v18 or later

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Then open **http://localhost:3000** in your browser.

Open the same URL on multiple devices or browser windows — changes appear live for everyone.

## Notes

- Notes are stored in `whiteboard.db` (SQLite) in the project folder. They persist across restarts.
- To run on a different port: `PORT=8080 npm start`
