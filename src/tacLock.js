// Account-level TAC lock: after too many incorrect TACs, no TAC can be requested or
// entered for ANY mobile number on this account until the lock ends. Survives
// leaving the flow and page reloads (localStorage), so restarting doesn't bypass it.
import { useEffect, useState, useSyncExternalStore } from 'react';

const KEY = (account) => `hearth-tac-lock-${account}`;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

function read(account) {
  try { return Number(localStorage.getItem(KEY(account))) || 0; } catch { return memory[account] ?? 0; }
}
const memory = {};

export function lockTac(account, minutes) {
  const until = Date.now() + minutes * 60 * 1000;
  memory[account] = until;
  try { localStorage.setItem(KEY(account), String(until)); } catch { /* memory fallback */ }
  notify();
}

export function clearAllTacLocks() {
  Object.keys(memory).forEach((k) => delete memory[k]);
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('hearth-tac-lock-')).forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
  notify();
}

export function anyTacLock() {
  try { return Object.keys(localStorage).some((k) => k.startsWith('hearth-tac-lock-') && Number(localStorage.getItem(k)) > Date.now()); }
  catch { return Object.values(memory).some((u) => u > Date.now()); }
}

// Returns minutes left (0 = not locked). Re-renders on lock changes and every 15s.
export function useTacLock(account) {
  const version = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => read(account));
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 15000); return () => clearInterval(t); }, []);
  const left = version - Date.now();
  return left > 0 ? Math.ceil(left / 60000) : 0;
}

export function useAnyTacLock() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, anyTacLock);
}
