const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const db = require('./db');
const config = require('./config.json');

const family = new Set(config.family);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static('public'));

function broadcast() {
  const msg = JSON.stringify({ type: 'notes_updated' });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

app.get('/api/config', (req, res) => {
  res.json({ family: config.family });
});

app.get('/api/notes', (req, res) => {
  res.json(db.getAllNotes());
});

app.post('/api/notes', (req, res) => {
  const { content, author } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
  if (!author || !family.has(author)) return res.status(400).json({ error: 'Valid author required' });
  const note = db.createNote(content.trim(), author);
  broadcast();
  res.status(201).json(note);
});

app.put('/api/notes/:id', (req, res) => {
  const { content, author } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
  if (!author || !family.has(author)) return res.status(400).json({ error: 'Valid author required' });
  const existing = db.getNote(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.author !== author) return res.status(403).json({ error: 'Not your note' });
  const note = db.updateNote(Number(req.params.id), content.trim());
  broadcast();
  res.json(note);
});

app.patch('/api/notes/:id/position', (req, res) => {
  const { author, x, y } = req.body;
  if (!author || !family.has(author)) return res.status(400).json({ error: 'Valid author required' });
  if (typeof x !== 'number' || typeof y !== 'number') return res.status(400).json({ error: 'x and y must be numbers' });
  const existing = db.getNote(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const note = db.updateNotePosition(Number(req.params.id), x, y);
  broadcast();
  res.json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  const author = req.query.author;
  if (!author || !family.has(author)) return res.status(400).json({ error: 'Valid author required' });
  const existing = db.getNote(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.author !== author) return res.status(403).json({ error: 'Not your note' });
  db.deleteNote(Number(req.params.id));
  broadcast();
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Family Whiteboard running at http://localhost:${PORT}`));
