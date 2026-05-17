# Frontend & Styling

## Theme

"Cyber Whiteboard" dark theme — glassmorphism cards, neon cyan/violet accents, CSS-only dot-grid background, sticky frosted-glass header with shimmer animation, card entry/exit animations. No CSS framework or build step.

All design tokens are CSS custom properties in `:root` at the top of `style.css`.

## Fonts

Loaded from Google Fonts: `Inter` (UI chrome) and 14 selectable note fonts across three categories (Handwriting, Futuristic, Monospace). The active note font is controlled by the `--font-note` CSS custom property; changing it via JS updates all note text instantly.

## Admin Settings Pattern

Both admin display settings (font, shape) follow the same pattern:

1. Data structure in `app.js` defines the options
2. `applyX(value)` sets a CSS custom property or `document.body.dataset.*`, saves to `localStorage`, re-renders the picker
3. `renderXOptions()` reads `localStorage` for current state, builds picker UI with `--active` class on the current choice
4. Initialization at page load reads `localStorage` and applies before first render

## Note Font

- CSS custom property: `--font-note` on `:root`
- `localStorage` key: `noteFont`
- Applied to: `.note-body`, `.note-edit-area`, `#new-note-input`
- Data: `FONT_GROUPS` array in `app.js`

## Note Shape

- Body data attribute: `document.body.dataset.noteStyle` (`uniform` | `scattered` | `crystalline` | `warped`)
- `localStorage` key: `noteStyle`
- Per-card variant: `data-note-variant="${n.id % 4}"` (0–3) stamped on each `.note-card` at render time — deterministic from DB ID
- CSS selectors: `[data-note-style="X"] .note-card[data-note-variant="Y"]` (specificity 0,3,0)
- `.note-card.is-dragging` uses `transform: ... !important` to always win over variant selectors

### Style Details

| Style | Mechanism |
|-------|-----------|
| Uniform | No overrides — default `border-radius: var(--radius-md)` |
| Scattered | Per-variant `rotate()` transforms; hover reduces rotation toward 0 |
| Crystalline | `clip-path` polygons with chamfered corners; `filter: drop-shadow()` replaces `box-shadow` (which clip-path would otherwise clip); accent bar `::before` shifts to `top: 20px` to clear the cuts |
| Warped | Asymmetric four-value `border-radius` + micro-rotation per variant |
