(function () {
  const notesList = document.getElementById('notes-list');
  const newNoteInput = document.getElementById('new-note-input');
  const addBtn = document.getElementById('add-btn');
  const nameModal = document.getElementById('name-modal');
  const nameOptions = document.getElementById('name-options');
  const userGreeting = document.getElementById('user-greeting');
  const switchBtn = document.getElementById('switch-btn');
  const adminBtn = document.getElementById('admin-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminCloseBtn = document.getElementById('admin-close-btn');
  const clearBoardBtn = document.getElementById('clear-board-btn');
  const fontOptionsEl = document.getElementById('font-options');
  const styleOptionsEl = document.getElementById('style-options');

  let currentUser = null;
  let isDragging = false;
  let pendingRerender = false;
  let adminList = [];

  const NOTE_STYLES = [
    {
      id: 'uniform',
      label: 'Uniform',
      previewSvg: `<svg viewBox="0 0 44 30" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="40" height="26" rx="4" stroke="currentColor" stroke-width="1.5"/></svg>`,
    },
    {
      id: 'scattered',
      label: 'Scattered',
      previewSvg: `<svg viewBox="0 0 44 30" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="36" height="22" rx="3" stroke="currentColor" stroke-width="1.5" transform="rotate(-3 22 15)"/></svg>`,
    },
    {
      id: 'crystalline',
      label: 'Crystalline',
      previewSvg: `<svg viewBox="0 0 44 30" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="2,2 34,2 42,10 42,28 2,28" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`,
    },
    {
      id: 'warped',
      label: 'Warped',
      previewSvg: `<svg viewBox="0 0 44 30" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="40" height="24" rx="10" ry="4" stroke="currentColor" stroke-width="1.5" transform="rotate(1 22 15)"/></svg>`,
    },
  ];

  const FONT_GROUPS = [
    {
      group: 'Handwriting',
      fonts: [
        { label: 'Caveat',            family: 'Caveat' },
        { label: 'Patrick Hand',      family: 'Patrick Hand' },
        { label: 'Indie Flower',      family: 'Indie Flower' },
        { label: 'Kalam',             family: 'Kalam' },
        { label: 'Permanent Marker',  family: 'Permanent Marker' },
        { label: 'Dancing Script',    family: 'Dancing Script' },
        { label: 'Gloria Hallelujah', family: 'Gloria Hallelujah' },
      ],
    },
    {
      group: 'Futuristic',
      fonts: [
        { label: 'Orbitron',   family: 'Orbitron' },
        { label: 'Exo 2',      family: 'Exo 2' },
        { label: 'Rajdhani',   family: 'Rajdhani' },
        { label: 'Share Tech', family: 'Share Tech' },
      ],
    },
    {
      group: 'Monospace',
      fonts: [
        { label: 'JetBrains Mono', family: 'JetBrains Mono' },
        { label: 'Space Mono',     family: 'Space Mono' },
        { label: 'Fira Code',      family: 'Fira Code' },
      ],
    },
  ];

  function applyFont(family) {
    document.documentElement.style.setProperty('--font-note', `'${family}', cursive`);
    localStorage.setItem('noteFont', family);
    renderFontOptions();
  }

  function renderFontOptions() {
    const current = localStorage.getItem('noteFont') || 'Caveat';
    fontOptionsEl.innerHTML = '';
    FONT_GROUPS.forEach(({ group, fonts }) => {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'font-group-label';
      groupLabel.textContent = group;
      fontOptionsEl.appendChild(groupLabel);

      const grid = document.createElement('div');
      grid.className = 'font-grid';
      fonts.forEach(({ label, family }) => {
        const btn = document.createElement('button');
        btn.className = 'font-card' + (family === current ? ' font-card--active' : '');
        btn.style.fontFamily = `'${family}', cursive`;
        btn.innerHTML = `<span class="font-card-name">${escapeHtml(label)}</span><span class="font-card-sample">Hello!</span>`;
        btn.addEventListener('click', () => applyFont(family));
        grid.appendChild(btn);
      });
      fontOptionsEl.appendChild(grid);
    });
  }

  function applyNoteStyle(styleId) {
    document.body.dataset.noteStyle = styleId;
    localStorage.setItem('noteStyle', styleId);
    renderStyleOptions();
  }

  function renderStyleOptions() {
    const current = localStorage.getItem('noteStyle') || 'uniform';
    styleOptionsEl.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'style-grid';
    NOTE_STYLES.forEach(({ id, label, previewSvg }) => {
      const btn = document.createElement('button');
      btn.className = 'style-card' + (id === current ? ' style-card--active' : '');
      btn.innerHTML = previewSvg + `<span>${escapeHtml(label)}</span>`;
      btn.addEventListener('click', () => applyNoteStyle(id));
      grid.appendChild(btn);
    });
    styleOptionsEl.appendChild(grid);
  }

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
    const { family, admins } = await res.json();
    adminList = admins || [];

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
    if (adminList.includes(name)) adminBtn.classList.remove('hidden');
    else adminBtn.classList.add('hidden');
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
             <button class="btn-edit btn-icon" data-id="${n.id}" title="Edit">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
             </button>
             <button class="btn-delete btn-icon" data-id="${n.id}" title="Delete">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
             </button>
           </div>`
        : '';
      return `
        <div class="note-card" data-id="${n.id}" data-note-variant="${n.id % 4}">
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
    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('textarea')) return;
      e.preventDefault();
      card.setPointerCapture(e.pointerId);
      isDragging = true;
      card.classList.add('is-dragging');

      const startX    = e.clientX;
      const startY    = e.clientY;
      const startLeft = parseInt(card.style.left, 10) || 0;
      const startTop  = parseInt(card.style.top,  10) || 0;

      function onMove(e) {
        card.style.left = (startLeft + e.clientX - startX) + 'px';
        card.style.top  = (startTop  + e.clientY - startY) + 'px';
      }
      function onUp() {
        card.removeEventListener('pointermove',   onMove);
        card.removeEventListener('pointerup',     onUp);
        card.removeEventListener('pointercancel', onUp);
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
      card.addEventListener('pointermove',   onMove);
      card.addEventListener('pointerup',     onUp);
      card.addEventListener('pointercancel', onUp);
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
    actions.classList.add('is-editing');
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
      loadAndRender();
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
    loadAndRender();
  });

  newNoteInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addBtn.click();
  });

  switchBtn.addEventListener('click', () => {
    localStorage.removeItem('author');
    currentUser = null;
    adminBtn.classList.add('hidden');
    showNamePicker();
  });

  adminBtn.addEventListener('click', () => {
    renderFontOptions();
    renderStyleOptions();
    adminModal.classList.remove('hidden');
  });

  adminCloseBtn.addEventListener('click', () => adminModal.classList.add('hidden'));

  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) adminModal.classList.add('hidden');
  });

  clearBoardBtn.addEventListener('click', async () => {
    if (!confirm('Clear ALL notes from the whiteboard? This cannot be undone.')) return;
    await fetch(`/api/notes?admin=${encodeURIComponent(currentUser)}`, { method: 'DELETE' });
    adminModal.classList.add('hidden');
  });

  function connectWS() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}`);
    ws.onopen = () => loadAndRender();
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === 'notes_updated') loadAndRender();
    };
    ws.onclose = () => setTimeout(connectWS, 2000);
  }

  // Init
  const savedFont = localStorage.getItem('noteFont');
  if (savedFont) document.documentElement.style.setProperty('--font-note', `'${savedFont}', cursive`);
  document.body.dataset.noteStyle = localStorage.getItem('noteStyle') || 'uniform';

  const saved = localStorage.getItem('author');
  if (saved) {
    currentUser = saved;
    userGreeting.textContent = `Hi, ${saved}`;
    fetch('/api/config').then(r => r.json()).then(({ admins }) => {
      adminList = admins || [];
      if (adminList.includes(saved)) adminBtn.classList.remove('hidden');
    });
    loadAndRender();
  } else {
    showNamePicker();
  }
  connectWS();
})();
