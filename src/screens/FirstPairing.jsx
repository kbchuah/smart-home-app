import { useEffect, useState } from 'react';
import ShopDevices from '../components/ShopDevices.jsx';
import DemoReveal, { DemoOnly } from '../components/DemoReveal.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import { PriceChange, PriceSame, PriceNew, PriceFree } from '../components/PriceCards.jsx';
import Stepper from '../components/Stepper.jsx';
import DemoPanel from '../components/DemoPanel.jsx';
import { useDemo, markTried, useTried, useDemoReveal } from '../demoStore.js';
import { useTacLock, lockTac } from '../tacLock.js';
import {
  QR_CODES, DD_OPTIONS, WIFI_NETWORKS, checkCompatibility, connectWifi, verifyTac, checkTelcoAccount, TAC_LOCK_MINUTES, quotePrice, lookupCustomer, lookupFibreByEmail, maskEmail, normEmail, EMAIL_CODE_VALID_MS, TAC_VALID_MS, checkEligibility, wait,
  PROCESSING_FAILURES, processingFails, supportRef, monthlyPrice, isPremium, billedPrice,
} from '../mockBackend.js';

// Device pairing, all mocked. Two modes:
// • New home (first pairing): scan → compatibility → Wi-Fi → price & agree → TAC → Charge to Bill | Direct Debit
//   → confirm → eligibility → processing → success
// • Existing home (already subscribed, `home` prop): scan → compatibility → Wi-Fi → price (agree only if the
//   price goes up) → processing → success. No TAC or payment: the home's billing method is reused.

// Pilot: the first home is always "My Home" on Google Home Premium (renamable later in Home settings).
const PILOT_HOME_NAME = 'My Home';
const PILOT_ECOSYSTEM = 'Google Home Premium';
const STEPS = ['Device', 'Wi-Fi', 'Price', 'Verify', 'Payment', 'Done'];
const STEP_OF = { scan: 0, serial: 0, scanFail: 0, compatFail: 0, wifi: 1, wifiFail: 1, price: 2, phone: 3, tac: 3, tacLocked: 3,
  payment: 4, confirm: 4, eligFail: 4, processing: 4, procFail: 4, success: 5 };
const STEPS_EXISTING = ['Device', 'Wi-Fi', 'Room', 'Price', 'Done'];
const STEPS_UPGRADE = ['Price', 'Verify', 'Payment', 'Done'];
const STEP_OF_UPGRADE = { price: 0, phone: 1, tac: 1, tacLocked: 1, payment: 2, confirm: 2, eligFail: 2, processing: 2, procFail: 2, success: 3 };
const STEP_OF_EXISTING = { scan: 0, serial: 0, scanFail: 0, compatFail: 0, wifi: 1, wifiFail: 1, room: 2, price: 3, processing: 3, procFail: 3, success: 4 };
const DEFAULT_ROOM = 'My room';
// Demo mobile numbers shown as tappable cards on the TAC screen. 'other' = any non-telco number.
const DEMO_PHONES = [
  { n: '0123456789', icon: 'verified', label: 'Telco · Charge to Bill OK' },
  { n: '0121111111', icon: 'block', label: 'Telco · spend limit (found after TAC)' },
  { n: '0122222222', icon: 'person_off', label: 'Telco · account inactive (found after TAC)' },
  { n: '0124444444', icon: 'update', label: 'Telco · account changes before Confirm (rare)' },
  { n: '0123333333', icon: 'hourglass_empty', label: 'Telco · timeout once at Confirm' },
  { n: '0178881234', icon: 'account_balance', label: 'Not a telco customer → Direct Debit only', other: true },
];
// Demo fibre account emails (customers with a fibre plan but no mobile plan with us).
const DEMO_EMAILS = [
  { e: 'kb.fibre@example.com', icon: 'verified', label: 'Fibre · Charge to Bill OK' },
  { e: 'aisyah.fibre@example.com', icon: 'block', label: 'Fibre · spend limit (found after code)' },
  { e: 'raj.fibre@example.com', icon: 'person_off', label: 'Fibre · account inactive (found after code)' },
  { e: 'mei.fibre@example.com', icon: 'hourglass_empty', label: 'Fibre · timeout once at Confirm' },
  { e: 'someone@example.com', icon: 'mail_off', label: 'No fibre account → code not sent', other: true },
];
const emailKey = (e) => (DEMO_EMAILS.some((d) => d.e === normEmail(e) && !d.other) ? `email:${normEmail(e)}` : 'email:other');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneKey = (n) => (DEMO_PHONES.some((d) => d.n === n && !d.other) ? `phone:${n}` : 'phone:other');
const DEMO_WIFI_PW = 'homewifi123'; // demo: pre-filled valid Wi-Fi password

const digits = (v) => v.replace(/\D/g, '');
const fmtPhone = (n) => (n.length > 3 ? `${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6)}` : n).trim();
const rm = (n) => `MYR ${n.toFixed(2)}`;

function Spinner({ label }) {
  return <div className="spinner-wrap"><div className="spinner" /><p>{label}</p></div>;
}

function Actions({ onBack, backLabel = 'Back', children }) {
  return (
    <div className="form-actions">
      {onBack && <button type="button" className="btn" onClick={onBack}>{backLabel}</button>}
      <span className="spacer" />
      {children}
    </div>
  );
}

// "My Home", or "My Home 2", "My Home 3"… if the user already has a home with that name.
export function uniqueHomeName(taken, base = PILOT_HOME_NAME) {
  const names = new Set(taken.map((n) => n.trim().toLowerCase()));
  if (!names.has(base.toLowerCase())) return base;
  let i = 2;
  while (names.has(`${base} ${i}`.toLowerCase())) i += 1;
  return `${base} ${i}`;
}

