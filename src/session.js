// Demo sign-in session, kept in this browser so a refresh doesn't sign you out.
// Cleared by Log out and by "Reset all demo data" (which removes every hearth-* key).
const KEY = 'hearth-session';

export function loadSession() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveSession(user) {
  try { if (user) localStorage.setItem(KEY, JSON.stringify(user)); else localStorage.removeItem(KEY); } catch { /* ignore */ }
}
