import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import Stepper from '../components/Stepper.jsx';

// Mirrors the Google Home "Add > Device > New device" flow, all mocked:
// [new users only: create home → choose system] → device type → scan code → Wi-Fi → room → name → done

export const ECOSYSTEMS = [
  { id: 'Google Home Premium', icon: 'home', desc: 'Works with Google Assistant and Nest cameras, speakers and displays.' },
  { id: 'Samsung SmartThings', icon: 'hub', desc: 'Connect SmartThings and Zigbee/Matter devices.' },
  { id: 'Apple Home', icon: 'phone_iphone', desc: 'Control HomeKit and Matter accessories.' },
];

const DEVICE_OPTIONS = [
  { type: 'camera', label: 'Camera', icon: 'videocam', ready: true },
  { type: 'speaker', label: 'Speaker', icon: 'speaker' },
  { type: 'display', label: 'Smart display', icon: 'tablet' },
  { type: 'light', label: 'Light', icon: 'lightbulb' },
  { type: 'plug', label: 'Smart plug', icon: 'power' },
  { type: 'thermostat', label: 'Aircond / thermostat', icon: 'thermostat' },
  { type: 'lock', label: 'Door lock', icon: 'lock' },
  { type: 'doorbell', label: 'Doorbell', icon: 'doorbell' },
];

const MY_STATES = ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang',
  'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya'];

const ROOM_SUGGESTIONS = ['Living Room', 'Front Door', 'Backyard', 'Garage', 'Porch', 'Kitchen', 'Bedroom', 'Hallway', 'Office'];
const WIFI_NETWORKS = [
  { ssid: 'unifi-home-5G', strength: 'wifi' },
  { ssid: 'unifi-home-2.4G', strength: 'wifi' },
  { ssid: 'TIME-Fibre-8821', strength: 'wifi_2_bar' },
  { ssid: 'Neighbour_Guest', strength: 'wifi_1_bar' },
];

const LABELS = { home: 'Home', system: 'System', device: 'Device', scan: 'Scan', wifi: 'Wi-Fi', room: 'Room', name: 'Name' };

function Spinner({ label }) {
  return <div className="spinner-wrap"><div className="spinner" /><p>{label}</p></div>;
}

