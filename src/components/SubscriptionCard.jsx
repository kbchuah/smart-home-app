import { useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import { rm } from './PriceCards.jsx';
import { monthlyPrice } from '../mockBackend.js';
import { PLAN } from '../plans.js';

const fmtPhone = (n) => (n && n.length > 3 ? `+60 ${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6)}` : n);

// Current subscription charges for one home, shown inside the home.
export default function SubscriptionCard({ home }) {
  const [open, setOpen] = useState(false);
  const sub = home.subscription;
  if (!sub) return null;
  const count = home.devices.length;
  const price = monthlyPrice(count);
  const used = Math.min(count, price.included);
  const over = count > price.included;
  const detail = sub.method === 'Charge to Bill' ? (sub.billingAccount ?? sub.detail) : (sub.detail ?? sub.bank);

  return (<>
    <button className="sub-card" onClick={() => setOpen(true)} aria-label="Subscription details">
      <span className="sub-icon"><Icon name="workspace_premium" fill /></span>
      <span className="sub-body">
        <span className="sub-top"><b>{PLAN.name}</b><span className="sub-price">{rm(price.total)}<small>/month</small></span></span>
        <span className="sub-meter" aria-hidden>
          {Array.from({ length: price.included }, (_, i) => <i key={i} className={i < used ? 'on' : ''} />)}
          {over && <em>+{price.extraDevices}</em>}
        </span>
        <small>{over ? `${count} devices · ${price.extraDevices} extra` : `${used} of ${price.included} devices included`} · {sub.method}</small>
      </span>
      <Icon name="chevron_right" />
    </button>
    {open && (
      <Modal title="Subscription" onClose={() => setOpen(false)}>
        <p className="sheet-sub">{home.homeName} · {home.ecosystem}</p>
        <div className="summary-box">
          <div><span>Plan</span><b>{PLAN.name}</b></div>
          <div><span>Status</span><b className="ok-text">Active</b></div>
          <div><span>Devices on home</span><b>{count}</b></div>
          <div><span>{PLAN.name} (up to {price.included} devices)</span><b>{rm(price.base)}</b></div>
          {over && <div><span>{price.extraDevices} extra × {rm(price.extraEach)}</span><b>{rm(price.extraDevices * price.extraEach)}</b></div>}
          <div className="total"><span>Monthly charge</span><b>{rm(price.total)}</b></div>
        </div>
        <div className="summary-box">
          <div><span>Payment method</span><b>{sub.method}</b></div>
          {detail && <div><span>{sub.method === 'Charge to Bill' ? 'Billing account' : 'Paid from'}</span><b>{detail}</b></div>}
          {sub.phone && <div><span>Verified mobile</span><b>{fmtPhone(sub.phone)}</b></div>}
          <div><span>Billing</span><b>Monthly</b></div>
        </div>
        <p className="note"><Icon name="info" /><span>The price follows your devices: {rm(price.base)}/month covers up to {price.included}, then {rm(price.extraEach)}/month for each extra device.</span></p>
      </Modal>
    )}
  </>);
}
