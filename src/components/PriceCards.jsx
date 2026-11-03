// Highlighted price cards used wherever a price is shown:
// blue = new subscription, green = no change, amber = price increase.
import Icon from './Icon.jsx';

export const rm = (n) => `MYR ${Number(n).toFixed(2)}`;

// Highlighted monthly price change (existing homes, 5th device onwards).
export function PriceChange({ from, to, done = false }) {
  return (
    <div className="price-change" role="status">
      <div className="pc-head">
        <span><Icon name="trending_up" /> {done ? 'Your monthly price is now' : 'Your monthly price will increase'}</span>
        <span className="pc-delta">+{rm(to - from)}</span>
      </div>
      <div className="pc-prices">
        <s>{rm(from)}</s>
        <Icon name="arrow_forward" />
        <span className="pc-new"><b>{rm(to)}</b><small>/month</small></span>
      </div>
    </div>
  );
}

// Highlighted "no change" when the new device is included in the plan.
export function PriceSame({ price, used, included, done = false }) {
  return (
    <div className="price-change same" role="status">
      <div className="pc-head">
        <span><Icon name="check_circle" fill /> {done ? 'Your monthly price stays the same' : 'No change to your monthly price'}</span>
        <span className="pc-delta">Included</span>
      </div>
      <div className="pc-prices"><span className="pc-new"><b>{rm(price)}</b><small>/month</small></span></div>
      <small className="pc-sub">{used > included ? `${used} devices · covered by your current price` : `${used} of ${included} devices included in your plan`}</small>
    </div>
  );
}

// Highlighted price for a brand-new subscription (first pairing).
export function PriceNew({ price, included, label = 'Your monthly subscription', badge = 'New subscription', sub }) {
  return (
    <div className="price-change new" role="status">
      <div className="pc-head">
        <span><Icon name="workspace_premium" fill /> {label}</span>
        <span className="pc-delta">{badge}</span>
      </div>
      <div className="pc-prices"><span className="pc-new"><b>{rm(price)}</b><small>/month</small></span></div>
      <small className="pc-sub">{sub ?? `Includes up to ${included} devices · Billed monthly · Cancel anytime`}</small>
    </div>
  );
}


// Free plan: adding a device costs nothing.
export function PriceFree({ done = false }) {
  return (
    <div className="price-change same" role="status">
      <div className="pc-head">
        <span><Icon name="check_circle" fill /> {done ? 'Added on the free plan' : 'Free plan: no charge'}</span>
        <span className="pc-delta">Free</span>
      </div>
      <div className="pc-prices"><span className="pc-new"><b>MYR 0.00</b><small>/month</small></span></div>
      <small className="pc-sub">Premium features stay off. Upgrade any time from the subscription card.</small>
    </div>
  );
}
