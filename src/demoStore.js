// Demo simulator settings: force outcomes of the mocked backend checks.
import { useSyncExternalStore } from 'react';

export const DEMO_DEFAULTS = { scan: 'auto', compat: 'auto', wifi: 'auto', tac: 'auto', telco: 'auto', eligibility: 'auto', processing: 'auto' };
let settings = { ...DEMO_DEFAULTS };
const listeners = new Set();

export const setDemo = (patch) => { settings = { ...settings, ...patch }; listeners.forEach((l) => l()); };
export const resetDemo = () => setDemo(DEMO_DEFAULTS);
export const useDemo = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => settings);

export const DEMO_CONTROLS = [
  { key: 'scan', label: 'QR scan', options: [
    ['auto', 'Use the QR code I pick'],
    ['unreadable', "Fail: can't read QR code"],
  ] },
  { key: 'compat', label: 'Compatibility check', options: [
    ['auto', 'Use the QR code / serial I pick'],
    ['pass', 'Pass'],
    ['incompatible', 'Fail: device not compatible'],
    ['registered', 'Fail: device already registered'],
  ] },
  { key: 'wifi', label: 'Wi-Fi connection', options: [
    ['auto', 'Use the network / password I pick'],
    ['ok', 'Pass'],
    ['wrong_password', 'Fail: wrong password'],
    ['weak_signal', 'Fail: signal too weak'],
    ['no_internet', 'Fail: camera offline (no internet)'],
  ] },
  { key: 'tac', label: 'TAC verification', options: [
    ['auto', 'Use the TAC I type'],
    ['ok', 'Pass'],
    ['wrong', 'Fail: incorrect TAC'],
    ['expired', 'Fail: TAC expired'],
    ['locked', 'Fail: too many attempts (locked)'],
  ] },
  { key: 'telco', label: 'Telco account check (after TAC)', options: [
    ['auto', 'Use the mobile number I type'],
    ['ok', 'Pass: Charge to Bill offered'],
    ['spend_limit', 'Fail: spend limit reached'],
    ['inactive', 'Fail: account inactive'],
  ] },
  { key: 'eligibility', label: 'Billing eligibility check (at Confirm)', options: [
    ['auto', 'Use the number / payment option I pick'],
    ['ok', 'Pass'],
    ['spend_limit', 'Fail: telco spend limit reached'],
    ['inactive', 'Fail: telco account inactive'],
    ['card_invalid', 'Fail: card declined'],
    ['card_expired', 'Fail: card expired'],
    ['timeout_once', 'Error: timeout on 1st try, then pass'],
    ['timeout', 'Error: timeout every time'],
  ] },
  { key: 'processing', label: 'Processing (after payment / agreement)', options: [
    ['auto', 'Pass'],
    ['device_fail_once', 'Fail: device registration (1st try)'],
    ['sub_fail_once', 'Fail: subscription activation/update (1st try)'],
    ['sub_fail_always', 'Fail: subscription activation/update (every try)'],
  ] },
];

// Demo inputs already tried. Kept in this browser until Log out or "Reset all demo data"
// (both clear the hearth-tried key), so a refresh doesn't lose them.
const TRIED_KEY = 'hearth-tried';
const tried = new Set((() => { try { return JSON.parse(localStorage.getItem(TRIED_KEY)) ?? []; } catch { return []; } })());
const triedListeners = new Set();
let triedVersion = 0;
const saveTried = () => { try { localStorage.setItem(TRIED_KEY, JSON.stringify([...tried])); } catch { /* ignore */ } };
const notifyTried = () => { triedVersion += 1; triedListeners.forEach((l) => l()); };
export const markTried = (key) => { if (!tried.has(key)) { tried.add(key); saveTried(); notifyTried(); } };
export const clearTried = () => { tried.clear(); try { localStorage.removeItem(TRIED_KEY); } catch { /* ignore */ } notifyTried(); };
export const useTried = () => {
  useSyncExternalStore((l) => { triedListeners.add(l); return () => triedListeners.delete(l); }, () => triedVersion);
  return (key) => tried.has(key);
};
