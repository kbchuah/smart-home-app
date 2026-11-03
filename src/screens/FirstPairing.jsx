import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Stepper from '../components/Stepper.jsx';
import DemoPanel from '../components/DemoPanel.jsx';
import { useDemo, markTried, useTried } from '../demoStore.js';
import { useTacLock, lockTac } from '../tacLock.js';
import {
  QR_CODES, DD_OPTIONS, WIFI_NETWORKS, checkCompatibility, connectWifi, verifyTac, checkTelcoAccount, TAC_LOCK_MINUTES, quotePrice, lookupCustomer, checkEligibility, wait,
} from '../mockBackend.js';

// First device pairing into a NEW home (structure), all mocked:
// create home → scan QR (or key in serial) → compatibility check → price quote → agree
// → TAC → Charge to Bill | Direct Debit → confirm → eligibility check → processing → success

// Pilot: the first home is always "My Home" on Google Home Premium (renamable later in Home settings).
const PILOT_HOME_NAME = 'My Home';
const PILOT_ECOSYSTEM = 'Google Home Premium';
const STEPS = ['Device', 'Wi-Fi', 'Price', 'Verify', 'Payment', 'Done'];
const STEP_OF = { scan: 0, serial: 0, scanFail: 0, compatFail: 0, wifi: 1, wifiFail: 1, price: 2, phone: 3, tac: 3, tacLocked: 3,
  payment: 4, confirm: 4, eligFail: 4, processing: 4, success: 5 };
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

