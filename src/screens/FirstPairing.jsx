import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Stepper from '../components/Stepper.jsx';
import DemoPanel from '../components/DemoPanel.jsx';
import { useDemo } from '../demoStore.js';
import { ECOSYSTEMS } from './PairDevice.jsx';
import {
  QR_CODES, DD_OPTIONS, WIFI_NETWORKS, checkCompatibility, connectWifi, quotePrice, lookupCustomer, checkEligibility, wait,
} from '../mockBackend.js';

// First device pairing into a NEW home (structure), all mocked:
// create home → scan QR (or key in serial) → compatibility check → price quote → agree
// → TAC → Charge to Bill | Direct Debit → confirm → eligibility check → processing → success

const STEPS = ['Home', 'Device', 'Wi-Fi', 'Price', 'Verify', 'Payment', 'Room', 'Done'];
const STEP_OF = { home: 0, scan: 1, serial: 1, scanFail: 1, compatFail: 1, wifi: 2, wifiFail: 2, price: 3, phone: 4, tac: 4,
  payment: 5, confirm: 5, eligFail: 5, processing: 5, roomName: 6, success: 7 };
const DEFAULT_ROOM = 'My room';
const ROOM_SUGGESTIONS = ['Living Room', 'Front Door', 'Porch', 'Garage', 'Backyard', 'Kitchen', 'Bedroom', 'Hallway'];

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

