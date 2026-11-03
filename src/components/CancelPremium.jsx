import { useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import { rm } from './PriceCards.jsx';
import { PLAN, FREE_KEEPS } from '../plans.js';
import TierCompare from './TierCompare.jsx';
import { cancelPremium, fmtDate } from '../mockBackend.js';

// Cancel Premium for one home: show what changes, confirm, then Premium runs until the period ends.
export default function CancelPremium({ home, price, endsOn, onClose, onCancelled }) {
  const [step, setStep] = useState('review'); // review | busy | done
  const confirm = async () => { setStep('busy'); await cancelPremium(); setStep('done'); onCancelled(); };

  return (
    <Modal title={step === 'done' ? 'Premium cancelled' : `Cancel ${PLAN.name}?`} onClose={onClose}>
      {step === 'busy' && <div className="spinner-wrap"><div className="spinner" /><p>Cancelling your subscription…</p></div>}
      {step === 'review' && (
        <div className="cancel-flow">
          <p className="sheet-sub">{home.homeName}</p>
          <div className="alert warn"><Icon name="event" fill /><span>
            <b>Premium stays active until {fmtDate(endsOn)}.</b> After that, {home.homeName} moves to the free plan and the {rm(price)}/month charge stops.
          </span></div>
          <TierCompare title="What changes" note="On the free plan you get the Free column only." />
          <div className="field-label">You'll keep</div>
          <ul className="keep-list">{FREE_KEEPS.map((k) => <li key={k}><Icon name="check" /> {k}</li>)}</ul>
          <p className="note"><Icon name="info" /><span>You can undo this until {fmtDate(endsOn)}, or upgrade again any time after.</span></p>
          <div className="form-actions">
            <button className="btn danger" onClick={confirm}>Cancel Premium</button>
            <span className="spacer" />
            <button className="btn primary" onClick={onClose}>Keep Premium</button>
          </div>
        </div>
      )}
      {step === 'done' && (
        <div className="cancel-flow">
          <p className="muted">Your {PLAN.name} subscription for <b>{home.homeName}</b> ends on <b>{fmtDate(endsOn)}</b>. You won't be charged after that.</p>
          <p className="note"><Icon name="undo" /><span>Changed your mind? Open the subscription card and tap <b>Undo cancellation</b>.</span></p>
          <div className="form-actions"><span className="spacer" /><button className="btn primary" onClick={onClose}>Done</button></div>
        </div>
      )}
    </Modal>
  );
}