export default function FirstPairing({ plan, account = 'guest', existingHomeNames = [], onCancel, onDone }) {
  const demo = useDemo();
  const isTried = useTried();
  const [view, setView] = useState('scan');
  const tacLockedMins = useTacLock(account);
  const [busy, setBusy] = useState(null);

  // home
  const [homeName] = useState(() => uniqueHomeName(existingHomeNames));
  const ecosystem = PILOT_ECOSYSTEM;
  // device
  const [selectedQr, setSelectedQr] = useState(null);
  const [serial, setSerial] = useState('');
  const [device, setDevice] = useState(null);
  const [compatError, setCompatError] = useState(null);
  // price
  const [quote, setQuote] = useState(null);
  const [agreed, setAgreed] = useState(false);
  // verify
  const [phone, setPhone] = useState('');
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
  // room & name (after activation)
  // Room and camera name use defaults during first pairing; users change them afterwards.
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const run = async (label, fn) => { setBusy(label); try { await fn(); } finally { setBusy(null); } };

  const ddOption = DD_OPTIONS.find((o) => o.id === method);
  const methodLabel = method === 'ctb' ? 'Charge to Bill' : ddOption ? `Direct Debit · ${ddOption.label}` : '';
  const tasks = [
    `Creating ${homeName.trim()} (${ecosystem})`,
    `Registering ${device?.model ?? 'camera'}`,
    `Activating ${plan.name} subscription`,
  ];

  // Processing: tick tasks one by one, then show success.
  useEffect(() => {
    if (view !== 'processing') return;
    if (doneTasks >= tasks.length) { const t = setTimeout(() => { setDeviceName(device.model); setView('success'); }, 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setDoneTasks((n) => n + 1), 800);
    return () => clearTimeout(t);
  }, [view, doneTasks, tasks.length, device]);

  const verifyDevice = (input) => run('Checking device compatibility…', async () => {
    const r = await checkCompatibility({ ...input, override: demo.compat });
    if (!r.ok) { setCompatError(r); setView('compatFail'); return; }
    setDevice(r.device);
    setView('wifi');
  });

  // Camera must be online before we quote and bill.
  const joinWifi = () => run(`Connecting camera to ${ssid}…`, async () => {
    const r = await connectWifi({ ssid, password: wifiPw, override: demo.wifi });
    if (!r.ok) { setWifiError(r); setView('wifiFail'); return; }
    setBusy('Camera is online. Checking for updates…');
    await wait(1000);
    setBusy(`Checking devices on ${homeName.trim()}…`);
    setQuote(await quotePrice({ structureDeviceCount: 0 })); // new home: backend returns 0 devices
    setView('price');
  });

  // Demo: auto-fill a random valid TAC, like SMS autofill (never 000000 / 999999).
  const randomTac = () => String(100000 + Math.floor(Math.random() * 899999));
  const sendTac = () => { setTac(randomTac()); setTacWrong(0); setTacError(null); setTacSentAt(Date.now()); setResendIn(30); };

  // TAC → telco lookup → Charge to Bill pre-check (account status) before showing payment options.
  const submitTac = () => run('Verifying TAC…', async () => {
    const v = await verifyTac({ tac, sentAt: tacSentAt, wrongSoFar: tacWrong, override: demo.tac });
    if (!v.ok) {
      if (v.code === 'locked') { lockTac(account, TAC_LOCK_MINUTES); setView('tacLocked'); return; }
      if (v.code === 'expired') { setTacError({ code: 'expired', text: 'This TAC has expired. Tap “Resend TAC” to get a new one.' }); return; }
      setTacWrong((n) => n + 1); setTac('');
      setTacError({ code: 'wrong', text: `Incorrect TAC. ${v.left} ${v.left === 1 ? 'try' : 'tries'} left.` });
      return;
    }
    setBusy('Checking your telco account…');
    const c = await lookupCustomer(phone);
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
      <p className="muted">For your security, TAC verification on your account is locked. You can't request a TAC for any mobile number for the next <b>{tacLockedMins} minute{tacLockedMins === 1 ? '' : 's'}</b>.</p>
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
        <div className="field-label">Demo: choose a QR code to scan</div>
        <div className="options">
          {QR_CODES.map((q) => (
            <button key={q.id} className={`option compact ${selectedQr?.id === q.id ? 'sel' : ''}`} onClick={() => setSelectedQr(q)}>
              <Icon name="qr_code" />
              <span className="option-body"><b>{q.label}</b><small>{q.hint}</small></span>
              {q.brand && <span className={`brand-tag ${q.brand === 'Nest' ? 'nest' : 'tp'}`}>{q.brand === 'Nest' ? 'Nest' : '3P'}</span>}
            </button>
          ))}
        </div>
        <button className="btn subtle" onClick={() => { setSerial(''); setView('serial'); }}><Icon name="keyboard" /> Key in serial number instead</button>
        <Actions onBack={onCancel} backLabel="Cancel">
          <button className="btn primary" disabled={!selectedQr} onClick={() => {
            if (selectedQr.unreadable || demo.scan === 'unreadable') run('Scanning…', async () => { await wait(1000); setView('scanFail'); });
            else run('Reading QR code…', async () => { await wait(800); await verifyDevice({ qr: selectedQr }); });
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
          <small className="field-hint"><Icon name="science" /> Demo: Nest NC-XX-12345 (e.g. NC-IW-48213) or 3P 3P-XXXX-12345 (e.g. 3P-AERO-20415) passes. Anything else fails.</small></label>
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
      </div>
    );
  } else if (view === 'wifi') {
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ssid) joinWifi(); }}>
        <span className="auth-logo"><Icon name="wifi" /></span>
        <h1>Connect camera to Wi-Fi</h1>
        <p className="muted">Your <b>{device.model}</b> needs Wi-Fi to work. Choose your home network.</p>
        <div className="options">
          {WIFI_NETWORKS.map((n) => (
            <button type="button" key={n.ssid} className={`option compact ${ssid === n.ssid ? 'sel' : ''}`} onClick={() => { setSsid(n.ssid); setWifiPw(DEMO_WIFI_PW); }}>
              <Icon name={n.icon} />
              <span className="option-body"><b>{n.ssid}</b><small>Demo: {n.hint}</small></span>
              <Icon name="lock" className="muted" />
            </button>
          ))}
        </div>
        {ssid && (
          <label className="field"><span>Password for {ssid}</span>
            <input type="password" autoFocus value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} />
            <small className="field-hint"><Icon name="science" /> Demo: password pre-filled. 8+ characters connects; shorter is a wrong password. Not saved.</small></label>
        )}
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
  } else if (view === 'price') {
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="check_circle" fill /></span>
        <h1>Camera is online</h1>
        <p className="muted"><b>{device.model}</b> ({device.brand === '3P' ? 'Works with Google Home' : 'Nest'}) · SN {device.serial} · connected to {ssid}</p>
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
        <p className="muted">You can verify your mobile number again.</p>
        <button className="btn primary wide" onClick={() => { setPhone(''); setView('phone'); }}>Continue</button>
      </div>
    );
  } else if (view === 'phone') {
    const ok = /^01\d{8,9}$/.test(phone);
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ok) run('Sending TAC…', async () => { markTried(phoneKey(phone)); await wait(900); sendTac(); setView('tac'); }); }}>
        <span className="auth-logo"><Icon name="sms" /></span>
        <h1>Verify your mobile number</h1>
        <p className="muted">We'll send a TAC to check if you're an existing telco customer, so we can offer the best way to pay.</p>
        <label className="field"><span>Mobile number</span>
          <div className="phone-input"><span>+60</span>
            <input autoFocus inputMode="tel" value={fmtPhone(phone)} placeholder="012-345 6789" onChange={(e) => setPhone(digits(e.target.value).slice(0, 11))} /></div></label>
        <div className="field-label">Demo: tap a number to use it</div>
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
        <Actions onBack={() => setView('price')}><button className="btn primary" disabled={!ok}>Send TAC</button></Actions>
      </form>
    );
  } else if (view === 'tac') {
    const ok = /^\d{6}$/.test(tac);
    const expired = tacError?.code === 'expired';
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ok && !expired) submitTac(); }}>
        <h1>Enter TAC</h1>
        <p className="muted">We sent a 6-digit TAC to <b>+60 {fmtPhone(phone)}</b>. It's valid for 5 minutes.</p>
        <label className="field"><span>TAC</span>
          <input autoFocus className={`tac-input ${tacError ? 'invalid' : ''}`} inputMode="numeric" maxLength={6} value={tac} placeholder="••••••"
            disabled={expired} onChange={(e) => { setTac(digits(e.target.value)); if (tacError?.code === 'wrong') setTacError(null); }} />
          {tacError
            ? <small className="field-error"><Icon name="error" /> {tacError.text}</small>
            : <small className="field-hint"><Icon name="science" /> Demo: TAC auto-filled from “SMS”. Any 6 digits pass. 000000 = incorrect, 999999 = expired.</small>}
        </label>
        <button type="button" className="btn subtle" disabled={resendIn > 0} onClick={sendTac}>{resendIn > 0 ? `Resend TAC in ${resendIn}s` : 'Resend TAC'}</button>
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
            ? <>You're an existing telco customer. You can add this subscription to your monthly bill.</>
            : <>We couldn't find a telco account for <b>+60 {fmtPhone(phone)}</b>. Your subscription will be paid by Direct Debit.</>}</p>
        )}
        {customer && (<>
          <div className="field-label">{ctbNotice ? 'Charge to Bill' : 'Recommended'}</div>
          <div className="options">{opt('ctb', 'receipt_long', 'Charge to Bill', `Billing account ${customer.account} · ${customer.plan}`)}</div>
        </>)}
        <div className="field-label">Direct Debit</div>
        <div className="options">
          {DD_OPTIONS.map((o) => opt(o.id, o.kind === 'card' ? 'credit_card' : 'account_balance', o.label, `Demo: ${o.hint}`))}
        </div>
        <small className="field-hint"><Icon name="science" /> Demo only. No real card or bank details are collected.</small>
        <Actions onBack={() => setView('phone')}><button className="btn primary" disabled={!method || blocked[method]} onClick={() => setView('confirm')}>Continue</button></Actions>
      </div>
    );
  } else if (view === 'confirm') {
    body = (
      <div className="auth-card left">
        <h1>Confirm and subscribe</h1>
        <div className="summary-box">
          <div><span>Home</span><b>{homeName.trim()}</b></div>
          <div><span>Device</span><b>{device.model}</b></div>
          <div><span>Plan</span><b>{plan.name}</b></div>
          <div><span>Payment</span><b>{methodLabel}</b></div>
          {method === 'ctb' && <div><span>Billing account</span><b>{customer.account}</b></div>}
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
        <button className="btn outline wide" onClick={onCancel}>Cancel setup</button>
      </div>
    );
  } else if (view === 'processing') {
    body = (
      <div className="auth-card left">
        <h1>Setting things up…</h1>
        <ul className="task-list">
          {tasks.map((t, i) => (
            <li key={t} className={i < doneTasks ? 'done' : i === doneTasks ? 'active' : ''}>
              {i < doneTasks ? <Icon name="check_circle" fill /> : i === doneTasks ? <span className="mini-spinner" /> : <Icon name="radio_button_unchecked" />}
              {t}
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    const roomName = DEFAULT_ROOM;
    const subscription = {
      method: method === 'ctb' ? 'Charge to Bill' : 'Direct Debit',
      detail: method === 'ctb' ? customer.account : ddOption.label,
      price: quote.total,
      phone,
    };
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="celebration" fill /></span>
        <h1>You're all set!</h1>
        <p className="muted">Your <b>{plan.name}</b> subscription is <b className="ok-text">active</b>.</p>
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
          home: { homeName: homeName.trim(), ecosystem },
          room: { name: roomName },
          device: { type: 'camera', name: deviceName.trim(), model: device.model, serial: device.serial, brand: device.brand },
          subscription,
        })}>OK</button>
      </div>
    );
  }

  return (
    <div className="auth pair">
      {!['processing', 'success'].includes(view) && <button className="icon-btn back-btn" onClick={onCancel} aria-label="Cancel setup"><Icon name="close" /></button>}
      <Stepper steps={STEPS} step={STEP_OF[view]} label="Setup progress" />
      {body}
      <DemoPanel />
    </div>
  );
}

