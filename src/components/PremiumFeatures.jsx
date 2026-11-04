import Icon from './Icon.jsx';
import { PREMIUM_FEATURES } from '../plans.js';

// Premium features for a home: on while Premium is active, locked on the free tier.
export default function PremiumFeatures({ premium, onUpgrade, onTry }) {
  return (
    <section className="premium-features">
      <div className="room-head">
        <h3 className="section-title">Premium features {!premium && <span className="lock-pill"><Icon name="lock" /> Free plan</span>}</h3>
        {!premium && <button className="btn subtle" onClick={onUpgrade}><Icon name="workspace_premium" /> Upgrade</button>}
      </div>
      <div className="pf-grid">
        {PREMIUM_FEATURES.map((f) => (
          <button key={f.id} className={`pf tone-${f.tone} ${premium ? '' : 'locked'}`} onClick={() => (premium ? onTry(f) : onUpgrade())}
            aria-label={premium ? f.name : `${f.name} (needs Premium)`}>
            <span className="pf-icon"><Icon name={premium ? f.icon : 'lock'} fill={premium} /></span>
            <span className="pf-body"><b>{f.name}</b><small>{premium ? f.desc : `Free: ${f.freeDesc}`}</small></span>
          </button>
        ))}
      </div>
    </section>
  );
}
