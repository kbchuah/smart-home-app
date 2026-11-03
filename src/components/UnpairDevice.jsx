import { useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import { rm } from './PriceCards.jsx';
import { PLAN } from '../plans.js';
import { subStatus, billedPrice, premiumPrice, renewsOn, fmtDate, unpairDevice } from '../mockBackend.js';

// Unpair a device: show the fee impact first. A lower price applies from the next renewal.
export default function UnpairDevice({ home, device, onClose, onUnpaired }) {
  const [busy, setBusy] = useState(false);
  const status = subStatus(home.subscription);
  const after = home.devices.length - 1;
  const billed = billedPrice(home);
  const next = premiumPrice(after);
  const renew = renewsOn(home.subscription);
  const drops = status === 'active' && next < billed;

  const go = async () => { setBusy(true); await unpairDevice(); onUnpaired(); };

  let impact;
  if (!home.subscription || status === 'free') {
    impact = <div className="price-change same"><div className="pc-head"><span><Icon name="check_circle" fill /> Free plan: no fee impact</span></div><small className="pc-sub">Nothing changes on your bill.</small></div>;
  } else if (status === 'cancelling') {
    impact = <div className="price-change same"><div className="pc-head"><span><Icon name="event_busy" /> No change</span></div><small className="pc-sub">Premium already ends on {fmtDate(renew)}. You won't be charged after that.</small></div>;
  } else if (drops) {
    impact = (
      <div className="price-change down" role="status">
        <div className="pc-head"><span><Icon name="trending_down" /> Your monthly price will drop</span><span className="pc-delta">−{rm(billed - next)}</span></div>
        <div className="pc-prices"><s>{rm(billed)}</s><Icon name="arrow_forward" /><span className="pc-new"><b>{rm(next)}</b><small>/month</small></span></div>
        <small className="pc-sub">From your next renewal on <b>{fmtDate(renew)}</b>. You'll keep paying {rm(billed)} until then.</small>
      </div>
    );
  } else {
    impact = <div className="price-change same"><div className="pc-head"><span><Icon name="check_circle" fill /> No change to your monthly price</span><span className="pc-delta">Included</span></div>
      <div className="pc-prices"><span className="pc-new"><b>{rm(billed)}</b><small>/month</small></span></div>
      <small className="pc-sub">{after} of {PLAN.devices} included devices used after unpairing.</small></div>;
  }

  return (
    <Modal title={`Unpair ${device.name}?`} onClose={busy ? () => {} : onClose}>
      {busy ? (
        <div className="spinner-wrap"><div className="spinner" /><p>Unpairing {device.name}…</p></div>
      ) : (
        <div className="cancel-flow">
          <p className="muted">{device.name} will be removed from <b>{home.homeName}</b> and reset. You can pair it again later.</p>
          {impact}
          {status === 'active' && after === 0 && (
            <div className="alert warn"><Icon name="info" /><span>This is your last device. {PLAN.name} continues at {rm(next)}/month. To stop paying, cancel Premium from the subscription card.</span></div>
          )}
          <div className="form-actions">
            <button className="btn" onClick={onClose}>Keep device</button>
            <span className="spacer" />
            <button className="btn danger-solid" onClick={go}><Icon name="link_off" /> Unpair</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
