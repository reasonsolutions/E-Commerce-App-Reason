// icons.jsx — lucide-style stroke icons + product "glyph" silhouettes.
// All take {size, color, stroke} optionally. Stroke icons default to currentColor.
// Glyph icons (shoe/watch/tee/etc) are filled silhouettes used inside product
// placeholder tiles — deliberately abstract, not pretending to be product photos.

const I = ({ d, size = 20, fill = 'none', stroke = 'currentColor', sw = 1.6, vb = '0 0 24 24', children }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

// ── UI icons ───────────────────────────────────────────────────
const Icon = {
  Back:    (p) => <I {...p} d="M15 18l-6-6 6-6" />,
  Close:   (p) => <I {...p} d="M18 6L6 18M6 6l12 12" />,
  Search:  (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></I>,
  Camera:  (p) => <I {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></I>,
  Bag:     (p) => <I {...p}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></I>,
  Cart:    (p) => <I {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/></I>,
  Heart:   (p) => <I {...p} d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 22l7.8-8.5 1-1.1a5.5 5.5 0 000-7.8z"/>,
  HeartFill:(p) => <I {...p} fill="currentColor" stroke="none" d="M12 21.4l-1.1-1A29.5 29.5 0 014 13.7a6 6 0 018-8.8 6 6 0 018 8.8 29.5 29.5 0 01-6.9 6.7z"/>,
  Home:    (p) => <I {...p}><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/></I>,
  HomeFill:(p) => <I {...p} fill="currentColor" stroke="currentColor"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z"/></I>,
  Box:     (p) => <I {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></I>,
  User:    (p) => <I {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></I>,
  Menu:    (p) => <I {...p}><path d="M3 6h18M3 12h18M3 18h18"/></I>,
  Filter:  (p) => <I {...p} d="M3 5h18M6 12h12M10 19h4"/>,
  Sort:    (p) => <I {...p}><path d="M3 6h13M3 12h9M3 18h5"/><path d="M17 4v16l4-4"/></I>,
  Plus:    (p) => <I {...p} d="M12 5v14M5 12h14"/>,
  Minus:   (p) => <I {...p} d="M5 12h14"/>,
  Trash:   (p) => <I {...p}><path d="M3 6h18"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></I>,
  Star:    (p) => <I {...p} fill="currentColor" stroke="none" d="M12 2l3.1 6.3 7 1-5 4.9 1.2 7L12 17.8 5.7 21.2l1.2-7-5-4.9 7-1z"/>,
  StarO:   (p) => <I {...p} d="M12 2l3.1 6.3 7 1-5 4.9 1.2 7L12 17.8 5.7 21.2l1.2-7-5-4.9 7-1z"/>,
  Check:   (p) => <I {...p} d="M5 13l4 4L19 7"/>,
  ChevR:   (p) => <I {...p} d="M9 6l6 6-6 6"/>,
  ChevD:   (p) => <I {...p} d="M6 9l6 6 6-6"/>,
  Lock:    (p) => <I {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></I>,
  Mail:    (p) => <I {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></I>,
  Eye:     (p) => <I {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></I>,
  AlertC:  (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.1"/></I>,
  AlertT:  (p) => <I {...p}><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18.5v.1"/></I>,
  Truck:   (p) => <I {...p}><rect x="1" y="6" width="14" height="10" rx="1"/><path d="M15 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></I>,
  Refresh: (p) => <I {...p}><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/><path d="M3.5 9a9 9 0 0114.8-3.4L21 9M21 15a9 9 0 01-14.8 3.4L3 15"/></I>,
  Wifi:    (p) => <I {...p}><path d="M5 12.5a10 10 0 0114 0"/><path d="M8.5 16a5 5 0 017 0"/><circle cx="12" cy="19.5" r="1"/></I>,
  Pin:     (p) => <I {...p}><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></I>,
  Help:    (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4"/><path d="M12 18v.1"/></I>,
  Tag:     (p) => <I {...p}><path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></I>,
  Logout:  (p) => <I {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></I>,
  Settings:(p) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.4 1.8l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.8-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.4-1.8 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.8.4h.1a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.4l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.4 1.8v.1a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></I>,
  Card:    (p) => <I {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></I>,
};

// ── Product glyph silhouettes ─────────────────────────────────
// Render filled black/dark silhouettes for product placeholder tiles.
// They are abstract — meant to read as "a shoe" not "this specific shoe".
const Glyph = {
  shoe:   <svg viewBox="0 0 64 40" width="100%" height="100%"><path d="M4 28c0-4 4-6 8-6h6l3-5 4 3 8-2 6 4 12 2c7 1 9 5 9 8v3H4z" fill="currentColor"/><path d="M4 35h54" stroke="currentColor" strokeWidth="0.6" fill="none" opacity=".3"/></svg>,
  watch:  <svg viewBox="0 0 48 64" width="100%" height="100%"><rect x="14" y="2" width="20" height="6" fill="currentColor" rx="2"/><rect x="14" y="56" width="20" height="6" fill="currentColor" rx="2"/><circle cx="24" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M24 22v10l6 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>,
  tee:    <svg viewBox="0 0 64 56" width="100%" height="100%"><path d="M16 4l8 4 8-4 8 4 16 8-6 8-6-3v27H14V21l-6 3-6-8z" fill="currentColor"/></svg>,
  bag:    <svg viewBox="0 0 56 64" width="100%" height="100%"><path d="M16 18v-4a12 12 0 0124 0v4" stroke="currentColor" strokeWidth="3" fill="none"/><path d="M6 18h44l-4 42H10z" fill="currentColor"/></svg>,
  phones: <svg viewBox="0 0 64 56" width="100%" height="100%"><path d="M8 32a24 24 0 0148 0v14a4 4 0 01-4 4h-6V32" stroke="currentColor" strokeWidth="3" fill="none"/><path d="M8 32v14a4 4 0 004 4h6V32" stroke="currentColor" strokeWidth="3" fill="none"/><rect x="6" y="32" width="14" height="20" rx="3" fill="currentColor"/><rect x="44" y="32" width="14" height="20" rx="3" fill="currentColor"/></svg>,
  phone:  <svg viewBox="0 0 40 64" width="100%" height="100%"><rect x="4" y="2" width="32" height="60" rx="6" fill="currentColor"/><rect x="8" y="8" width="24" height="44" rx="2" fill="#fff" opacity=".15"/></svg>,
  lamp:   <svg viewBox="0 0 56 64" width="100%" height="100%"><path d="M28 4l14 18H14z" fill="currentColor"/><path d="M28 22v32" stroke="currentColor" strokeWidth="3"/><path d="M16 60h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>,
  ball:   <svg viewBox="0 0 56 56" width="100%" height="100%"><circle cx="28" cy="28" r="24" fill="currentColor"/><path d="M28 4v48M4 28h48M10 12l36 32M46 12L10 44" stroke="#fff" strokeWidth="1.4" opacity=".25"/></svg>,
  drop:   <svg viewBox="0 0 48 64" width="100%" height="100%"><path d="M24 4c-12 16-16 22-16 30a16 16 0 0032 0c0-8-4-14-16-30z" fill="currentColor"/></svg>,
  tube:   <svg viewBox="0 0 36 64" width="100%" height="100%"><path d="M6 2h24v6L24 14v44a4 4 0 01-4 4h-4a4 4 0 01-4-4V14L6 8z" fill="currentColor"/></svg>,
  pants:  <svg viewBox="0 0 48 64" width="100%" height="100%"><path d="M6 2h36l-2 14-2 46h-12l-2-32-2 32H10L8 16z" fill="currentColor"/></svg>,
  suit:   <svg viewBox="0 0 56 64" width="100%" height="100%"><path d="M20 4l8 8 8-8 16 8-4 22-4 30H12L8 34 4 12z" fill="currentColor"/><path d="M28 12v40" stroke="#fff" strokeWidth="1.4" opacity=".25"/></svg>,
  slide:  <svg viewBox="0 0 64 40" width="100%" height="100%"><path d="M8 24c0-6 8-8 14-8h28c4 0 6 4 6 8s-2 8-8 8H14c-4 0-6-4-6-8z" fill="currentColor"/></svg>,
};

window.Icon = Icon;
window.Glyph = Glyph;
