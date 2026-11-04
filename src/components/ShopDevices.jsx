import Icon from './Icon.jsx';
import { STORE_URL } from '../plans.js';

// Upsell: buy compatible cameras from the online store (opens in a new tab).
// variant 'card' = marketing page banner; 'link' = small inline link inside flows.
export default function ShopDevices({ variant = 'link', text }) {
  if (variant === 'card') {
    return (
      <a className="shop-card" href={STORE_URL} target="_blank" rel="noopener noreferrer">
        <span className="shop-icon"><Icon name="storefront" fill /></span>
        <span className="shop-body">
          <b>Need a camera?</b>
          <small>Shop Google Nest and other compatible cameras at the Maxis store.</small>
        </span>
        <span className="shop-go">Shop <Icon name="open_in_new" /></span>
      </a>
    );
  }
  return (
    <a className="shop-link" href={STORE_URL} target="_blank" rel="noopener noreferrer">
      <Icon name="storefront" /> {text ?? 'No camera yet? Shop at Maxis store'} <Icon name="open_in_new" />
    </a>
  );
}
