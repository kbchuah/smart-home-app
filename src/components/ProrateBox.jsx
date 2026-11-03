import Icon from './Icon.jsx';
import { rm } from './PriceCards.jsx';
import { fmtDate } from '../mockBackend.js';

const short = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// First Charge to Bill bill: pro-rated part-month, then the full monthly price from the cycle date.
export default function ProrateBox({ firstBill, price }) {
  if (!firstBill) return null;
  return (
    <div className="prorate">
      <div className="pr-row"><span><Icon name="receipt_long" /> First bill, pro-rated</span><b>{rm(firstBill.amount)}</b></div>
      <small>{firstBill.days} of {firstBill.periodDays} days ({short(firstBill.from)} – {short(firstBill.to)}), to match your telco bill cycle</small>
      <div className="pr-row then"><span>Then from {fmtDate(firstBill.until)}</span><b>{rm(price)}/month</b></div>
    </div>
  );
}
