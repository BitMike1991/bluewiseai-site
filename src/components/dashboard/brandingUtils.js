// src/components/dashboard/brandingUtils.js
// Single source of truth for branding-derived styles.
// All dynamic colors flow through here — never hardcode in pages.

export function getBrandingStyles(branding) {
  const b = branding || {};
  const surface = b.surface_color || '#111119';
  const border = b.border_color || '#1e1e2e';
  const primary = b.primary_color || '#6c63ff';
  const accent = b.accent_color || '#00d4aa';
  const textP = b.text_primary || '#f0f0f5';
  const textS = b.text_secondary || '#8888aa';
  const dashBg = b.dashboard_bg || '#0a0a12';

  return {
    card: { backgroundColor: surface, borderColor: border },
    input: { backgroundColor: surface + '99', borderColor: border, color: textP },
    button: { backgroundColor: primary, color: '#ffffff' },
    text: { primary: textP, secondary: textS },
    colors: { surface, border, primary, accent, textP, textS, dashBg },
  };
}

export function getStatusBadgeStyle(status) {
  const map = {
    new:           { bg: 'rgba(56,189,248,0.15)',  text: '#7dd3fc', border: 'rgba(56,189,248,0.4)' },
    contacted:     { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.4)' },
    qualified:     { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', border: 'rgba(245,158,11,0.4)' },
    active:        { bg: 'rgba(56,189,248,0.15)',  text: '#7dd3fc', border: 'rgba(56,189,248,0.4)' },
    in_convo:      { bg: 'rgba(56,189,248,0.15)',  text: '#7dd3fc', border: 'rgba(56,189,248,0.4)' },
    won:           { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.4)' },
    lost:          { bg: 'rgba(244,63,94,0.1)',    text: '#fda4af', border: 'rgba(244,63,94,0.4)' },
    dead:          { bg: 'rgba(244,63,94,0.1)',    text: '#fda4af', border: 'rgba(244,63,94,0.4)' },
    draft:         { bg: 'rgba(100,116,139,0.2)',  text: '#e2e8f0', border: 'rgba(100,116,139,0.4)' },
    quote_sent:    { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.4)' },
    contract_sent: { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', border: 'rgba(245,158,11,0.4)' },
    signed:        { bg: 'rgba(56,189,248,0.15)',  text: '#7dd3fc', border: 'rgba(56,189,248,0.4)' },
    scheduled:     { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.4)' },
    in_progress:   { bg: 'rgba(249,115,22,0.15)',  text: '#fdba74', border: 'rgba(249,115,22,0.4)' },
    completed:     { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.4)' },
    cancelled:     { bg: 'rgba(244,63,94,0.1)',    text: '#fda4af', border: 'rgba(244,63,94,0.4)' },
    quoted:        { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', border: 'rgba(245,158,11,0.4)' },
  };
  const s = map[status] || map.draft;
  return {
    backgroundColor: s.bg, color: s.text, borderColor: s.border,
    border: '1px solid', borderRadius: '9999px',
    padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500,
    display: 'inline-block',
  };
}
