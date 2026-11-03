// Simulated backend for the first-pairing flow. Every outcome here is mock data.
import { PLAN } from './plans.js';

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- QR codes the user can "scan" ----
// result: 'unreadable' fails at scan; others go to the compatibility check.
// brand: 'Nest' (Google's own) or '3P' (third-party, Google Home enabled / Matter). Brand names for 3P are fictional.
export const QR_CODES = [
  { id: 'qr1', brand: 'Nest', label: 'Nest Cam (indoor, wired)', hint: 'Passes', serial: 'NC-IW-48213', model: 'Nest Cam (indoor, wired)', compatible: true },
  { id: 'qr2', brand: 'Nest', label: 'Nest Cam (battery)', hint: 'Passes', serial: 'NC-BT-90377', model: 'Nest Cam (battery)', compatible: true },
  { id: 'qr6', brand: '3P', label: 'Aero Cam 2K', hint: 'Passes · Works with Google Home', serial: '3P-AERO-20415', model: 'Aero Cam 2K', compatible: true },
  { id: 'qr7', brand: '3P', label: 'Kova Outdoor Cam', hint: 'Passes · Matter-certified', serial: '3P-KOVA-77120', model: 'Kova Outdoor Cam', compatible: true },
  { id: 'qr3', brand: '3P', label: 'XView IP Camera', hint: 'Fails compatibility · not Google Home enabled', serial: 'IPC-7781-X', model: 'XView IP Camera 2K',
    compatible: false, reason: "This camera isn't Google Home enabled, so it can't be added to Google Home Premium. Look for “Works with Google Home” or Matter on the box." },
  { id: 'qr4', brand: 'Nest', label: 'Nest Cam (registered elsewhere)', hint: 'Fails compatibility · already registered', serial: 'NC-IW-11002', model: 'Nest Cam (indoor, wired)',
    compatible: false, reason: 'This camera is already registered to another account. Ask the owner to remove it first.' },
  { id: 'qr5', label: 'Damaged QR sticker', hint: 'Fails scan', unreadable: true },
];

// Serial numbers accepted in "Key in serial number". Anything else is unknown.
const COMPAT_REASONS = {
  incompatible: "This camera isn't Google Home enabled, so it can't be added to Google Home Premium.",
  registered: 'This camera is already registered to another account. Ask the owner to remove it first.',
};
export async function checkCompatibility({ serial, qr, override = 'auto' }) {
  await wait(1400);
  if (override !== 'auto') {
    if (override !== 'pass') return { ok: false, reason: COMPAT_REASONS[override] };
    const src = qr && !qr.unreadable ? qr : null;
    return { ok: true, device: { serial: src?.serial ?? (serial?.trim().toUpperCase() || 'NC-IW-00001'), model: src?.model ?? 'Nest Cam', brand: src?.brand ?? 'Nest' } };
  }
  if (qr) return qr.compatible ? { ok: true, device: { serial: qr.serial, model: qr.model, brand: qr.brand } } : { ok: false, reason: qr.reason };
  const s = serial.trim().toUpperCase();
  const known = QR_CODES.find((q) => q.serial === s);
  if (known) return known.compatible ? { ok: true, device: { serial: known.serial, model: known.model, brand: known.brand } } : { ok: false, reason: known.reason };
  if (/^NC-[A-Z]{2}-\d{5}$/.test(s)) return { ok: true, device: { serial: s, model: 'Nest Cam', brand: 'Nest' } };
  if (/^3P-[A-Z]{3,5}-\d{5}$/.test(s)) return { ok: true, device: { serial: s, model: 'Google Home enabled camera', brand: '3P' } };
  return { ok: false, reason: "We couldn't find a compatible camera with that serial number. Check the number and try again." };
}

// ---- Wi-Fi: camera joins the network and must come online before we bill ----
export const WIFI_NETWORKS = [
  { ssid: 'unifi-home-5G', icon: 'wifi', hint: 'Passes', result: 'ok' },
  { ssid: 'unifi-home-2.4G', icon: 'wifi', hint: 'Passes', result: 'ok' },
  { ssid: 'TIME-Fibre-8821', icon: 'wifi_2_bar', hint: 'Connects, but no internet', result: 'no_internet' },
  { ssid: 'Neighbour_Guest', icon: 'wifi_1_bar', hint: 'Signal too weak', result: 'weak_signal' },
];
export const WIFI_FAILURES = {
  wrong_password: { title: 'Wrong Wi-Fi password', message: "The camera couldn't join the network with that password. Check the password and try again.", actions: ['password', 'network'] },
  weak_signal: { title: 'Wi-Fi signal too weak', message: 'The camera is too far from your router. Move it closer, or choose another network.', actions: ['retry', 'network'] },
  no_internet: { title: 'Camera is offline', message: "The camera joined the network but can't reach the internet. Check your router, then try again.", actions: ['retry', 'network'] },
};
// Demo rule: passwords shorter than 8 characters are "wrong".
export async function connectWifi({ ssid, password, override = 'auto' }) {
  await wait(1500);
  const net = WIFI_NETWORKS.find((n) => n.ssid === ssid);
  const code = override !== 'auto' ? override : password.length < 8 ? 'wrong_password' : net?.result ?? 'ok';
  return code === 'ok' ? { ok: true } : { ok: false, code, ...WIFI_FAILURES[code] };
}

