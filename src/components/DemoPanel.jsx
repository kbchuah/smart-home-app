import { useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import { useDemo, setDemo, resetDemo, DEMO_CONTROLS, DEMO_DEFAULTS } from '../demoStore.js';
import { QR_CODES, TELCO_CUSTOMERS, DD_OPTIONS, FAILURES, WIFI_NETWORKS, WIFI_FAILURES, TAC_MAX_TRIES, TAC_LOCK_MINUTES } from '../mockBackend.js';

const fmtPhone = (n) => `${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6)}`;
const ELIG_TEXT = { ok: 'passes', spend_limit: 'spend limit reached', inactive: 'account inactive', timeout_once: 'timeout on 1st try, then passes' };
const telcoText = (c) => (c.status !== 'ok'
  ? `After TAC: ${ELIG_TEXT[c.status]} → Charge to Bill not offered, Direct Debit only`
  : `After TAC: Charge to Bill offered · At Confirm: ${ELIG_TEXT[c.eligibility]}`);
const BACK_TO = { payment: 'Payment method screen (failed option disabled)', confirm: 'Stays on confirm screen: “Try again”' };

export default function DemoPanel() {
  const demo = useDemo();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('simulate');
  const active = Object.keys(DEMO_DEFAULTS).filter((k) => demo[k] !== DEMO_DEFAULTS[k]).length;

  return (<>
    <button className="demo-fab" onClick={() => setOpen(true)} aria-label="Open demo simulator">
      <Icon name="science" fill /> Demo{active > 0 && <span className="demo-badge">{active}</span>}
    </button>
    {open && (
      <Modal title="Demo simulator" onClose={() => setOpen(false)}>
        <div className="segmented demo-tabs">
          <button className={tab === 'simulate' ? 'active' : ''} onClick={() => setTab('simulate')}><Icon name="tune" /> Simulate</button>
          <button className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}><Icon name="menu_book" /> What does what</button>
        </div>

        {tab === 'simulate' ? (
          <div className="demo-sim">
            <p className="muted">Force the result of each mocked check. “Auto” uses the test data you pick in the flow (see “What does what”).</p>
            {DEMO_CONTROLS.map((c) => (
              <label key={c.key} className="field">
                <span>{c.label}</span>
                <select value={demo[c.key]} onChange={(e) => setDemo({ [c.key]: e.target.value })}>
                  {c.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            ))}
            <p className="note"><Icon name="info" /> A forced billing result applies to whichever payment method you choose.</p>
            <div className="form-actions">
              <button className="btn" onClick={resetDemo} disabled={!active}><Icon name="restart_alt" /> Reset all to Auto</button>
              <span className="spacer" />
              <button className="btn primary" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        ) : (
          <div className="demo-guide">
            <h4>QR codes</h4>
            <table><tbody>
              {QR_CODES.map((q) => <tr key={q.id}><td>{q.brand ? `${q.brand} · ` : ''}{q.label}</td><td>{q.unreadable ? "Can't read → Scan again / Key in serial" : q.compatible ? 'Compatible' : `${q.registered ? 'Device already registered' : 'Device not compatible'} → Scan again / Key in serial`}</td></tr>)}
            </tbody></table>
            <h4>Serial numbers</h4>
            <table><tbody>
              <tr><td>NC-XX-12345 (e.g. NC-IW-48213)</td><td>Nest · Compatible</td></tr>
              <tr><td>3P-XXXX-12345 (e.g. 3P-AERO-20415)</td><td>3P Google Home enabled · Compatible</td></tr>
              <tr><td>NC-IW-11002</td><td>Device already registered</td></tr>
              <tr><td>Anything else</td><td>Not found</td></tr>
            </tbody></table>
            <h4>Wi-Fi networks (password: 8+ characters, shorter = wrong password)</h4>
            <table><tbody>
              {WIFI_NETWORKS.map((n) => <tr key={n.ssid}><td>{n.ssid}</td><td>{n.hint}</td></tr>)}
            </tbody></table>
            <h4>Wi-Fi failures: what the user sees</h4>
            <table className="fail-table"><thead><tr><th>Failure</th><th>Message</th><th>Options</th></tr></thead><tbody>
              {Object.entries(WIFI_FAILURES).map(([k, f]) => <tr key={k}><td><b>{f.title}</b></td><td>{f.message}</td>
                <td>{f.actions.map((a) => ({ password: 'Re-enter password', network: 'Choose another network', retry: 'Try again' }[a])).join(' · ')}</td></tr>)}
            </tbody></table>
            <p className="note"><Icon name="info" /> Wi-Fi is checked before pricing and payment, so customers are only billed for a camera that's online.</p>
            <h4>TAC</h4>
            <table><tbody>
              <tr><td>Any 6 digits</td><td>Passes</td></tr>
              <tr><td>000000</td><td>Incorrect TAC → stays on screen, shows tries left</td></tr>
              <tr><td>{TAC_MAX_TRIES} incorrect tries</td><td>Locked for {TAC_LOCK_MINUTES} min → “Too many attempts”, back to home</td></tr>
              <tr><td>999999 (or after 5 min)</td><td>TAC expired → must tap “Resend TAC”</td></tr>
            </tbody></table>
            <h4>Mobile numbers</h4>
            <table><tbody>
              {Object.entries(TELCO_CUSTOMERS).map(([n, c]) => <tr key={n}><td>{fmtPhone(n)}</td><td>Telco customer · {telcoText(c)}</td></tr>)}
              <tr><td>Any other number</td><td>Not a telco customer → Direct Debit only</td></tr>
            </tbody></table>
            <p className="note"><Icon name="info" /> The telco account is checked right after TAC, so a blocked account never sees Charge to Bill as an option. The check at Confirm is a backup in case the account changes in between.</p>
            <h4>Direct Debit options</h4>
            <table><tbody>
              {DD_OPTIONS.map((o) => <tr key={o.id}><td>{o.label}</td><td>{o.hint}</td></tr>)}
            </tbody></table>
            <h4>Billing failures: what the user sees</h4>
            <table className="fail-table"><thead><tr><th>Failure</th><th>Message</th><th>User is sent to</th></tr></thead><tbody>
              {Object.entries(FAILURES).map(([k, f]) => <tr key={k}><td><b>{f.title}</b></td><td>{f.message}</td><td>{BACK_TO[f.backTo]}</td></tr>)}
            </tbody></table>
            <p className="note"><Icon name="info" /> After any billing failure the user never repeats TAC or the device scan.</p>
          </div>
        )}
      </Modal>
    )}
  </>);
}
