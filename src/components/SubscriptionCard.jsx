import { useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import { rm } from './PriceCards.jsx';
import { monthlyPrice, subStatus, renewsOn, fmtDate } from '../mockBackend.js';
import { PLAN } from '../plans.js';

const fmtPhone = (n) => (n && n.length > 3 ? `+60 ${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6)}` : n);

// Current subscription for one home, shown inside the home. Handles active, cancelling and free.
export default function SubscriptionCard({ home, onCancel, onUndo, onUpgrade, onEndPeriod }) {
  const [open, setOpen] = useState(false);
  const sub = home.subscription;
  if (!sub) return null;
  const status = subStatus(sub);
  const count = home.devices.length;
  const price = monthlyPrice(count);
  const used = Math.min(count, price.included);
  const over = count > price.included;
  const endsOn = renewsOn(sub);
  const detail = sub.method === 'Charge to Bill' ? (sub.billingAccount ?? sub.detail) : (sub.detail ?? sub.bank);
  const close = () => setOpen(false);

  if (status === 'free') {
    return (
      <div className="sub-card free">
        <span className="sub-icon"><Icon name="home" /></span>
        <span className="sub-body">
          <span className="sub-top"><b>Free plan</b><span className="sub-price">MYR 0<small>/month</small></span></span>
          <small>{count} device{count === 1 ? '' : 's'} · Premium features off</small>
        </span>
        <button className="btn primary sm" onClick={onUpgrade}>Upgrade</button>
      </div>
    );
  }

  return (<>
    <button className={`sub-card ${status === 'cancelling' ? 'ending' : ''}`} onClick={() => setOpen(true)} aria-label="Subscription details">
      <span className="sub-icon"><Icon name="workspace_premium" fill /></span>
      <span className="sub-body">
        <span className="sub-top"><b>{PLAN.name}{status === 'cancelling' && ` · ends ${fmtDate(endsOn)}`}</b><span className="sub-price">{rm(price.total)}<small>/month</small></span></span>
        <span className="sub-meter" aria-hidden>
          {Array.from({ length: price.included }, (_, i) => <i key={i} className={i < used ? 'on' : ''} />)}
          {over && <em>+{price.extraDevices}</em>}
        </span>
        <small>{over ? `${count} devices · ${price.extraDevices} extra` : `${used} of ${price.included} devices included`} · {sub.method}</small>
      </span>
      <Icon name="chevron_right" />
    </button>
    {open && (
      <Modal title="Subscription" onClose={close}>
        <p className="sheet-sub">{home.homeName} · {home.ecosystem}</p>
        {status === 'cancelling' && (
          <div className="alert warn"><Icon name="event_busy" fill /><span><b>Cancelled. Premium ends on {fmtDate(endsOn)}.</b> Then this home moves to the free plan and billing stops.</span></div>
        )}
        <div className="summary-box">
          <div><span>Plan</span><b>{PLAN.name}</b></div>
          <div><span>Status</span>{status === 'cancelling' ? <b className="warn-text">Ends {fmtDate(endsOn)}</b> : <b className="ok-text">Active</b>}</div>
          <div><span>{status === 'cancelling' ? 'Ends on' : 'Renews on'}</span><b>{fmtDate(endsOn)}</b></div>
          <div><span>Devices on home</span><b>{count}</b></div>
          <div><span>{PLAN.name} (up to {price.included} devices)</span><b>{rm(price.base)}</b></div>
          {over && <div><span>{price.extraDevices} extra × {rm(price.extraEach)}</span><b>{rm(price.extraDevices * price.extraEach)}</b></div>}
          <div className="total"><span>Monthly charge</span><b>{rm(price.total)}</b></div>
        </div>
        <div className="summary-box">
          <div><span>Payment method</span><b>{sub.method}</b></div>
          {detail && <div><span>{sub.method === 'Charge to Bill' ? 'Billing account' : 'Paid from'}</span><b>{detail}</b></div>}
          {sub.phone && <div><span>Verified mobile</span><b>{fmtPhone(sub.phone)}</b></div>}
        </div>
        {status === 'active' ? (
          <div className="form-actions sub-actions">
            <button className="btn danger" onClick={() => { close(); onCancel(price.total, endsOn); }}>Cancel Premium</button>
          </div>
        ) : (<>
          <div className="form-actions sub-actions">
            <button className="btn primary" onClick={() => { close(); onUndo(); }}><Icon name="undo" /> Undo cancellation</button>
          </div>
          <button className="btn subtle demo-skip" onClick={() => { close(); onEndPeriod(); }}><Icon name="science" /> Demo: end billing period now</button>
        </>)}
      </Modal>
    )}
  </>);
}