// ---- Pricing business rule ----
// Base price covers up to PLAN.devices devices per home; each extra device adds EXTRA_DEVICE_PRICE.
export const EXTRA_DEVICE_PRICE = 15;
export async function quotePrice({ structureDeviceCount }) {
  await wait(1000);
  const after = structureDeviceCount + 1;
  const extra = Math.max(0, after - PLAN.devices);
  return {
    currentDevices: structureDeviceCount,
    devicesAfter: after,
    included: PLAN.devices,
    base: PLAN.price,
    extraDevices: extra,
    extraEach: EXTRA_DEVICE_PRICE,
    total: PLAN.price + extra * EXTRA_DEVICE_PRICE,
  };
}

// ---- Telco customer lookup (after TAC) ----
// eligibility: outcome of the Charge to Bill eligibility check.
export const TELCO_CUSTOMERS = {
  '0123456789': { name: 'KB Chuah', account: 'BA-2209-4821', plan: 'Postpaid 98', eligibility: 'ok' },
  '0121111111': { name: 'Aisyah', account: 'BA-1001-0001', plan: 'Postpaid 68', eligibility: 'spend_limit' },
  '0122222222': { name: 'Raj', account: 'BA-1002-0002', plan: 'Postpaid 48', eligibility: 'inactive' },
  '0123333333': { name: 'Mei Ling', account: 'BA-1003-0003', plan: 'Postpaid 128', eligibility: 'timeout_once' },
};
export async function lookupCustomer(phone) {
  await wait(1400);
  return TELCO_CUSTOMERS[phone] ?? null;
}

// ---- Direct Debit options (mock; no real card or bank details are collected) ----
export const DD_OPTIONS = [
  { id: 'card_ok', kind: 'card', label: 'Visa debit •••• 4242', hint: 'Passes', eligibility: 'ok' },
  { id: 'card_declined', kind: 'card', label: 'Mastercard •••• 0002', hint: 'Invalid card', eligibility: 'card_invalid' },
  { id: 'card_expired', kind: 'card', label: 'Visa credit •••• 0069', hint: 'Expired card', eligibility: 'card_expired' },
  { id: 'bank_ok', kind: 'bank', label: 'Maybank account (FPX Direct Debit)', hint: 'Passes', eligibility: 'ok' },
  { id: 'bank_ok2', kind: 'bank', label: 'CIMB Bank account (FPX Direct Debit)', hint: 'Passes', eligibility: 'ok' },
];

// ---- Billing eligibility check ----
// Returns { ok } or { ok: false, code, title, message, backTo } where backTo is the screen to send the user to.
export const FAILURES = {
  spend_limit: { title: 'Spend limit reached', backTo: 'payment',
    message: "Your telco account has reached its spend limit, so we can't add this subscription to your bill. Please pay by Direct Debit instead." },
  inactive: { title: 'Telco account inactive', backTo: 'payment',
    message: 'Your telco billing account is inactive, so Charge to Bill is not available. Please pay by Direct Debit, or contact your telco to reactivate the account.' },
  card_invalid: { title: 'Card declined', backTo: 'payment',
    message: 'Your bank declined this card. Please choose another card or a bank account.' },
  card_expired: { title: 'Card expired', backTo: 'payment',
    message: 'This card has expired. Please choose another card or a bank account.' },
  timeout: { title: "We couldn't reach the billing system", backTo: 'confirm',
    message: 'This is usually temporary. Your details are fine. Please try again.' },
};
export async function checkEligibility({ eligibility, attempt }) {
  await wait(1600);
  const code = eligibility === 'timeout_once' ? (attempt === 1 ? 'timeout' : 'ok') : eligibility;
  if (code === 'ok') return { ok: true };
  return { ok: false, code, ...FAILURES[code] };
}
