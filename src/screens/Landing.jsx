import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { APP_VERSION, APP_BUILD } from '../version.js';
import { confirmResetAll } from '../resetAll.js';
import Modal from '../components/Modal.jsx';
import { FEATURE_COMPARE } from '../plans.js';
import ShopDevices from '../components/ShopDevices.jsx';
import { useJourney, setJourney } from '../demoStore.js';
import { premiumPrice } from '../mockBackend.js';


export default function Landing({ plan, onProceed }) {
  const journey = useJourney();
  const [agreed, setAgreed] = useState(false);
  const [inMalaysia, setInMalaysia] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="landing">
      <header className="brand-bar">
        <span className="brand"><Icon name="cottage" fill /> Sixam Home</span>
        <span className="demo-pill">Demo</span>
      </header>

      <div className="journey-switch" role="group" aria-label="Demo journey">
        <span className="js-label"><Icon name="science" /> Demo journey</span>
        <div className="segmented">
          <button className={journey === 'device' ? 'active' : ''} onClick={() => setJourney('device')}>Device-led v1</button>
          <button className={journey === 'subscription' ? 'active' : ''} onClick={() => setJourney('subscription')}>Subscription-led v1</button>
        </div>
        <small>{journey === 'device' ? 'Sign up free, then pairing your first camera starts the subscription.' : 'Subscribe first (MYR 0 today, optional camera), then add cameras. Billing starts with the first camera.'}</small>
      </div>

      <section className="hero">
        <span className="hero-badge"><Icon name="auto_awesome" fill /> Premium Home · with AI</span>
        <span className="region-note">🇲🇾 Available in Malaysia only</span>
        <h1>A home that <span>thinks ahead.</span></h1>
        <p>Premium Home brings all your smart devices into one app, with 30-day video history, smarter camera and sound alerts, and Gemini built in.</p>
      </section>

      <section>
        <h2 className="plans-title">Your Premium Home plan</h2>
        <div className="plan single">
          <span className="plan-name"><Icon name="auto_awesome" fill /> {plan.name}</span>
          <span className="plan-tagline">{plan.tagline}</span>
          <span className="plan-price">MYR {plan.price}<small>/month</small></span>
          <span className="plan-extra"><Icon name="add_circle" /><span>{plan.devices} devices included · <b>+MYR {plan.extraDevicePrice}/month</b> for each additional device</span></span>
          <ul>{plan.perks.map((x) => <li key={x}><Icon name="check" /> {x}</li>)}</ul>
          {journey === 'subscription' && <p className="plan-sub-note"><Icon name="event_available" /> Subscribe now for MYR 0 today. Billing starts when your first camera is online.</p>}
          <button type="button" className="btn subtle pricing-link" onClick={() => setShowPricing(true)}><Icon name="calculate" /> How your price works</button>
        </div>
      </section>

      <section className="included">
        <h2 className="plans-title">What's included</h2>
        <div className="features">
          {FEATURE_COMPARE.map((f) => (
            <div key={f.id} className={`feature tone-${f.tone}`}>
              <span className="f-icon"><Icon name={f.icon} fill /></span>
              <div><b>{f.headline}</b><p>{f.pitch}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="shop-section"><ShopDevices variant="card" /></section>

      {showPricing && (
        <Modal title="How your price works" onClose={() => setShowPricing(false)}>
          <PriceExamples plan={plan} />
        </Modal>
      )}

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
            I confirm that I live in <b>Malaysia</b>. I understand that Sixam Home is <b>only available in Malaysia</b> and
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

// Worked pricing examples, computed from the plan so they never go out of date.
function PriceExamples({ plan }) {
  const n = plan.devices;
  const rows = [
    [`1 to ${n} devices`, premiumPrice(n), 'Included in your plan'],
    ...[1, 2, 3].map((k) => [`${n + k} devices`, premiumPrice(n + k), `${k} extra × MYR ${plan.extraDevicePrice}`]),
    [`${n + 5} devices`, premiumPrice(n + 5), `5 extra × MYR ${plan.extraDevicePrice}`],
  ];
  return (
    <div className="price-examples">
      <p className="pe-lead">MYR {plan.price}/month covers up to {plan.devices} devices in a home. Each device after that adds MYR {plan.extraDevicePrice}/month.</p>
      <table>
        <thead><tr><th>Devices in your home</th><th>Monthly price</th></tr></thead>
        <tbody>
          {rows.map(([d, price, how], i) => (
            <tr key={d} className={i === 0 ? 'base' : ''}>
              <td><b>{d}</b><small>{how}</small></td>
              <td>MYR {price}{i > 0 && <small className="pe-diff">+MYR {price - plan.price}</small>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pe-note">Price is per home. Adding a device takes effect from your next bill.</p>
    </div>
  );
}