export default function PairDevice({ home, presetRoomId, onCancel, onDone }) {
  const isNew = !home;
  const steps = isNew ? ['home', 'system', 'device', 'scan', 'wifi', 'room', 'name', 'done'] : ['device', 'scan', 'wifi', 'room', 'name', 'done'];
  const [i, setI] = useState(0);
  const key = steps[i];
  const [busy, setBusy] = useState(null);

  // home + system (new users)
  const [homeName, setHomeName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [state, setState] = useState('');
  const [ecosystem, setEcosystem] = useState(home?.ecosystem ?? null);
  // device
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [wifi, setWifi] = useState(null);
  const [wifiPw, setWifiPw] = useState('');
  const presetRoom = home?.rooms.find((r) => r.id === presetRoomId);
  const [room, setRoom] = useState(presetRoom ? { id: presetRoom.id, name: presetRoom.name } : null);
  const [customRoom, setCustomRoom] = useState('');
  const [deviceName, setDeviceName] = useState('');

  const back = () => (i === 0 ? onCancel() : setI(i - 1));
  const next = (label, ms = 1200) => {
    if (!label) return setI(i + 1);
    setBusy(label);
    setTimeout(() => { setBusy(null); setI((x) => x + 1); }, ms);
  };

  const existingRooms = home?.rooms ?? [];
  const suggestions = ROOM_SUGGESTIONS.filter((n) => !existingRooms.some((r) => r.name.toLowerCase() === n.toLowerCase()));
  const pickRoom = (r) => { setRoom(r); setCustomRoom(''); };
  const roomChosen = room || customRoom.trim();
  const finalRoom = room ?? { id: null, name: customRoom.trim() };
  const homeLabel = isNew ? homeName.trim() : home.homeName;

  const footer = (primary) => (
    <div className="form-actions">
      <button type="button" className="btn" onClick={back}>{i === 0 ? 'Cancel' : 'Back'}</button>
      <span className="spacer" />
      {primary}
    </div>
  );

  let body;
  if (busy) {
    body = <div className="auth-card"><Spinner label={busy} /></div>;
  } else if (key === 'home') {
    const ok = homeName.trim() && city.trim() && /^\d{5}$/.test(postcode) && state;
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (ok) next(); }}>
        <span className="auth-logo"><Icon name="add_home" /></span>
        <h1>Create a home</h1>
        <p className="muted">Your devices will be added to this home. You can invite family members later.</p>
        <label className="field"><span>Home nickname</span>
          <input autoFocus value={homeName} onChange={(e) => setHomeName(e.target.value)} placeholder="e.g. Family home" /></label>
        <label className="field"><span>Street address</span>
          <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="e.g. 12, Jalan Bukit Bintang" /></label>
        <div className="field-row">
          <label className="field"><span>City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kuala Lumpur" /></label>
          <label className="field"><span>Postcode</span>
            <input value={postcode} inputMode="numeric" maxLength={5} onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ''))} placeholder="50200" /></label>
        </div>
        <label className="field"><span>State</span>
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="" disabled>Select a state</option>
            {MY_STATES.map((s) => <option key={s}>{s}</option>)}
          </select></label>
        <label className="field"><span>Country</span><input value="Malaysia" readOnly />
          <small className="field-hint"><Icon name="info" /> Hearth is only available in Malaysia.</small></label>
        {footer(<button className="btn primary" disabled={!ok}>Next</button>)}
      </form>
    );
  } else if (key === 'system') {
    body = (
      <div className="auth-card left">
        <h1>Choose a smart home system</h1>
        <p className="muted"><b>{homeLabel}</b> will be powered by this system. You can't change it later.</p>
        <div className="options">
          {ECOSYSTEMS.map((e) => (
            <button key={e.id} className={`option ${ecosystem === e.id ? 'sel' : ''}`} onClick={() => setEcosystem(e.id)}>
              <span className="option-icon"><Icon name={e.icon} fill={ecosystem === e.id} /></span>
              <span className="option-body"><b>{e.id}</b><small>{e.desc}</small></span>
              <Icon name={ecosystem === e.id ? 'radio_button_checked' : 'radio_button_unchecked'} className="option-radio" />
            </button>
          ))}
        </div>
        {footer(<button className="btn primary" disabled={!ecosystem} onClick={() => next(`Creating ${homeLabel}…`, 1000)}>Create home</button>)}
      </div>
    );
  } else if (key === 'device') {
    body = (
      <div className="auth-card left">
        <h1>What are you setting up?</h1>
        <p className="muted">Adding to <b>{homeLabel}</b> · <Icon name="hub" /> {ecosystem}</p>
        <div className="type-grid big">
          {DEVICE_OPTIONS.map((d) => (
            <button key={d.type} disabled={!d.ready} className={d.ready ? 'sel' : ''} onClick={() => d.ready && next()}>
              <Icon name={d.icon} fill={d.ready} />
              <span>{d.label}</span>
              {!d.ready && <small className="soon">Coming soon</small>}
            </button>
          ))}
        </div>
        {footer(null)}
      </div>
    );
  } else if (key === 'scan') {
    const codeOk = /^\d{8}$/.test(code);
    body = (
      <div className="auth-card left">
        <h1>{manual ? 'Enter setup code' : 'Scan the QR code'}</h1>
        {manual ? (<>
          <p className="muted">Find the 8-digit code under the QR code on the back or bottom of your camera.</p>
          <label className="field"><span>Setup code</span>
            <input autoFocus inputMode="numeric" maxLength={8} value={code} placeholder="12345678"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></label>
          <button className="btn subtle" onClick={() => setManual(false)}><Icon name="qr_code_scanner" /> Scan QR code instead</button>
          {footer(<button className="btn primary" disabled={!codeOk} onClick={() => next('Connecting to camera…')}>Next</button>)}
        </>) : (<>
          <p className="muted">Point your phone at the QR code on the back or bottom of your camera.</p>
          <div className="viewfinder"><span className="vf-corner" /><Icon name="qr_code_2" /><span className="vf-line" /></div>
          <button className="btn subtle" onClick={() => setManual(true)}>Can't scan code?</button>
          {footer(<button className="btn primary" onClick={() => next('Code found. Connecting to camera…', 1500)}>
            <Icon name="qr_code_scanner" /> Simulate scan</button>)}
        </>)}
      </div>
    );
  } else if (key === 'wifi') {
    body = (
      <div className="auth-card left">
        <h1>Connect to Wi-Fi</h1>
        <p className="muted">Choose the network your camera will use.</p>
        <div className="options">
          {WIFI_NETWORKS.map((n) => (
            <button key={n.ssid} className={`option compact ${wifi === n.ssid ? 'sel' : ''}`} onClick={() => { setWifi(n.ssid); setWifiPw(''); }}>
              <Icon name={n.strength} /> <span className="option-body"><b>{n.ssid}</b></span> <Icon name="lock" className="muted" />
            </button>
          ))}
        </div>
        {wifi && (
          <label className="field"><span>Password for {wifi}</span>
            <input type="password" value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} placeholder="Any value works in this demo" />
            <small className="field-hint"><Icon name="science" /> Demo only. The password isn't saved or sent anywhere.</small></label>
        )}
        {footer(<button className="btn primary" disabled={!wifi} onClick={() => next(`Connecting camera to ${wifi}…`, 1600)}>Connect</button>)}
      </div>
    );
  } else if (key === 'room') {
    body = (
      <div className="auth-card left">
        <h1>Where is this camera?</h1>
        <p className="muted">Choose a room in <b>{homeLabel}</b>. This helps you find and control it.</p>
        {existingRooms.length > 0 && (<>
          <div className="field-label">Your rooms</div>
          <div className="chips">
            {existingRooms.map((r) => (
              <button key={r.id} className={room?.id === r.id ? 'sel' : ''} onClick={() => pickRoom({ id: r.id, name: r.name })}>{r.name}</button>
            ))}
          </div>
        </>)}
        <div className="field-label">{existingRooms.length ? 'Suggested rooms' : 'Choose a room'}</div>
        <div className="chips">
          {suggestions.map((n) => (
            <button key={n} className={room && !room.id && room.name === n ? 'sel' : ''} onClick={() => pickRoom({ id: null, name: n })}>{n}</button>
          ))}
        </div>
        <label className="field"><span>Or add a custom room</span>
          <input value={customRoom} placeholder="e.g. Car porch"
            onChange={(e) => { setCustomRoom(e.target.value); setRoom(null); }} /></label>
        {footer(<button className="btn primary" disabled={!roomChosen}
          onClick={() => { if (!deviceName) setDeviceName(`${finalRoom.name} camera`); next(); }}>Next</button>)}
      </div>
    );
  } else if (key === 'name') {
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (deviceName.trim()) next('Finishing setup…', 1000); }}>
        <h1>Name your camera</h1>
        <p className="muted">Pick a name that's easy to recognise, like where it's mounted.</p>
        <label className="field"><span>Camera name</span>
          <input autoFocus value={deviceName} onChange={(e) => setDeviceName(e.target.value)} /></label>
        {footer(<button className="btn primary" disabled={!deviceName.trim()}>Next</button>)}
      </form>
    );
  } else {
    body = (
      <div className="auth-card">
        <span className="auth-logo ok"><Icon name="check_circle" fill /></span>
        <h1>Camera is ready</h1>
        <p className="muted"><b>{deviceName.trim()}</b> was added to <b>{finalRoom.name}</b> in <b>{homeLabel}</b>.</p>
        <button className="btn primary wide" onClick={() => onDone({
          home: isNew ? { homeName: homeLabel, ecosystem, address: { street, city, postcode, state, country: 'Malaysia' } } : null,
          room: finalRoom,
          device: { type: 'camera', name: deviceName.trim() },
        })}>
          Done <Icon name="arrow_forward" />
        </button>
      </div>
    );
  }

  const shown = steps.slice(0, -1);
  return (
    <div className="auth pair">
      <button className="icon-btn back-btn" onClick={onCancel} aria-label="Cancel setup"><Icon name="close" /></button>
      {key !== 'done' && <Stepper steps={shown.map((s) => LABELS[s])} step={i} label="Setup progress" />}
      {body}
    </div>
  );
}
