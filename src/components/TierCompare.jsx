import Icon from './Icon.jsx';
import { FEATURE_COMPARE } from '../plans.js';

// Free vs Premium comparison. Stacks each feature as a row with two cells, so it fits phones.
// premiumOnly: list Premium features only (marketing page: the free tier is not advertised;
// it's offered only when a Premium customer cancels).
export default function TierCompare({ title = 'Free vs Premium', note, premiumOnly = false }) {
  if (premiumOnly) {
    return (
      <div className="tier-compare">
        <div className="tc-head">
          <span className="tc-title">{title}</span>
          <span className="tc-cols"><span className="prem"><Icon name="workspace_premium" fill /> Premium</span></span>
        </div>
        {FEATURE_COMPARE.map((f) => (
          <div key={f.id} className="tc-row">
            <div className="tc-name"><Icon name={f.icon} /> {f.name}</div>
            <div className="tc-cells one"><div className="tc-prem">{f.standalone ?? f.premium}</div></div>
          </div>
        ))}
        {note && <p className="tc-note">{note}</p>}
      </div>
    );
  }
  return (
    <div className="tier-compare">
      <div className="tc-head">
        <span className="tc-title">{title}</span>
        <span className="tc-cols"><span>Free</span><span className="prem"><Icon name="workspace_premium" fill /> Premium</span></span>
      </div>
      {FEATURE_COMPARE.map((f) => (
        <div key={f.id} className="tc-row">
          <div className="tc-name"><Icon name={f.icon} /> {f.name}</div>
          <div className="tc-cells">
            <div className={`tc-free ${f.free === 'Not available' ? 'na' : ''}`}>{f.free}</div>
            <div className="tc-prem">{f.premium}</div>
          </div>
        </div>
      ))}
      {note && <p className="tc-note">{note}</p>}
    </div>
  );
}
