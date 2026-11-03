import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { APP_VERSION, APP_BUILD } from '../version.js';
import { confirmResetAll } from '../resetAll.js';
import TierCompare from '../components/TierCompare.jsx';

const FEATURES = [
  ['history', '30 days of video history', 'See what happened while you were out. Event clips up to 5 minutes, kept for 30 days.'],
  ['face', "Know who's at the door", 'Familiar face detection tells you who is there. Garage door alerts too.'],
  ['detector_smoke', 'Hear what matters', 'Get alerted when a smoke or CO alarm goes off, or glass breaks.'],
  ['auto_awesome', 'Gemini for your home', 'Talk naturally with Gemini Live, get a Daily Home Brief, and create automations just by describing them.'],
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
        <p>Premium Home brings all your smart devices into one app, with 30-day video history, smarter camera and sound alerts, and Gemini built in.</p>
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
          <span className="plan-extra"><Icon name="add_circle" /><span>{plan.devices} devices included · <b>+MYR {plan.extraDevicePrice}/month</b> for each additional device</span></span>
          <ul>{plan.perks.map((x) => <li key={x}><Icon name="check" /> {x}</li>)}</ul>
        </div>
      </section>

      <section className="compare-section">
        <TierCompare note="Free features are always included. Premium is billed per home." />
      </section>

      <section className="consent-box">
        <label className="consent">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I understand that the <b>{plan.name}</b> plan, including its AI features, costs <b>MYR {plan.price}/month</b>, includes up to{' '}
            <b>{plan.devices} devices</b> per home with an extra <b>MYR {plan.extraDevicePrice}/month for each additional device</b>, renews automatically each month, and can be cancelled anytime.
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
