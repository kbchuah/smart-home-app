import { useState } from 'react';
import Icon from '../components/Icon.jsx';

const FEATURES = [
  ['devices', 'All your devices, one app', 'Lights, thermostats, locks, cameras and speakers, room by room.'],
  ['auto_mode', 'Routines that run your day', 'One tap for “Good morning”, “Leaving home” or “Movie time”.'],
  ['shield_lock', 'Peace of mind', 'Check your locks and doorbell camera from anywhere.'],
];

export default function Landing({ plan, onProceed }) {
  const [agreed, setAgreed] = useState(false);

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
        <h2 className="plans-title">One simple plan</h2>
        <div className="plan single">
          <span className="plan-name">{plan.name}</span>
          <span className="plan-price">MYR {plan.price}<small>/month</small></span>
          <ul>{plan.perks.map((x) => <li key={x}><Icon name="check" /> {x}</li>)}</ul>
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
