import Icon from './Icon.jsx';
import DemoReveal from './DemoReveal.jsx';
import ShopDevices from './ShopDevices.jsx';
import { fmtDate } from '../mockBackend.js';

// Subscription-led: what a subscribed home still needs. Shows the camera order (if any) and the
// first-camera step that starts billing. Hidden once the home has a device and no open order.
export default function SetupChecklist({ home, onSetUp, onDelivered, onSkipToBilling }) {
  const sub = home.subscription;
  const order = home.order && home.order.status !== 'set_up' ? home.order : null;
  const pending = Boolean(sub?.billingPending);
  if (!order && !(pending && home.devices.length === 0)) return null;
  const delivered = order?.status === 'delivered';
  const steps = [['Ordered', true], ['On the way', true], ['Delivered', delivered]];
  return (
    <section className="setup-card">
      <div className="setup-head"><Icon name="rocket_launch" fill /><b>Finish setting up {home.homeName}</b></div>
      <ul className="setup-list">
        <li className="done"><Icon name="check_circle" fill /><span><b>Premium Home is ready</b><small>{pending ? `Billing starts with your first camera (by ${fmtDate(sub.billingBy)})` : 'Billing is active'}</small></span></li>
        {order ? (
          <li className={delivered ? 'now' : ''}>
            <Icon name={delivered ? 'inventory_2' : 'local_shipping'} fill />
            <span>
              <b>{delivered ? `Your ${order.model} has arrived` : `Your ${order.model} is on the way`}</b>
              <small>{delivered ? 'Plug it in near your Wi-Fi router, then set it up.' : `Arrives by ${fmtDate(order.eta)}`}</small>
              <span className="tracker">{steps.map(([label, on]) => <i key={label} className={on ? 'on' : ''}><em />{label}</i>)}</span>
            </span>
          </li>
        ) : (
          <li className="now"><Icon name="videocam" fill /><span><b>Add your first camera</b><small>Any camera that works with Google Home or is Matter-certified</small></span></li>
        )}
      </ul>
      {(!order || delivered) && (
        <button className="btn primary wide" onClick={onSetUp}><Icon name="add" /> {order ? `Set up ${order.model}` : 'Add your first camera'}</button>
      )}
      {!order && <ShopDevices />}
      <DemoReveal label="Demo shortcuts">
        {order && !delivered && <button className="btn subtle demo-skip" onClick={onDelivered}><Icon name="fast_forward" /> Mark camera as delivered</button>}
        {pending && <button className="btn subtle demo-skip" onClick={onSkipToBilling}><Icon name="fast_forward" /> Skip to billing date (no camera yet)</button>}
      </DemoReveal>
    </section>
  );
}