export default function FirstPairing({ plan, home = null, upgrade = false, defaultRoom = DEFAULT_ROOM, account = 'guest', existingHomeNames = [], onCancel, onDone }) {
  // upgrade: a free home re-subscribes (billing steps only). Existing: add a device to a home (no billing).
  const isUpgrade = Boolean(home) && upgrade;
  const isExisting = Boolean(home) && !upgrade;
  const isFreeHome = isExisting && !isPremium(home.subscription);
  const homeWifi = home?.wifi ?? null; // existing homes: the network their devices use
  const demo = useDemo();
  const showDemo = useDemoReveal(); // demo hints and Tried marks are hidden unless demo options are shown
  const isTried = useTried();
  const [view, setView] = useState(isUpgrade ? 'price' : 'scan');
  const tacLockedMins = useTacLock(account) * (isExisting ? 0 : 1); // TAC isn't used for existing homes
  const [busy, setBusy] = useState(null);

  // home
  const [homeName] = useState(() => (home ? home.homeName : uniqueHomeName(existingHomeNames)));
  const ecosystem = home?.ecosystem ?? PILOT_ECOSYSTEM;
  // device
  const [selectedQr, setSelectedQr] = useState(null);
  const [serial, setSerial] = useState('');
  const [device, setDevice] = useState(null);
  const [compatError, setCompatError] = useState(null);
  // price
  const [quote, setQuote] = useState(() => {
    if (!isUpgrade) return null;
    const p = monthlyPrice(home.devices.length); // re-subscribe at the price for the home's current devices
    return { currentDevices: home.devices.length, devicesAfter: home.devices.length, included: p.included, base: p.base, extraDevices: p.extraDevices, extraEach: p.extraEach, total: p.total || p.base, currentTotal: 0 };
  });
  const [agreed, setAgreed] = useState(false);
  // verify
  const [verifyBy, setVerifyBy] = useState('mobile'); // 'mobile' (SMS TAC) | 'email' (code to fibre account email)
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [pendingFibre, setPendingFibre] = useState(null); // fibre account matched before sending the code
  const [tac, setTac] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [tacSentAt, setTacSentAt] = useState(0);
  const [tacWrong, setTacWrong] = useState(0); // wrong tries on the current TAC
  const [tacError, setTacError] = useState(null); // { code, text }
  const [ctbNotice, setCtbNotice] = useState(null); // telco pre-check failure: Charge to Bill not offered
  // payment
  const [method, setMethod] = useState(null); // 'ctb' | DD option id
  const [blocked, setBlocked] = useState({}); // method -> reason it failed eligibility
  const [attempts, setAttempts] = useState(0);
  const [eligError, setEligError] = useState(null);
  // wi-fi
  const [ssid, setSsid] = useState(null);
  const [wifiPw, setWifiPw] = useState('');
  const [wifiError, setWifiError] = useState(null);
  // processing
  const [doneTasks, setDoneTasks] = useState(0);
  const [procError, setProcError] = useState(null); // { task, title, message, ref }
  const [failedOnce, setFailedOnce] = useState({}); // task -> true (demo: fail-once modes)
  const [confirmLeave, setConfirmLeave] = useState(false);
  // room & name (after activation)
  // Room and camera name use defaults during first pairing; users change them afterwards.
  const [deviceName, setDeviceName] = useState('');
  // existing homes: choose a room (existing or new) before pricing
  const homeRooms = home?.rooms ?? [];
  const initialRoom = homeRooms.find((r) => r.name.toLowerCase() === defaultRoom.toLowerCase()) ?? homeRooms[0];
  const [roomPick, setRoomPick] = useState(initialRoom ? { id: initialRoom.id } : { id: null }); // { id } | { id: null } = new
  const [newRoom, setNewRoom] = useState(initialRoom ? '' : defaultRoom);
  const matchRoom = (name) => homeRooms.find((r) => r.name.trim().toLowerCase() === name.trim().toLowerCase());
  const chosenRoomName = roomPick.id ? homeRooms.find((r) => r.id === roomPick.id)?.name : (matchRoom(newRoom)?.name ?? newRoom.trim());
  const roomLabel = isExisting ? chosenRoomName : defaultRoom;

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const run = async (label, fn) => { setBusy(label); try { await fn(); } finally { setBusy(null); } };

  const ddOption = DD_OPTIONS.find((o) => o.id === method);
  // Saved on the subscription: how the customer was verified for this home (SMS TAC or fibre email code).
  const verifiedWith = verifyBy === 'email' ? { email: normEmail(email), billedTo: method === 'ctb' ? 'fibre' : undefined } : { phone, billedTo: method === 'ctb' ? 'mobile' : undefined };
  const methodLabel = method === 'ctb' ? (customer?.kind === 'fibre' ? 'Charge to Bill · fibre' : 'Charge to Bill') : ddOption ? `Direct Debit · ${ddOption.label}` : '';
  const priceUp = isExisting && !isFreeHome && Boolean(quote) && quote.total > quote.currentTotal;
  const tasks = isUpgrade
    ? [{ key: 'subscription', label: `Reactivating ${plan.name} for ${homeName}` }]
    : isExisting
    ? [
      { key: 'device', label: `Registering ${device?.model ?? 'camera'} to ${homeName}` },
      ...(priceUp ? [{ key: 'subscription', label: `Updating subscription to ${rm(quote.total)}/month` }] : []),
    ]
    : [
      { key: 'home', label: `Creating ${homeName.trim()} (${ecosystem})` },
      { key: 'device', label: `Registering ${device?.model ?? 'camera'}` },
      { key: 'subscription', label: `Activating ${plan.name} subscription` },
    ];

  // Processing: tick tasks one by one, then show success.
  useEffect(() => {
    if (view !== 'processing') return;
    if (doneTasks >= tasks.length) { const t = setTimeout(() => { setDeviceName(device?.model ?? ''); setView('success'); }, 500); return () => clearTimeout(t); }
    const task = tasks[doneTasks].key;
    const t = setTimeout(() => {
      if (processingFails({ mode: demo.processing, task, failedBefore: failedOnce[task] })) {
        setFailedOnce((f) => ({ ...f, [task]: true }));
        const kind = task === 'subscription' ? (isUpgrade ? 'subscription_upgrade' : isExisting ? 'subscription_update' : 'subscription_new') : 'device';
        setProcError({ task, ...PROCESSING_FAILURES[kind], ref: supportRef() });
        setView('procFail');
        return;
      }
      setDoneTasks((n) => n + 1);
    }, 800);
    return () => clearTimeout(t);
  }, [view, doneTasks, tasks.map((t) => t.key).join(), device, demo.processing, failedOnce, isExisting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving mid-flow loses progress, so ask first (except at the very first screen).
  const requestLeave = () => (view === 'scan' && !selectedQr ? onCancel() : setConfirmLeave(true));

  const verifyDevice = (input) => run('Checking device compatibility…', async () => {
    const r = await checkCompatibility({ ...input, override: demo.compat });
    if (!r.ok) { setCompatError(r); setView('compatFail'); return; }
    setDevice(r.device);
    if (homeWifi && !ssid) { setSsid(homeWifi); setWifiPw(DEMO_WIFI_PW); }
    setView('wifi');
  });

  // Camera must be online before we quote and bill.
  const joinWifi = () => run(`Connecting camera to ${ssid}…`, async () => {
    markTried(`wifi:${ssid}`);
    const r = await connectWifi({ ssid, password: wifiPw, override: demo.wifi });
    if (!r.ok) { setWifiError(r); setView('wifiFail'); return; }
    setBusy('Camera is online. Checking for updates…');
    await wait(1000);
    setBusy(`Checking devices on ${homeName.trim()}…`);
    const q = await quotePrice({ structureDeviceCount: isExisting ? home.devices.length : 0 }); // new home: 0 devices
    // Free plan: adding costs nothing. Premium: compare with what's billed now (a pending drop may already cover it).
    setQuote(isFreeHome ? { ...q, total: 0, currentTotal: 0 } : isExisting ? { ...q, currentTotal: billedPrice(home), total: Math.max(q.total, billedPrice(home)) } : q);
    setView(isExisting ? 'room' : 'price');
  });

  // Demo: auto-fill a random valid TAC, like SMS autofill (never 000000 / 999999).
  const randomTac = () => String(100000 + Math.floor(Math.random() * 899999));
  const sendTac = () => { setTac(randomTac()); setTacWrong(0); setTacError(null); setTacSentAt(Date.now()); setResendIn(30); };

  const byEmail = verifyBy === 'email';
  const codeWord = byEmail ? 'code' : 'TAC';
  const sentTo = byEmail ? maskEmail(email) : `+60 ${fmtPhone(phone)}`;
  // Email: the code is only sent if the email is on a fibre account (proves the customer owns it).
  const sendEmailCode = () => run('Checking your email…', async () => {
    markTried(emailKey(email));
    const c = await lookupFibreByEmail(email);
    if (!c) { setEmailError("We couldn't find a fibre account with this email. Check the email on your fibre bill, or verify with any Malaysian mobile number instead (it works even if you're not with us)."); return; }
    setPendingFibre(c); setBusy('Sending code…'); await wait(800); sendTac(); setView('tac');
  });

  // TAC → telco lookup → Charge to Bill pre-check (account status) before showing payment options.
  const submitTac = () => run('Verifying TAC…', async () => {
    const v = await verifyTac({ tac, sentAt: tacSentAt, wrongSoFar: tacWrong, validMs: byEmail ? EMAIL_CODE_VALID_MS : TAC_VALID_MS, override: demo.tac });
    if (!v.ok) {
      if (v.code === 'locked') { lockTac(account, TAC_LOCK_MINUTES); setView('tacLocked'); return; }
      if (v.code === 'expired') { setTacError({ code: 'expired', text: `This ${codeWord} has expired. Tap “Resend ${codeWord}” to get a new one.` }); return; }
      setTacWrong((n) => n + 1); setTac('');
      setTacError({ code: 'wrong', text: `Incorrect ${codeWord}. ${v.left} ${v.left === 1 ? 'try' : 'tries'} left.` });
      return;
    }
    setBusy(byEmail ? 'Checking your fibre account…' : 'Checking your telco account…');
    const c = byEmail ? pendingFibre : await lookupCustomer(phone);
    let notice = null;
    if (c) {
      setBusy('Checking Charge to Bill eligibility…');
      const pre = await checkTelcoAccount({ customer: c, override: demo.telco });
      if (!pre.ok) notice = pre;
    }
    setCustomer(c); setCtbNotice(notice); setAttempts(0);
    setBlocked(notice ? { ctb: notice.title } : {});
    setMethod(c && !notice ? 'ctb' : null);
    setView('payment');
  });

  const confirmPayment = () => run('Checking billing eligibility…', async () => {
    const n = attempts + 1;
    setAttempts(n);
    const eligibility = demo.eligibility !== 'auto' ? demo.eligibility : method === 'ctb' ? customer.eligibility : ddOption.eligibility;
    const r = await checkEligibility({ eligibility, attempt: n });
    if (r.ok) { setDoneTasks(0); setView('processing'); return; }
    if (r.backTo === 'payment') { setBlocked((b) => ({ ...b, [method]: r.title })); }
    setEligError(r);
    setView('eligFail');
  });

  const LOCKED_BODY = (
    <div className="auth-card">
      <span className="auth-logo err"><Icon name="lock_clock" /></span>
      <h1>Too many attempts</h1>
      <p className="muted">For your security, TAC verification on your account is locked. You can't request a TAC or email code for any mobile number or email for the next <b>{tacLockedMins} minute{tacLockedMins === 1 ? '' : 's'}</b>.</p>
      <p className="note"><Icon name="info" /><span>You haven't been charged. When the lock ends, start again from <b>Add device</b>.</span></p>
      <button className="btn primary wide" onClick={onCancel}>Back to home</button>
    </div>
  );

  // Locked accounts can't finish billing, so block every step up to payment.
  const PRE_PAYMENT = ['scan', 'serial', 'scanFail', 'compatFail', 'wifi', 'wifiFail', 'price', 'phone', 'tac', 'tacLocked'];
  let body;
  if (tacLockedMins > 0 && PRE_PAYMENT.includes(view)) {
    body = LOCKED_BODY;
  } else if (busy) {
    body = <div className="auth-card"><Spinner label={busy} /></div>;
  } else if (view === 'scan') {
    body = (
      <div className="auth-card left">
        <h1>Scan your camera's QR code</h1>
        <p className="muted">Find the QR code on the back or bottom of your camera.</p>
        <p className="home-tag"><Icon name="home" fill /> Adding to <b>{homeName}</b> · {ecosystem}</p>
        <div className="viewfinder small"><span className="vf-corner" /><Icon name="qr_code_2" /><span className="vf-line" /></div>
        <DemoReveal label="Choose a QR code to scan">
        <div className="options">
          {QR_CODES.map((q) => (
            <button key={q.id} className={`option compact ${selectedQr?.id === q.id ? 'sel' : ''} ${isTried(`qr:${q.id}`) ? 'tried' : ''}`} onClick={() => setSelectedQr(q)}>
              <Icon name="qr_code" />
              <span className="option-body"><b>{q.label}</b><small>{q.hint}</small></span>
              {isTried(`qr:${q.id}`) && <span className="tried-tag"><Icon name="check" /> Tried</span>}
              {q.brand && <span className={`brand-tag ${q.brand === 'Nest' ? 'nest' : 'tp'}`}>{q.brand === 'Nest' ? 'Nest' : '3P'}</span>}
            </button>
          ))}
        </div>
        </DemoReveal>
        <button className="btn subtle" onClick={() => { setSerial(''); setView('serial'); }}><Icon name="keyboard" /> Key in serial number instead</button>
        <ShopDevices />
        <Actions onBack={requestLeave} backLabel="Cancel">
          <button className="btn primary" onClick={() => {
            const q = selectedQr ?? QR_CODES[0]; // demo options hidden: scan a camera that passes
            setSelectedQr(q);
            markTried(`qr:${q.id}`);
            if (q.unreadable || demo.scan === 'unreadable') run('Scanning…', async () => { await wait(1000); setView('scanFail'); });
            else run('Reading QR code…', async () => { await wait(800); await verifyDevice({ qr: q }); });
          }}><Icon name="qr_code_scanner" /> Scan</button>
        </Actions>
      </div>
    );
  } else if (view === 'serial') {
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (serial.trim()) verifyDevice({ serial }); }}>
        <h1>Key in serial number</h1>
        <p className="muted">The serial number is printed under the QR code on your camera.</p>
        <label className="field"><span>Serial number</span>
          <input autoFocus value={serial} placeholder="NC-IW-12345" onChange={(e) => setSerial(e.target.value.toUpperCase())} />
          <DemoOnly><small className="field-hint"><Icon name="science" /> Demo: Nest NC-XX-12345 (e.g. NC-IW-48213) or 3P 3P-XXXX-12345 (e.g. 3P-AERO-20415) passes. Anything else fails.</small></DemoOnly></label>
        <Actions onBack={() => setView('scan')}><button className="btn primary" disabled={!serial.trim()}>Check device</button></Actions>
      </form>
    );
  } else if (view === 'scanFail' || view === 'compatFail') {
    const scan = view === 'scanFail';
    body = (
      <div className="auth-card">
        <span className="auth-logo err"><Icon name={scan ? 'qr_code_2' : 'error'} fill /></span>
        <h1>{scan ? "Couldn't read the QR code" : compatError.title}</h1>
        <p className="muted">{scan ? 'The code may be damaged or too far away. Try scanning again, or key in the serial number.' : compatError.reason}</p>
        <button className="btn primary wide" onClick={() => { setSelectedQr(null); setView('scan'); }}><Icon name="qr_code_scanner" /> Scan again</button>
        <button className="btn outline wide" onClick={() => { setSerial(''); setView('serial'); }}><Icon name="keyboard" /> Key in serial number</button>
        {!scan && !compatError?.title?.includes('registered') && <ShopDevices text="Shop compatible cameras at Maxis store" />}
      </div>
    );
  } else if (view === 'wifi') {
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ssid) joinWifi(); }}>
        <span className="auth-logo info"><Icon name="wifi" /></span>
        <h1>Connect camera to Wi-Fi</h1>
        <p className="muted">Your <b>{device.model}</b> needs Wi-Fi to work. Choose your home network.</p>
        {homeWifi && (
          <p className="home-tag"><Icon name="wifi" /><span>Your other devices in <b>{homeName}</b> are on <b>{homeWifi}</b>.</span></p>
        )}
        {isExisting && !homeWifi && home.devices.length > 0 && (
          <p className="home-tag"><Icon name="wifi" /><span>Choose the same Wi-Fi as your other devices in <b>{homeName}</b>. We'll remember it for next time.</span></p>
        )}
        <div className="options">
          {WIFI_NETWORKS.map((n) => (
            <button type="button" key={n.ssid} className={`option compact ${ssid === n.ssid ? 'sel' : ''} ${isTried(`wifi:${n.ssid}`) ? 'tried' : ''}`} onClick={() => { setSsid(n.ssid); setWifiPw(DEMO_WIFI_PW); }}>
              <Icon name={n.icon} />
              <span className="option-body"><b>{n.ssid}</b><small>{homeWifi === n.ssid && <span className="net-tag">Home network</span>}{showDemo ? `Demo: ${n.hint}` : 'Secured'}</small></span>
              {showDemo && isTried(`wifi:${n.ssid}`) ? <span className="tried-tag"><Icon name="check" /> Tried</span> : <Icon name="lock" className="muted" />}
            </button>
          ))}
        </div>
        {homeWifi && ssid && ssid !== homeWifi && (
          <div className="alert warn"><Icon name="warning" fill />
            <span><b>{ssid} isn't your home network.</b> Your other devices are on <b>{homeWifi}</b>. Devices on different Wi-Fi networks may not work together, so your service might be impacted. You can still continue.</span></div>
        )}
        {ssid && (
          <label className="field"><span>Password for {ssid}</span>
            <input type="password" autoFocus value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} />
            <DemoOnly><small className="field-hint"><Icon name="science" /> Demo: password pre-filled. 8+ characters connects; shorter is a wrong password. Not saved.</small></DemoOnly></label>
        )}
        <DemoReveal label="Wi-Fi test networks"><p className="demo-note">Each network above shows what it simulates. Force any Wi-Fi result in the Demo simulator.</p></DemoReveal>
        <Actions onBack={() => setView('scan')}><button className="btn primary" disabled={!ssid || !wifiPw}>Connect</button></Actions>
      </form>
    );
  } else if (view === 'wifiFail') {
    const act = { password: ['Re-enter password', 'key', () => { setWifiPw(DEMO_WIFI_PW); setView('wifi'); }],
      network: ['Choose another network', 'wifi_find', () => { setSsid(null); setWifiPw(''); setView('wifi'); }],
      retry: ['Try again', 'refresh', joinWifi] };
    body = (
      <div className="auth-card">
        <span className="auth-logo err"><Icon name="wifi_off" /></span>
        <h1>{wifiError.title}</h1>
        <p className="muted">{wifiError.message}</p>
        {wifiError.actions.map((a, i) => (
          <button key={a} className={`btn wide ${i === 0 ? 'primary' : 'outline'}`} onClick={act[a][2]}><Icon name={act[a][1]} /> {act[a][0]}</button>
        ))}
        <p className="note"><Icon name="info" /> You haven't been charged. Billing only starts once your camera is online.</p>
      </div>
    );
  } else if (view === 'room') {
    const creating = !roomPick.id;
    const dup = creating && newRoom.trim() && matchRoom(newRoom);
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (chosenRoomName) setView('price'); }}>
        <span className="auth-logo"><Icon name="meeting_room" /></span>
        <h1>Which room is this camera in?</h1>
        <p className="muted">Choose a room in <b>{homeName}</b>, or create a new one.</p>
        <div className="options">
          {homeRooms.map((r) => {
            const count = home.devices.filter((d) => d.roomId === r.id).length;
            return (
              <button type="button" key={r.id} className={`option compact ${roomPick.id === r.id ? 'sel' : ''}`} onClick={() => setRoomPick({ id: r.id })}>
                <span className="option-icon"><Icon name="meeting_room" fill={roomPick.id === r.id} /></span>
                <span className="option-body"><b>{r.name}</b><small>{count} device{count === 1 ? '' : 's'}</small></span>
                <Icon name={roomPick.id === r.id ? 'radio_button_checked' : 'radio_button_unchecked'} className="option-radio" />
              </button>
            );
          })}
          <button type="button" className={`option compact ${creating ? 'sel' : ''}`} onClick={() => setRoomPick({ id: null })}>
            <span className="option-icon"><Icon name="add" /></span>
            <span className="option-body"><b>Create a new room</b><small>e.g. Car porch, Study</small></span>
            <Icon name={creating ? 'radio_button_checked' : 'radio_button_unchecked'} className="option-radio" />
          </button>
        </div>
        {creating && (
          <label className="field"><span>New room name</span>
            <input autoFocus maxLength={30} value={newRoom} placeholder="e.g. Car porch" onChange={(e) => setNewRoom(e.target.value)} />
            {dup && <small className="field-hint"><Icon name="info" /> {dup.name} already exists. The camera will be added there.</small>}
          </label>
        )}
        <Actions onBack={() => setView('wifi')}><button className="btn primary" disabled={!chosenRoomName}>Next</button></Actions>
      </form>
    );
  } else if (view === 'price' && isUpgrade) {
    body = (
      <div className="auth-card left">
        <span className="auth-logo"><Icon name="workspace_premium" fill /></span>
        <h1>Upgrade {homeName} to {plan.name}</h1>
        <p className="muted">Turn the Premium features back on. Your {quote.currentDevices} device{quote.currentDevices === 1 ? '' : 's'} stay as they are.</p>
        <PriceNew price={quote.total} included={quote.included} />
        <div className="summary-box">
          <div><span>Home</span><b>{homeName}</b></div>
          <div><span>Devices on this home</span><b>{quote.currentDevices}</b></div>
          <div><span>{plan.name} (up to {quote.included} devices)</span><b>{rm(quote.base)}</b></div>
          {quote.extraDevices > 0 && <div><span>{quote.extraDevices} extra × {rm(quote.extraEach)}</span><b>{rm(quote.extraDevices * quote.extraEach)}</b></div>}
          <div className="total"><span>Monthly price</span><b>{rm(quote.total)}</b></div>
        </div>
        <label className="consent">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I agree to subscribe to <b>{plan.name}</b> for <b>{homeName}</b> at <b>{rm(quote.total)}/month</b>, renewing monthly. I can cancel anytime.</span>
        </label>
        <Actions onBack={requestLeave} backLabel="Cancel"><button className="btn primary" disabled={!agreed} onClick={() => setView('phone')}>Proceed <Icon name="arrow_forward" /></button></Actions>
      </div>
    );
  } else if (view === 'price' && isExisting) {
    const start = () => { setDoneTasks(0); setView('processing'); };
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="check_circle" fill /></span>
        <h1>Camera is online</h1>
        <p className="muted"><b>{device.model}</b> ({device.brand === '3P' ? 'Works with Google Home' : 'Nest'}) · SN {device.serial} · connected to {ssid}</p>
        {isFreeHome ? <PriceFree /> : priceUp ? <PriceChange from={quote.currentTotal} to={quote.total} /> : <PriceSame price={quote.total} used={quote.devicesAfter} included={quote.included} />}
        <div className="summary-box">
          <div><span>Home</span><b>{homeName}</b></div>
          <div><span>Room</span><b>{roomLabel}{roomPick.id || matchRoom(newRoom) ? '' : ' (new)'}</b></div>
          <div><span>Devices on this home</span><b>{quote.currentDevices} → {quote.devicesAfter}</b></div>
          <div><span>Included in {plan.name}</span><b>Up to {quote.included}</b></div>
          {priceUp
            ? <div className="total"><span>Monthly price</span><b className="price-diff"><s>{rm(quote.currentTotal)}</s> {rm(quote.total)}</b></div>
            : <div className="total"><span>Monthly price</span><b>{rm(quote.total)} {isFreeHome ? '(free plan)' : '(no change)'}</b></div>}
          {isFreeHome ? <div><span>Plan</span><b>Free</b></div> : <div><span>Billed via</span><b>{home.subscription?.method ?? 'Current method'}</b></div>}
        </div>
        {priceUp ? (<>
          <p className="note"><Icon name="info" /> Price rule: {rm(quote.base)}/month covers up to {quote.included} devices. Each extra device is {rm(quote.extraEach)}/month.</p>
          <label className="consent">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree that my <b>{plan.name}</b> subscription for <b>{homeName}</b> increases from <b>{rm(quote.currentTotal)}</b> to <b>{rm(quote.total)}/month</b>, billed via {home.subscription?.method ?? 'my current payment method'}, starting when this device is paired.</span>
          </label>
          <Actions onBack={() => setView('room')}><button className="btn primary" disabled={!agreed} onClick={start}>Proceed <Icon name="arrow_forward" /></button></Actions>
        </>) : (<>
          <Actions onBack={() => setView('room')}><button className="btn primary" onClick={start}>Add device <Icon name="arrow_forward" /></button></Actions>
        </>)}
      </div>
    );
  } else if (view === 'price') {
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="check_circle" fill /></span>
        <h1>Camera is online</h1>
        <p className="muted"><b>{device.model}</b> ({device.brand === '3P' ? 'Works with Google Home' : 'Nest'}) · SN {device.serial} · connected to {ssid}</p>
        <PriceNew price={quote.total} included={quote.included} />
        <div className="summary-box">
          <div><span>Home</span><b>{homeName.trim()}</b></div>
          <div><span>Devices on this home</span><b>{quote.currentDevices} → {quote.devicesAfter} after pairing</b></div>
          <div><span>{plan.name} (up to {quote.included} devices)</span><b>{rm(quote.base)}</b></div>
          {quote.extraDevices > 0 && <div><span>{quote.extraDevices} extra device(s) × {rm(quote.extraEach)}</span><b>{rm(quote.extraDevices * quote.extraEach)}</b></div>}
          <div className="total"><span>Monthly price</span><b>{rm(quote.total)}</b></div>
        </div>
        <p className="note"><Icon name="info" /> Price rule: {rm(quote.base)}/month covers up to {quote.included} devices per home. Each extra device is {rm(quote.extraEach)}/month.</p>
        <label className="consent">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I agree to subscribe to <b>{plan.name}</b> for <b>{homeName.trim()}</b> at <b>{rm(quote.total)}/month</b>, starting when this device is paired. I can cancel anytime.</span>
        </label>
        <Actions onBack={() => setView('wifi')}><button className="btn primary" disabled={!agreed} onClick={() => setView('phone')}>Proceed <Icon name="arrow_forward" /></button></Actions>
      </div>
    );
  } else if (view === 'tacLocked') {
    // Lock has ended: let them verify again.
    body = (
      <div className="auth-card">
        <span className="auth-logo ok"><Icon name="lock_open" /></span>
        <h1>TAC is unlocked</h1>
        <p className="muted">You can verify your mobile number or fibre account email again.</p>
        <button className="btn primary wide" onClick={() => { setPhone(''); setEmail(''); setView('phone'); }}>Continue</button>
      </div>
    );
  } else if (view === 'phone') {
    const toggle = (
      <div className="segmented verify-by">
        <button type="button" className={!byEmail ? 'active' : ''} onClick={() => setVerifyBy('mobile')}><Icon name="smartphone" /> Mobile number</button>
        <button type="button" className={byEmail ? 'active' : ''} onClick={() => { setVerifyBy('email'); setEmailError(null); }}><Icon name="mail" /> Fibre email</button>
      </div>
    );
    if (!byEmail) {
      const ok = /^01\d{8,9}$/.test(phone);
      body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ok) run('Sending TAC…', async () => { markTried(phoneKey(phone)); await wait(900); sendTac(); setView('tac'); }); }}>
        <span className="auth-logo info"><Icon name="sms" /></span>
        {toggle}
        <h1>Verify your mobile number</h1>
        <p className="muted">Any Malaysian mobile number works, from any provider. We'll send a TAC to it. If the number is on a mobile plan with us, you can pay on your bill. If not, you'll pay by Direct Debit.</p>
        <label className="field"><span>Mobile number</span>
          <div className="phone-input"><span>+60</span>
            <input autoFocus inputMode="tel" value={fmtPhone(phone)} placeholder="012-345 6789" onChange={(e) => setPhone(digits(e.target.value).slice(0, 11))} /></div>
          <small className="field-hint"><Icon name="info" /> Not with us? Use any Malaysian mobile number.</small></label>
        <DemoReveal label="Tap a test number to use it">
        <div className="options">
          {DEMO_PHONES.map((d) => {
            const triedIt = isTried(d.other ? 'phone:other' : `phone:${d.n}`);
            return (
              <button type="button" key={d.n} className={`option compact ${phone === d.n ? 'sel' : ''} ${triedIt ? 'tried' : ''}`} onClick={() => setPhone(d.n)}>
                <span className="option-icon"><Icon name={d.icon} /></span>
                <span className="option-body"><b>{d.other ? 'Any other number' : fmtPhone(d.n)}</b><small>{d.label}</small></span>
                {triedIt && <span className="tried-tag"><Icon name="check" /> Tried</span>}
              </button>
            );
          })}
        </div>
        </DemoReveal>
        <button type="button" className="btn subtle" onClick={() => { setVerifyBy('email'); setEmailError(null); }}><Icon name="router" /> Fibre plan but no mobile plan with us? Verify with your fibre account email</button>
        <Actions onBack={() => setView('price')}><button className="btn primary" disabled={!ok}>Send TAC</button></Actions>
      </form>
      );
    } else {
      const ok = EMAIL_RE.test(email.trim());
      body = (
        <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ok) sendEmailCode(); }}>
          <span className="auth-logo info"><Icon name="mail" /></span>
          {toggle}
          <h1>Verify your fibre account email</h1>
          <p className="muted">For customers with a fibre plan but no mobile plan with us. Enter the email on your fibre account and we'll send a 6-digit code to it. Not with us at all? Use <button type="button" className="link-btn" onClick={() => setVerifyBy('mobile')}>any mobile number</button>.</p>
          <label className="field"><span>Fibre account email</span>
            <input autoFocus type="email" inputMode="email" autoComplete="email" className={emailError ? 'invalid' : ''} value={email} placeholder="name@example.com"
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }} />
            {emailError
              ? <small className="field-error"><Icon name="error" /> {emailError}</small>
              : <small className="field-hint"><Icon name="info" /> It's the email on your fibre bill. We only send the code if it matches a fibre account.</small>}
          </label>
          <DemoReveal label="Tap a test email to use it">
          <div className="options">
            {DEMO_EMAILS.map((d) => {
              const triedIt = isTried(d.other ? 'email:other' : `email:${d.e}`);
              return (
                <button type="button" key={d.e} className={`option compact ${normEmail(email) === d.e ? 'sel' : ''} ${triedIt ? 'tried' : ''}`} onClick={() => { setEmail(d.e); setEmailError(null); }}>
                  <span className="option-icon"><Icon name={d.icon} /></span>
                  <span className="option-body"><b>{d.other ? 'Any other email' : d.e}</b><small>{d.label}</small></span>
                  {triedIt && <span className="tried-tag"><Icon name="check" /> Tried</span>}
                </button>
              );
            })}
          </div>
          </DemoReveal>
          {emailError && <button type="button" className="btn subtle" onClick={() => setVerifyBy('mobile')}><Icon name="smartphone" /> Verify with any mobile number instead</button>}
          <Actions onBack={() => setView('price')}><button className="btn primary" disabled={!ok}>Send code</button></Actions>
        </form>
      );
    }
  } else if (view === 'tac') {
    const ok = /^\d{6}$/.test(tac);
    const expired = tacError?.code === 'expired';
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ok && !expired) submitTac(); }}>
        <h1>{byEmail ? 'Enter the code from your email' : 'Enter TAC'}</h1>
        <p className="muted">We sent a 6-digit {codeWord} to <b>{sentTo}</b>. It's valid for {byEmail ? 10 : 5} minutes.{byEmail && ' Check your spam folder if you can\'t see it.'}</p>
        <label className="field"><span>{byEmail ? 'Code' : 'TAC'}</span>
          <input autoFocus className={`tac-input ${tacError ? 'invalid' : ''}`} inputMode="numeric" maxLength={6} value={tac} placeholder="••••••"
            disabled={expired} onChange={(e) => { setTac(digits(e.target.value)); if (tacError?.code === 'wrong') setTacError(null); }} />
          {tacError
            ? <small className="field-error"><Icon name="error" /> {tacError.text}</small>
            : showDemo && <small className="field-hint"><Icon name="science" /> Demo: {codeWord} auto-filled from “{byEmail ? 'email' : 'SMS'}”. Any 6 digits pass. 000000 = incorrect, 999999 = expired.</small>}
        </label>
        <button type="button" className="btn subtle" disabled={resendIn > 0} onClick={sendTac}>{resendIn > 0 ? `Resend ${codeWord} in ${resendIn}s` : `Resend ${codeWord}`}</button>
        <Actions onBack={() => setView('phone')}><button className="btn primary" disabled={!ok || expired}>Verify</button></Actions>
      </form>
    );
  } else if (view === 'payment') {
    const opt = (id, icon, title, sub) => {
      const reason = blocked[id];
      return (
        <button key={id} disabled={!!reason} className={`option compact ${method === id ? 'sel' : ''}`} onClick={() => { setMethod(id); setAttempts(0); }}>
          <span className="option-icon"><Icon name={icon} fill={method === id} /></span>
          <span className="option-body"><b>{title}</b><small>{reason ? `Unavailable: ${reason}` : sub}</small></span>
          <Icon name={method === id ? 'radio_button_checked' : 'radio_button_unchecked'} className="option-radio" />
        </button>
      );
    };
    body = (
      <div className="auth-card left">
        <h1>{customer ? `Welcome back, ${customer.name.split(' ')[0]}` : 'Set up Direct Debit'}</h1>
        {customer && ctbNotice ? (
          <div className="alert warn"><Icon name="warning" fill />
            <span><b>Charge to Bill isn't available: {ctbNotice.title.toLowerCase()}.</b> {ctbNotice.message} Please pay by Direct Debit.</span></div>
        ) : (
          <p className="muted">{customer
            ? customer.kind === 'fibre'
              ? <>You're an existing fibre customer. Your subscription will be added to your monthly fibre bill.</>
              : <>You're an existing telco customer. Your subscription will be added to your monthly telco bill.</>
            : <><b>+60 {fmtPhone(phone)}</b> isn't on a mobile plan with us, so you'll pay by Direct Debit, from a card or bank account.</>}</p>
        )}
        {customer && (<>
          <div className="field-label">Charge to Bill</div>
          <div className="options">{opt('ctb', customer.kind === 'fibre' ? 'router' : 'receipt_long', customer.kind === 'fibre' ? 'Charge to fibre bill' : 'Charge to Bill', `${customer.kind === 'fibre' ? 'Fibre account' : 'Billing account'} ${customer.account} · ${customer.plan}`)}</div>
        </>)}
        {(!customer || blocked.ctb) && (<>
          <div className="field-label">Direct Debit</div>
          <div className="options">
            {DD_OPTIONS.map((o) => opt(o.id, o.kind === 'card' ? 'credit_card' : 'account_balance', o.label, showDemo ? `Demo: ${o.hint}` : o.kind === 'card' ? 'Debit or credit card' : 'Bank account via FPX'))}
          </div>
          <DemoOnly><small className="field-hint"><Icon name="science" /> Demo only. No real card or bank details are collected.</small></DemoOnly>
        </>)}
        <Actions onBack={() => setView('phone')}><button className="btn primary" disabled={!method || blocked[method]} onClick={() => setView('confirm')}>Continue</button></Actions>
      </div>
    );
  } else if (view === 'confirm') {
    body = (
      <div className="auth-card left">
        <h1>Confirm and subscribe</h1>
        <PriceNew price={quote.total} included={quote.included} label="You'll be charged" badge={method === 'ctb' ? (customer?.kind === 'fibre' ? 'On your fibre bill' : 'On your telco bill') : 'Direct Debit'} />
        <div className="summary-box">
          <div><span>Home</span><b>{homeName.trim()}</b></div>
          {device && <div><span>Device</span><b>{device.model}</b></div>}
          <div><span>Plan</span><b>{plan.name}</b></div>
          <div><span>Payment</span><b>{methodLabel}</b></div>
          {method === 'ctb' && <div><span>{customer.kind === 'fibre' ? 'Fibre account' : 'Billing account'}</span><b>{customer.account}</b></div>}
          <div><span>Verified {byEmail ? 'email' : 'mobile'}</span><b>{sentTo}</b></div>
          <div className="total"><span>Monthly price</span><b>{rm(quote.total)}</b></div>
        </div>
        <Actions onBack={() => setView('payment')}><button className="btn primary" onClick={confirmPayment}>Confirm &amp; subscribe</button></Actions>
      </div>
    );
  } else if (view === 'eligFail') {
    const toPayment = eligError.backTo === 'payment';
    body = (
      <div className="auth-card">
        <span className="auth-logo err"><Icon name="error" fill /></span>
        <h1>{eligError.title}</h1>
        <p className="muted">{eligError.message}</p>
        {toPayment
          ? <button className="btn primary wide" onClick={() => { setMethod(null); setView('payment'); }}>Choose another payment method</button>
          : <button className="btn primary wide" onClick={confirmPayment}><Icon name="refresh" /> Try again</button>}
        <button className="btn outline wide" onClick={requestLeave}>Cancel setup</button>
      </div>
    );
  } else if (view === 'procFail') {
    body = (
      <div className="auth-card">
        <span className="auth-logo err"><Icon name="sync_problem" /></span>
        <h1>{procError.title}</h1>
        <p className="muted">{procError.message}</p>
        <div className="alert ok-alert"><Icon name="verified_user" fill /><span><b>You haven't been charged.</b> {isExisting ? 'Nothing changes on your bill' : 'Billing only starts'} once setup finishes.</span></div>
        <button className="btn primary wide" onClick={() => setView('processing')}><Icon name="refresh" /> Try again</button>
        <button className="btn outline wide" onClick={requestLeave}>Cancel setup</button>
        <p className="fineprint">Need help? Contact support with reference <b>{procError.ref}</b>.</p>
      </div>
    );
  } else if (view === 'processing') {
    body = (
      <div className="auth-card left">
        <h1>Setting things up…</h1>
        <ul className="task-list">
          {tasks.map((t, i) => (
            <li key={t.key} className={i < doneTasks ? 'done' : i === doneTasks ? 'active' : ''}>
              {i < doneTasks ? <Icon name="check_circle" fill /> : i === doneTasks ? <span className="mini-spinner" /> : <Icon name="radio_button_unchecked" />}
              {t.label}
            </li>
          ))}
        </ul>
      </div>
    );
  } else if (isUpgrade) {
    const subscription = {
      method: method === 'ctb' ? 'Charge to Bill' : 'Direct Debit',
      detail: method === 'ctb' ? customer.account : ddOption.label,
      price: quote.total, ...verifiedWith, status: 'active', startedOn: new Date().toISOString(), billCycleDay: method === 'ctb' ? customer.billCycleDay : undefined,
    };
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="celebration" fill /></span>
        <h1>Welcome back to {plan.name}!</h1>
        <p className="muted">Premium features are on again for <b>{homeName}</b>.</p>
        <PriceNew price={quote.total} included={quote.included} label="Subscription active" badge="Active" />
        <div className="summary-box">
          <div><span>Payment</span><b>{subscription.method}</b></div>
          <div><span>{method === 'ctb' ? 'Billing account' : 'Paid from'}</span><b>{subscription.detail}</b></div>
          <div><span>Devices on home</span><b>{quote.currentDevices}</b></div>
        </div>
        <button className="btn primary wide" onClick={() => onDone({ subscription })}>OK</button>
      </div>
    );
  } else if (isExisting) {
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="celebration" fill /></span>
        <h1>Camera added!</h1>
        <p className="muted"><b>{deviceName}</b> is now in <b>{roomLabel}</b> in <b>{homeName}</b>.</p>
        {isFreeHome ? <PriceFree done /> : priceUp ? <PriceChange from={quote.currentTotal} to={quote.total} done /> : <PriceSame price={quote.total} used={quote.devicesAfter} included={quote.included} done />}
        <div className="summary-box">
          <div className="sb-title"><Icon name="videocam" /> Paired device</div>
          <div><span>Name</span><b>{deviceName}</b></div>
          <div><span>Type</span><b>{device.brand === '3P' ? '3P · Google Home enabled' : 'Google Nest'}</b></div>
          <div><span>Wi-Fi</span><b>{ssid}</b></div>
          <div><span>Serial number</span><b>{device.serial}</b></div>
          <div><span>Room</span><b>{roomLabel}</b></div>
        </div>
        <div className="summary-box">
          <div className="sb-title"><Icon name="workspace_premium" /> Subscription</div>
          <div><span>Devices on home</span><b>{isFreeHome ? quote.devicesAfter : `${quote.devicesAfter} (up to ${quote.included} included)`}</b></div>
          <div><span>Monthly price</span>{priceUp ? <b className="price-diff"><s>{rm(quote.currentTotal)}</s> {rm(quote.total)}</b> : <b>{rm(quote.total)} {isFreeHome ? '(free plan)' : '(no change)'}</b>}</div>
          {isFreeHome ? <div><span>Plan</span><b>Free</b></div> : <div><span>Billed via</span><b>{home.subscription?.method ?? '—'}</b></div>}
        </div>
        {homeWifi && ssid !== homeWifi && (
          <div className="alert warn"><Icon name="warning" fill /><span>This camera is on <b>{ssid}</b>, but your other devices are on <b>{homeWifi}</b>. Some features may not work. To fix it, set the camera up again on {homeWifi}.</span></div>
        )}
        <p className="note"><Icon name="edit" /><span>To rename the camera or move it to another room, open it and tap <b>Edit</b> (✏️).</span></p>
        <button className="btn primary wide" onClick={() => onDone({
          room: { name: roomLabel },
          device: { type: 'camera', name: deviceName, model: device.model, serial: device.serial, brand: device.brand, wifi: ssid },
          price: quote.total,
        })}>OK</button>
      </div>
    );
  } else {
    const roomName = DEFAULT_ROOM;
    const subscription = {
      method: method === 'ctb' ? 'Charge to Bill' : 'Direct Debit',
      detail: method === 'ctb' ? customer.account : ddOption.label,
      price: quote.total,
      ...verifiedWith,
      status: 'active',
      startedOn: new Date().toISOString(),
      billCycleDay: method === 'ctb' ? customer.billCycleDay : undefined,
    };
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="celebration" fill /></span>
        <h1>You're all set!</h1>
        <p className="muted">Your <b>{plan.name}</b> subscription is <b className="ok-text">active</b>.</p>
        <PriceNew price={quote.total} included={quote.included} label="Subscription active" badge="Active" />
        <div className="summary-box">
          <div className="sb-title"><Icon name="workspace_premium" /> Subscription</div>
          <div><span>Plan</span><b>{plan.name}</b></div>
          <div><span>Price</span><b>{rm(quote.total)}/month</b></div>
          <div><span>Payment</span><b>{subscription.method}</b></div>
          <div><span>{method === 'ctb' ? 'Billing account' : 'Paid from'}</span><b>{subscription.detail}</b></div>
        </div>
        <div className="summary-box">
          <div className="sb-title"><Icon name="home" /> Home</div>
          <div><span>Name</span><b>{homeName.trim()}</b></div>
          <div><span>Powered by</span><b>{ecosystem}</b></div>
          <div><span>Room</span><b>{roomName}</b></div>
        </div>
        <div className="summary-box">
          <div className="sb-title"><Icon name="videocam" /> Paired device</div>
          <div><span>Name</span><b>{deviceName.trim()}</b></div>
          <div><span>Model</span><b>{device.model}</b></div>
          <div><span>Type</span><b>{device.brand === '3P' ? '3P · Google Home enabled' : 'Google Nest'}</b></div>
          <div><span>Wi-Fi</span><b>{ssid}</b></div>
          <div><span>Serial number</span><b>{device.serial}</b></div>
          <div><span>Devices on home</span><b>{quote.devicesAfter} of {quote.included}</b></div>
        </div>
        <p className="note"><Icon name="edit" /><span>Your camera is in <b>{roomName}</b>. To rename your home or rooms, use <b>Home settings</b> (⚙). To rename the camera or move it to another room, open it and tap <b>Edit</b> (✏️).</span></p>
        <button className="btn primary wide" onClick={() => onDone({
          home: { homeName: homeName.trim(), ecosystem, wifi: ssid },
          room: { name: roomName },
          device: { type: 'camera', name: deviceName.trim(), model: device.model, serial: device.serial, brand: device.brand, wifi: ssid },
          subscription,
        })}>OK</button>
      </div>
    );
  }

  return (
    <div className="auth pair">
      {!['processing', 'success'].includes(view) && <button className="icon-btn back-btn" onClick={requestLeave} aria-label="Cancel setup"><Icon name="close" /></button>}
      <Stepper steps={isUpgrade ? STEPS_UPGRADE : isExisting ? STEPS_EXISTING : STEPS} step={(isUpgrade ? STEP_OF_UPGRADE : isExisting ? STEP_OF_EXISTING : STEP_OF)[view]} label="Setup progress" />
      {body}
      <DemoPanel />
      {confirmLeave && (
        <Modal title="Leave setup?" onClose={() => setConfirmLeave(false)}>
          <p className="muted leave-text">Your progress will be lost and you'll need to start again. You haven't been charged.</p>
          <div className="form-actions">
            <button className="btn" onClick={() => { setConfirmLeave(false); onCancel(); }}>Leave setup</button>
            <span className="spacer" />
            <button className="btn primary" onClick={() => setConfirmLeave(false)}>Stay</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

