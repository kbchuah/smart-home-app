import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { APP_VERSION, APP_BUILD } from '../version.js';
import { confirmResetAll } from '../resetAll.js';

const FEATURES = [
  ['auto_awesome', 'Just ask', 'Say “dim the living room and lock the front door” and your AI assistant does it.'],
  ['psychology', 'Learns your routine', 'AI notices your daily patterns and suggests routines, like lights on at sunset.'],
  ['notifications_active', 'Smarter alerts', 'Cameras tell a person from a pet or a package, so you only get alerts that matter.'],
  ['bolt', 'Save energy', 'See which devices use the most power and get tips to cut your bill.'],
];

export default function Landing({ plan, onProceed }) {
  const [agreed, setAgreed] = useState(false);
  const [inMalaysia, setInMalaysia] = useState(false);

  return (
    <div className="landing">
      <header className="brand-bar">
        <span className="brand"><Icon name="cottage" fill /> Hearth</span>
        <span className="demo-pill">Demo</span>
      </header>

      <section className="hero">
        <span className="hero-badge"><Icon name="auto_awesome" fill /> Premium Home · with AI</span>
        <span className="region-note">🇲🇾 Available in Malaysia only</span>
        <h1>A home that <span>thinks ahead.</span></h1>
        <p>Premium Home brings all your smart devices into one app, with built-in AI that understands what you ask, learns your routines and keeps an eye on things while you're away.</p>
      </section>

      <section className="features">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="feature">
            <Icon name={icon} fill />
            <div><b>{title}</b><p>{text}</p></div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="plans-title">Your Premium Home plan</h2>
        <div className="plan single">
          <span className="plan-name"><Icon name="auto_awesome" fill /> {plan.name}</span>
          <span className="plan-tagline">{plan.tagline}</span>
          <span className="plan-price">MYR {plan.price}<small>/month</small></span>
          <ul>{plan.perks.map((x) => <li key={x}><Icon name="check" /> {x}</li>)}</ul>
        </div>
      </section>

      <section className="consent-box">
        <label className="consent">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I understand that the <b>{plan.name}</b> plan, including its AI features, costs <b>MYR {plan.price}/month</b>, supports up to{' '}
            <b>{plan.devices} devices</b>, renews automatically each month, and can be cancelled anytime.
          </span>
        </label>
        <label className="consent">
          <input type="checkbox" checked={inMalaysia} onChange={(e) => setInMalaysia(e.target.checked)} />
          <span>
            I confirm that I live in <b>Malaysia</b>. I understand that Hearth is <b>only available in Malaysia</b> and
            can only be used with a home located in Malaysia.
          </span>
        </label>
        <button className="btn primary cta" disabled={!agreed || !inMalaysia} onClick={onProceed}>
          Agree and continue <Icon name="arrow_forward" />
        </button>
        <p className="fineprint">Demo only. No payment is taken and no data is collected.</p>
        <p className="fineprint version-label" title={APP_BUILD}>{APP_VERSION} · built {APP_BUILD}</p>
        <button className="btn subtle reset-link" onClick={confirmResetAll}><Icon name="delete_sweep" /> Reset all demo data</button>
      </section>
    </div>
  );
}
