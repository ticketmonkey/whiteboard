const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'whiteboard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const cols = db.prepare('PRAGMA table_info(notes)').all().map(c => c.name);
if (!cols.includes('author')) {
  db.exec("ALTER TABLE notes ADD COLUMN author TEXT NOT NULL DEFAULT 'Unknown'");
}
if (!cols.includes('pos_x')) {
  db.exec('ALTER TABLE notes ADD COLUMN pos_x REAL');
}
if (!cols.includes('pos_y')) {
  db.exec('ALTER TABLE notes ADD COLUMN pos_y REAL');
}

module.exports = {
  getAllNotes() {
    return db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all();
  },
  createNote(content, author) {
    const result = db.prepare('INSERT INTO notes (content, author) VALUES (?, ?)').run(content, author);
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  },
  getNote(id) {
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  },
  updateNote(id, content) {
    db.prepare("UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = ?").run(content, id);
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  },
  deleteNote(id) {
    return db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  },
  updateNotePosition(id, x, y) {
    db.prepare('UPDATE notes SET pos_x = ?, pos_y = ? WHERE id = ?').run(x, y, id);
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  },
  clearAllNotes() {
    return db.prepare('DELETE FROM notes').run();
  },
};
