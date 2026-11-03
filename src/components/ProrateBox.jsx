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

// Mid-cycle increase: the extra for the rest of this billing period, charged once on the next bill.
export function ProrateIncrease({ charge, newPrice }) {
  if (!charge) return null;
  return (
    <div className="prorate">
      <div className="pr-row"><span><Icon name="receipt_long" /> This period, pro-rated</span><b>+{rm(charge.amount)}</b></div>
      <small>+{rm(charge.monthlyIncrease)} × {charge.days} of {charge.periodDays} days left ({short(charge.from)} – {short(charge.to)}), added once to your next bill</small>
      <div className="pr-row then"><span>Then from {fmtDate(charge.until)}</span><b>{rm(newPrice)}/month</b></div>
    </div>
  );
}

// Pending one-off charges for the next bill (subscription details).
export function NextBillCharges({ charges }) {
  if (!charges?.length) return null;
  const total = charges.reduce((n, c) => n + c.amount, 0);
  return (
    <div className="prorate">
      <div className="pr-row"><span><Icon name="receipt_long" /> On your next bill</span><b>+{rm(total)}</b></div>
      {charges.map((c, i) => <small key={i}>Pro-rated +{rm(c.monthlyIncrease)}/month for {c.days} of {c.periodDays} days ({short(c.from)} – {short(c.to)}): +{rm(c.amount)}</small>)}
    </div>
  );
}
