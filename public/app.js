(function () {
  const notesList = document.getElementById('notes-list');
  const newNoteInput = document.getElementById('new-note-input');
  const addBtn = document.getElementById('add-btn');
  const nameModal = document.getElementById('name-modal');
  const nameOptions = document.getElementById('name-options');
  const userGreeting = document.getElementById('user-greeting');
  const switchBtn = document.getElementById('switch-btn');

  let currentUser = null;
  let isDragging = false;
  let pendingRerender = false;

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDate(iso) {
    return new Date(iso + 'Z').toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  async function showNamePicker() {
    const res = await fetch('/api/config');
    const { family } = await res.json();

    nameOptions.innerHTML = '';
    family.forEach(name => {
      const btn = document.createElement('button');
      btn.className = 'name-btn';
      btn.textContent = name;
      btn.addEventListener('click', () => selectUser(name));
      nameOptions.appendChild(btn);
    });

    nameModal.classList.remove('hidden');
  }

  function selectUser(name) {
    localStorage.setItem('author', name);
    currentUser = name;
    nameModal.classList.add('hidden');
    userGreeting.textContent = `Hi, ${name}`;
    loadAndRender();
  }

  function renderNotes(notes) {
    if (isDragging) { pendingRerender = true; return; }
    pendingRerender = false;

    if (notes.length === 0) {
      notesList.innerHTML = '<p class="empty-state">No notes yet. Add one above.</p>';
      return;
    }

    notesList.innerHTML = notes.map(n => {
      const isOwn = n.author === currentUser;
      const actions = isOwn
        ? `<div class="note-actions">
             <button class="btn-edit" data-id="${n.id}">Edit</button>
             <button class="btn-delete" data-id="${n.id}">Delete</button>
           </div>`
        : '';
      return `
        <div class="note-card" data-id="${n.id}">
          <div class="note-author">${escapeHtml(n.author)}</div>
          <div class="note-body">${escapeHtml(n.content)}</div>
          ${actions}
          <div class="note-meta">Added ${formatDate(n.created_at)}${n.updated_at !== n.created_at ? ' · Edited ' + formatDate(n.updated_at) : ''}</div>
        </div>
      `;
    }).join('');

    notesList.querySelectorAll('.note-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 40}ms`;
      const note = notes[i];
      if (note.pos_x != null && note.pos_y != null) {
        card.style.left = note.pos_x + 'px';
        card.style.top  = note.pos_y + 'px';
      } else {
        const col = i % 2;
        const row = Math.floor(i / 2);
        card.style.left = (col * 280 + 20) + 'px';
        card.style.top  = (row * 200 + 20) + 'px';
      }
      attachDragHandlers(card, note);
    });

    notesList.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => startEdit(btn.closest('.note-card')));
    });
    notesList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteNote(btn.closest('.note-card')));
    });
  }

  function attachDragHandlers(card, note) {
    card.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('textarea')) return;
      e.preventDefault();
      isDragging = true;
      card.classList.add('is-dragging');

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = parseInt(card.style.left, 10) || 0;
      const startTop  = parseInt(card.style.top,  10) || 0;

      function onMove(e) {
        card.style.left = (startLeft + e.clientX - startX) + 'px';
        card.style.top  = (startTop  + e.clientY - startY) + 'px';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
        card.classList.remove('is-dragging');
        isDragging = false;

        fetch(`/api/notes/${note.id}/position`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: currentUser,
            x: parseInt(card.style.left, 10),
            y: parseInt(card.style.top,  10),
          }),
        });

        if (pendingRerender) loadAndRender();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  async function loadAndRender() {
    if (isDragging) { pendingRerender = true; return; }
    const res = await fetch('/api/notes');
    renderNotes(await res.json());
  }

  function startEdit(card) {
    const body = card.querySelector('.note-body');
    const actions = card.querySelector('.note-actions');
    const currentText = body.textContent;

    const ta = document.createElement('textarea');
    ta.className = 'note-edit-area';
    ta.value = currentText;
    ta.rows = Math.max(3, currentText.split('\n').length);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';

    body.replaceWith(ta);
    actions.innerHTML = '';
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    ta.focus();

    saveBtn.addEventListener('click', async () => {
      const content = ta.value.trim();
      if (!content) return;
      await fetch(`/api/notes/${card.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author: currentUser }),
      });
    });

    cancelBtn.addEventListener('click', loadAndRender);
  }

  async function deleteNote(card) {
    if (!confirm('Delete this note?')) return;
    card.classList.add('is-deleting');
    await fetch(`/api/notes/${card.dataset.id}?author=${encodeURIComponent(currentUser)}`, {
      method: 'DELETE',
    });
  }

  addBtn.addEventListener('click', async () => {
    const content = newNoteInput.value.trim();
    if (!content) return;
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author: currentUser }),
    });
    newNoteInput.value = '';
  });

  newNoteInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addBtn.click();
  });

  switchBtn.addEventListener('click', () => {
    localStorage.removeItem('author');
    currentUser = null;
    showNamePicker();
  });

  function connectWS() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}`);
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === 'notes_updated') loadAndRender();
    };
    ws.onclose = () => setTimeout(connectWS, 2000);
  }

  // Init
  const saved = localStorage.getItem('author');
  if (saved) {
    currentUser = saved;
    userGreeting.textContent = `Hi, ${saved}`;
    loadAndRender();
  } else {
    showNamePicker();
  }
  connectWS();
})();
