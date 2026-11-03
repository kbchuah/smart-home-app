import { useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import { useDemo, setDemo, resetDemo, DEMO_CONTROLS, DEMO_DEFAULTS } from '../demoStore.js';
import { QR_CODES, TELCO_CUSTOMERS, DD_OPTIONS, FAILURES } from '../mockBackend.js';

const fmtPhone = (n) => `${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6)}`;
const ELIG_TEXT = { ok: 'Passes', spend_limit: 'Spend limit reached', inactive: 'Account inactive', timeout_once: 'Timeout on 1st try, then passes' };
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
              {QR_CODES.map((q) => <tr key={q.id}><td>{q.label}</td><td>{q.unreadable ? "Can't read → Scan again / Key in serial" : q.compatible ? 'Compatible' : `Not compatible → Scan again / Key in serial`}</td></tr>)}
            </tbody></table>
            <h4>Serial numbers</h4>
            <table><tbody>
              <tr><td>NC-XX-12345 (e.g. NC-IW-48213)</td><td>Compatible</td></tr>
              <tr><td>NC-IW-11002</td><td>Registered to another account</td></tr>
              <tr><td>Anything else</td><td>Not found</td></tr>
            </tbody></table>
            <h4>Mobile numbers (TAC: any 6 digits)</h4>
            <table><tbody>
              {Object.entries(TELCO_CUSTOMERS).map(([n, c]) => <tr key={n}><td>{fmtPhone(n)}</td><td>Telco customer · Charge to Bill: {ELIG_TEXT[c.eligibility]}</td></tr>)}
              <tr><td>Any other number</td><td>Not a telco customer → Direct Debit only</td></tr>
            </tbody></table>
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
