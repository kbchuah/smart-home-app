// Wipes everything the demo saved in this browser (all homes, TAC locks) and reloads,
// which also clears in-memory state (sign-in, "Tried" marks, simulator settings).
export function resetAllDemoData() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('hearth-')).forEach((k) => localStorage.removeItem(k));
  } catch { /* storage unavailable: reload still clears memory */ }
  window.location.reload();
}

export function confirmResetAll() {
  if (window.confirm('Reset all demo data?\n\nAll homes go back to their original devices and rooms, homes you created are removed, any TAC lock is cleared, and you will be signed out and returned to the marketing page.')) {
    resetAllDemoData();
  }
}
