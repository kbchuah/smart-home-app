import { useState } from 'react';
import Icon from './Icon.jsx';
import { useDemoReveal } from '../demoStore.js';
import Modal from './Modal.jsx';
import { WIFI_NETWORKS, connectWifi } from '../mockBackend.js';

const DEMO_WIFI_PW = 'homewifi123';

// Move an existing device to another Wi-Fi network (mocked connection check).
export default function WifiChange({ device, current, homeWifi, onClose, onChanged }) {
  const showDemo = useDemoReveal();
  const [ssid, setSsid] = useState(homeWifi ?? current);
  const [pw, setPw] = useState(DEMO_WIFI_PW);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const connect = async () => {
    setBusy(true); setError(null);
    const r = await connectWifi({ ssid, password: pw });
    setBusy(false);
    if (!r.ok) { setError(r); return; }
    onChanged(ssid);
  };

  return (
    <Modal title="Change Wi-Fi" onClose={onClose}>
      <p className="sheet-sub">{device.name} is on <b>{current}</b></p>
      {busy ? (
        <div className="spinner-wrap"><div className="spinner" /><p>Connecting {device.name} to {ssid}…</p></div>
      ) : (
        <form className="form" onSubmit={(e) => { e.preventDefault(); if (ssid && pw) connect(); }}>
          <div className="options">
            {WIFI_NETWORKS.map((n) => (
              <button type="button" key={n.ssid} className={`option compact ${ssid === n.ssid ? 'sel' : ''}`} onClick={() => { setSsid(n.ssid); setPw(DEMO_WIFI_PW); setError(null); }}>
                <Icon name={n.icon} />
                <span className="option-body"><b>{n.ssid}</b>
                  <small>{homeWifi === n.ssid && <span className="net-tag">Home network</span>}{current === n.ssid ? 'Current' : ''}{showDemo && `${current === n.ssid ? ' · ' : ''}Demo: ${n.hint}`}</small></span>
                <Icon name={ssid === n.ssid ? 'radio_button_checked' : 'radio_button_unchecked'} className="option-radio" />
              </button>
            ))}
          </div>
          {homeWifi && ssid !== homeWifi && (
            <div className="alert warn"><Icon name="warning" fill /><span><b>{ssid} isn't your home network.</b> Your other devices are on <b>{homeWifi}</b>, so your service might be impacted.</span></div>
          )}
          <label className="field"><span>Password for {ssid}</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            {showDemo && <small className="field-hint"><Icon name="science" /> Demo: password pre-filled. Not saved.</small>}</label>
          {error && <div className="alert err-alert"><Icon name="wifi_off" /><span><b>{error.title}.</b> {error.message}</span></div>}
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <span className="spacer" />
            <button className="btn primary" disabled={!ssid || !pw || ssid === current}>Connect</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
