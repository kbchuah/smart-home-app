import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PLANS } from '../plans.js';

const FEATURES = [
  ['devices', 'All your devices, one app', 'Lights, thermostats, locks, cameras and speakers, room by room.'],
  ['auto_mode', 'Routines that run your day', 'One tap for “Good morning”, “Leaving home” or “Movie time”.'],
  ['shield_lock', 'Peace of mind', 'Check your locks and doorbell camera from anywhere.'],
];

export default function Landing({ planId, onSelectPlan, onProceed }) {
  const [agreed, setAgreed] = useState(false);
  const plan = PLANS.find((p) => p.id === planId);

  return (
    <div className="landing">
      <header className="brand-bar">
        <span className="brand"><Icon name="cottage" fill /> Hearth</span>
        <span className="demo-pill">Demo</span>
      </header>

      <section className="hero">
        <h1>Your whole home, <span>in one place.</span></h1>
        <p>Control every smart device, automate your routines, and keep your family safe with a simple monthly plan.</p>
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
        <h2 className="plans-title">Choose your plan</h2>
        <div className="plans" role="radiogroup" aria-label="Subscription plan">
          {PLANS.map((p) => (
            <button key={p.id} role="radio" aria-checked={p.id === planId}
              className={`plan ${p.id === planId ? 'sel' : ''}`} onClick={() => onSelectPlan(p.id)}>
              {p.popular && <span className="plan-tag">Most popular</span>}
              <span className="plan-name">{p.name}</span>
              <span className="plan-price">MYR {p.price}<small>/month</small></span>
              <ul>{p.perks.map((x) => <li key={x}><Icon name="check" /> {x}</li>)}</ul>
              <span className="plan-radio"><Icon name={p.id === planId ? 'radio_button_checked' : 'radio_button_unchecked'} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="consent-box">
        <label className="consent">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I understand that the <b>{plan.name}</b> plan costs <b>MYR {plan.price}/month</b>, supports up to{' '}
            <b>{plan.devices} devices</b>, renews automatically each month, and can be cancelled anytime.
          </span>
        </label>
        <button className="btn primary cta" disabled={!agreed} onClick={onProceed}>
          Proceed <Icon name="arrow_forward" />
        </button>
        <p className="fineprint">Demo only. No payment is taken and no data is collected.</p>
      </section>
    </div>
  );
}