export default function FirstPairing({ plan, onCancel, onDone }) {
  const demo = useDemo();
  const [view, setView] = useState('home');
  const [busy, setBusy] = useState(null);

  // home
  const [homeName, setHomeName] = useState('My home');
  const [ecosystem, setEcosystem] = useState(ECOSYSTEMS[0].id); // defaults to Google Home Premium
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
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [customRoom, setCustomRoom] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);

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
    if (doneTasks >= tasks.length) { const t = setTimeout(() => { setDeviceName(device.model); setView('roomName'); }, 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setDoneTasks((n) => n + 1), 800);
    return () => clearTimeout(t);
  }, [view, doneTasks, tasks.length, device]);

  const verifyDevice = (input) => run('Checking device compatibility…', async () => {
    const r = await checkCompatibility({ ...input, override: demo.compat });
    if (!r.ok) { setCompatError(r.reason); setView('compatFail'); return; }
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

  let body;
  if (busy) {
    body = <div className="auth-card"><Spinner label={busy} /></div>;
  } else if (view === 'home') {
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (homeName.trim()) setView('scan'); }}>
        <span className="auth-logo"><Icon name="add_home" /></span>
        <h1>Create your home</h1>
        <p className="muted">Your first device will be added to this home. You can rename it later.</p>
        <label className="field"><span>Home name</span>
          <input value={homeName} onChange={(e) => setHomeName(e.target.value)} /></label>
        <div className="field-label">Smart home system</div>
        <div className="options">
          {ECOSYSTEMS.map((eco) => (
            <button type="button" key={eco.id} className={`option compact ${ecosystem === eco.id ? 'sel' : ''}`} onClick={() => setEcosystem(eco.id)}>
              <span className="option-icon"><Icon name={eco.icon} fill={ecosystem === eco.id} /></span>
              <span className="option-body"><b>{eco.id}</b>{eco.id === ECOSYSTEMS[0].id && <small>Default</small>}</span>
              <Icon name={ecosystem === eco.id ? 'radio_button_checked' : 'radio_button_unchecked'} className="option-radio" />
            </button>
          ))}
        </div>
        <small className="field-hint"><Icon name="info" /> Homes must be located in Malaysia.</small>
        <Actions onBack={onCancel} backLabel="Cancel"><button className="btn primary" disabled={!homeName.trim()}>Next</button></Actions>
      </form>
    );
  } else if (view === 'scan') {
    body = (
      <div className="auth-card left">
        <h1>Scan your camera's QR code</h1>
        <p className="muted">Find the QR code on the back or bottom of your camera.</p>
        <div className="viewfinder small"><span className="vf-corner" /><Icon name="qr_code_2" /><span className="vf-line" /></div>
        <div className="field-label">Demo: choose a QR code to scan</div>
        <div className="options">
          {QR_CODES.map((q) => (
            <button key={q.id} className={`option compact ${selectedQr?.id === q.id ? 'sel' : ''}`} onClick={() => setSelectedQr(q)}>
              <Icon name="qr_code" />
              <span className="option-body"><b>{q.label}</b><small>{q.hint}</small></span>
            </button>
          ))}
        </div>
        <button className="btn subtle" onClick={() => { setSerial(''); setView('serial'); }}><Icon name="keyboard" /> Key in serial number instead</button>
        <Actions onBack={() => setView('home')}>
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
        <p className="muted">The serial number is printed under the QR code, starting with “NC-”.</p>
        <label className="field"><span>Serial number</span>
          <input autoFocus value={serial} placeholder="NC-IW-12345" onChange={(e) => setSerial(e.target.value.toUpperCase())} />
          <small className="field-hint"><Icon name="science" /> Demo: any NC-XX-12345 passes, e.g. NC-IW-48213. Anything else fails.</small></label>
        <Actions onBack={() => setView('scan')}><button className="btn primary" disabled={!serial.trim()}>Check device</button></Actions>
      </form>
    );
  } else if (view === 'scanFail' || view === 'compatFail') {
    const scan = view === 'scanFail';
    body = (
      <div className="auth-card">
        <span className="auth-logo err"><Icon name={scan ? 'qr_code_2' : 'error'} fill /></span>
        <h1>{scan ? "Couldn't read the QR code" : 'Device not compatible'}</h1>
        <p className="muted">{scan ? 'The code may be damaged or too far away. Try scanning again, or key in the serial number.' : compatError}</p>
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
            <button type="button" key={n.ssid} className={`option compact ${ssid === n.ssid ? 'sel' : ''}`} onClick={() => setSsid(n.ssid)}>
              <Icon name={n.icon} />
              <span className="option-body"><b>{n.ssid}</b><small>Demo: {n.hint}</small></span>
              <Icon name="lock" className="muted" />
            </button>
          ))}
        </div>
        {ssid && (
          <label className="field"><span>Password for {ssid}</span>
            <input type="password" autoFocus value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} />
            <small className="field-hint"><Icon name="science" /> Demo: 8+ characters connects; shorter is a wrong password. Not saved.</small></label>
        )}
        <Actions onBack={() => setView('scan')}><button className="btn primary" disabled={!ssid || !wifiPw}>Connect</button></Actions>
      </form>
    );
  } else if (view === 'wifiFail') {
    const act = { password: ['Re-enter password', 'key', () => { setWifiPw(''); setView('wifi'); }],
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
        <p className="muted"><b>{device.model}</b> · SN {device.serial} · connected to {ssid}</p>
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
  } else if (view === 'phone') {
    const ok = /^01\d{8,9}$/.test(phone);
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ok) run('Sending TAC…', async () => { await wait(900); setTac(''); setResendIn(30); setView('tac'); }); }}>
        <span className="auth-logo"><Icon name="sms" /></span>
        <h1>Verify your mobile number</h1>
        <p className="muted">We'll send a TAC to check if you're an existing telco customer, so we can offer the best way to pay.</p>
        <label className="field"><span>Mobile number</span>
          <div className="phone-input"><span>+60</span>
            <input autoFocus inputMode="tel" value={fmtPhone(phone)} placeholder="012-345 6789" onChange={(e) => setPhone(digits(e.target.value).slice(0, 11))} /></div></label>
        <div className="demo-hint"><Icon name="science" /><span>
          Demo numbers:{' '}
          {[['0123456789', 'telco, eligible'], ['0121111111', 'telco, spend limit'], ['0122222222', 'telco, inactive'], ['0123333333', 'telco, timeout once']].map(([n, l]) => (
            <span key={n} className="demo-num"><button type="button" onClick={() => setPhone(n)}>{fmtPhone(n)}</button> {l}</span>
          ))}
          <span className="demo-num">Any other number: not a telco customer → Direct Debit</span>
        </span></div>
        <Actions onBack={() => setView('price')}><button className="btn primary" disabled={!ok}>Send TAC</button></Actions>
      </form>
    );
  } else if (view === 'tac') {
    const ok = /^\d{6}$/.test(tac);
    body = (
      <form className="auth-card left" onSubmit={(e) => {
        e.preventDefault();
        if (ok) run('Verifying TAC and checking your telco account…', async () => {
          const c = await lookupCustomer(phone);
          setCustomer(c); setBlocked({}); setMethod(c ? 'ctb' : null); setAttempts(0);
          setView('payment');
        });
      }}>
        <h1>Enter TAC</h1>
        <p className="muted">We sent a 6-digit TAC to <b>+60 {fmtPhone(phone)}</b>.</p>
        <label className="field"><span>TAC</span>
          <input autoFocus className="tac-input" inputMode="numeric" maxLength={6} value={tac} placeholder="••••••" onChange={(e) => setTac(digits(e.target.value))} />
          <small className="field-hint"><Icon name="science" /> Demo: any 6 digits work.</small></label>
        <button type="button" className="btn subtle" disabled={resendIn > 0} onClick={() => setResendIn(30)}>{resendIn > 0 ? `Resend TAC in ${resendIn}s` : 'Resend TAC'}</button>
        <Actions onBack={() => setView('phone')}><button className="btn primary" disabled={!ok}>Verify</button></Actions>
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
        <p className="muted">{customer
          ? <>You're an existing telco customer. You can add this subscription to your monthly bill.</>
          : <>We couldn't find a telco account for <b>+60 {fmtPhone(phone)}</b>. Your subscription will be paid by Direct Debit.</>}</p>
        {customer && (<>
          <div className="field-label">Recommended</div>
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
  } else if (view === 'roomName') {
    const pick = (r) => { setRoom(r); setCustomRoom(''); if (!nameEdited) setDeviceName(r === DEFAULT_ROOM ? device.model : `${r} camera`); };
    const finalRoom = customRoom.trim() || room;
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (deviceName.trim() && finalRoom) setView('success'); }}>
        <span className="auth-logo ok"><Icon name="check_circle" fill /></span>
        <h1>Subscription active. Where is your camera?</h1>
        <p className="muted">Choose a room and name for your camera, or keep the defaults. You can change these later.</p>
        <div className="field-label">Room</div>
        <div className="chips">
          {[DEFAULT_ROOM, ...ROOM_SUGGESTIONS].map((r) => (
            <button type="button" key={r} className={!customRoom.trim() && room === r ? 'sel' : ''} onClick={() => pick(r)}>{r}</button>
          ))}
        </div>
        <label className="field"><span>Or add a custom room</span>
          <input value={customRoom} placeholder="e.g. Car porch" onChange={(e) => {
            setCustomRoom(e.target.value);
            if (!nameEdited) setDeviceName(e.target.value.trim() ? `${e.target.value.trim()} camera` : device.model);
          }} /></label>
        <label className="field"><span>Camera name</span>
          <input value={deviceName} onChange={(e) => { setDeviceName(e.target.value); setNameEdited(true); }} />
          <small className="field-hint"><Icon name="info" /> Shown on your home screen and used for voice commands.</small></label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => { setRoom(DEFAULT_ROOM); setCustomRoom(''); setDeviceName(device.model); setView('success'); }}>Use defaults</button>
          <span className="spacer" />
          <button className="btn primary" disabled={!deviceName.trim() || !finalRoom}>Save</button>
        </div>
      </form>
    );
  } else {
    const roomName = customRoom.trim() || room;
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
          <div><span>Wi-Fi</span><b>{ssid}</b></div>
          <div><span>Serial number</span><b>{device.serial}</b></div>
          <div><span>Devices on home</span><b>{quote.devicesAfter} of {quote.included}</b></div>
        </div>
        <button className="btn primary wide" onClick={() => onDone({
          home: { homeName: homeName.trim(), ecosystem },
          room: { name: roomName },
          device: { type: 'camera', name: deviceName.trim(), model: device.model, serial: device.serial },
          subscription,
        })}>OK</button>
      </div>
    );
  }

  return (
    <div className="auth pair">
      {!['processing', 'roomName', 'success'].includes(view) && <button className="icon-btn back-btn" onClick={onCancel} aria-label="Cancel setup"><Icon name="close" /></button>}
      <Stepper steps={STEPS} step={STEP_OF[view]} label="Setup progress" />
      {body}
      <DemoPanel />
    </div>
  );
}

