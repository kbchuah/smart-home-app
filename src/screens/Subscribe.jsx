import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Stepper from '../components/Stepper.jsx';

// Billing gate before the first device pairing (all mocked):
// mobile number → TAC → telco customer lookup → Charge to Bill | Direct Debit → paired device count → agree → proceed

// Demo rule: these numbers belong to existing telco customers with a billing account.
const TELCO_CUSTOMERS = {
  '0123456789': { name: 'KB Chuah', account: 'BA-2209-4821', plan: 'Postpaid 98', address: 'Kuala Lumpur' },
};
const BANKS = ['Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank', 'Hong Leong Bank', 'AmBank', 'Bank Islam', 'Bank Rakyat'];
const STEPS = ['Verify', 'Payment', 'Confirm'];

const digits = (v) => v.replace(/\D/g, '');
const fmtPhone = (n) => (n.length > 3 ? `${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6)}` : n).trim();

function Spinner({ label }) {
  return <div className="spinner-wrap"><div className="spinner" /><p>{label}</p></div>;
}

export default function Subscribe({ plan, homeName, pairedCount = 0, onCancel, onDone }) {
  const [view, setView] = useState('phone');
  const [busy, setBusy] = useState(null);
  const [phone, setPhone] = useState('');
  const [tac, setTac] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [bank, setBank] = useState(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const wait = (label, ms, then) => { setBusy(label); setTimeout(() => { setBusy(null); then(); }, ms); };
  const method = customer ? 'Charge to Bill' : 'Direct Debit';
  const step = { phone: 0, tac: 0, ctb: 1, ddBank: 1, ddBankAuth: 1, summary: 2 }[view];
  const phoneOk = /^01\d{8,9}$/.test(phone);

  const afterPayment = () => wait('Checking your paired devices…', 1000, () => setView('summary'));

  let body;
  if (busy) {
    body = <div className="auth-card"><Spinner label={busy} /></div>;
  } else if (view === 'phone') {
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); if (phoneOk) wait('Sending TAC…', 900, () => { setResendIn(30); setView('tac'); }); }}>
        <span className="auth-logo"><Icon name="sms" /></span>
        <h1>Verify your mobile number</h1>
        <p className="muted">Each home has its own subscription. Before adding the first device to <b>{homeName ?? 'your new home'}</b>, we'll set up its <b>{plan.name}</b> plan. We'll send a TAC to verify the mobile number to bill.</p>
        <label className="field"><span>Mobile number</span>
          <div className="phone-input"><span>+60</span>
            <input autoFocus inputMode="tel" value={fmtPhone(phone)} placeholder="012-345 6789"
              onChange={(e) => setPhone(digits(e.target.value).slice(0, 11))} /></div></label>
        <div className="demo-hint">
          <Icon name="science" /> <span>Demo: <button type="button" onClick={() => setPhone('0123456789')}>012-345 6789</button> is an existing telco customer. Any other number isn't.</span>
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <span className="spacer" />
          <button className="btn primary" disabled={!phoneOk}>Send TAC</button>
        </div>
      </form>
    );
  } else if (view === 'tac') {
    const tacOk = /^\d{6}$/.test(tac);
    body = (
      <form className="auth-card left" onSubmit={(e) => {
        e.preventDefault();
        if (!tacOk) return;
        wait('Verifying TAC and checking your telco account…', 1400, () => {
          const c = TELCO_CUSTOMERS[phone] ?? null;
          setCustomer(c);
          setView(c ? 'ctb' : 'ddBank');
        });
      }}>
        <h1>Enter TAC</h1>
        <p className="muted">We sent a 6-digit TAC to <b>+60 {fmtPhone(phone)}</b>.</p>
        <label className="field"><span>TAC</span>
          <input autoFocus className="tac-input" inputMode="numeric" maxLength={6} value={tac} placeholder="••••••"
            onChange={(e) => setTac(digits(e.target.value))} />
          <small className="field-hint"><Icon name="science" /> Demo: any 6 digits work.</small></label>
        <button type="button" className="btn subtle" disabled={resendIn > 0} onClick={() => setResendIn(30)}>
          {resendIn > 0 ? `Resend TAC in ${resendIn}s` : 'Resend TAC'}
        </button>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => { setTac(''); setView('phone'); }}>Back</button>
          <span className="spacer" />
          <button className="btn primary" disabled={!tacOk}>Verify</button>
        </div>
      </form>
    );
  } else if (view === 'ctb') {
    body = (
      <div className="auth-card left">
        <span className="auth-logo ok"><Icon name="verified" fill /></span>
        <h1>Welcome back, {customer.name.split(' ')[0]}</h1>
        <p className="muted">You're an existing telco customer, so your subscription can be added to your monthly bill.</p>
        <div className="option sel static">
          <span className="option-icon"><Icon name="receipt_long" fill /></span>
          <span className="option-body"><b>Charge to Bill</b>
            <small>Billing account {customer.account} · {customer.plan}</small></span>
          <Icon name="check_circle" fill className="option-radio" />
        </div>
        <div className="form-actions">
          <button className="btn" onClick={() => setView('phone')}>Back</button>
          <span className="spacer" />
          <button className="btn primary" onClick={afterPayment}>Continue</button>
        </div>
      </div>
    );
  } else if (view === 'ddBank') {
    body = (
      <div className="auth-card left">
        <span className="auth-logo"><Icon name="account_balance" /></span>
        <h1>Set up Direct Debit</h1>
        <p className="muted">We couldn't find a telco billing account for <b>+60 {fmtPhone(phone)}</b>. Your subscription will be paid monthly by Direct Debit from your bank account.</p>
        <div className="field-label">Choose your bank</div>
        <div className="chips">
          {BANKS.map((b) => <button key={b} className={bank === b ? 'sel' : ''} onClick={() => setBank(b)}>{b}</button>)}
        </div>
        <div className="form-actions">
          <button className="btn" onClick={() => setView('phone')}>Back</button>
          <span className="spacer" />
          <button className="btn primary" disabled={!bank} onClick={() => wait(`Redirecting to ${bank}…`, 1000, () => setView('ddBankAuth'))}>Continue to bank</button>
        </div>
      </div>
    );
  } else if (view === 'ddBankAuth') {
    body = (
      <div className="gframe">
        <div className="gframe-head"><Icon name="account_balance" /> <span>{bank} · Direct Debit authorisation</span></div>
        <div className="gframe-demo"><Icon name="science" /> Simulated bank page. No bank login or account details are needed.</div>
        <h2>Authorise Direct Debit mandate</h2>
        <div className="summary-box">
          <div><span>Merchant</span><b>Hearth Smart Home</b></div>
          <div><span>Maximum amount</span><b>MYR {plan.price}.00</b></div>
          <div><span>Frequency</span><b>Monthly</b></div>
        </div>
        <div className="form-actions">
          <button className="btn" onClick={() => setView('ddBank')}>Cancel</button>
          <span className="spacer" />
          <button className="btn primary" onClick={() => wait('Mandate approved. Returning to Hearth…', 1200, afterPayment)}>Approve</button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="auth-card left">
        <h1>Confirm your subscription</h1>
        <div className="summary-box">
          <div><span>Home</span><b>{homeName ?? 'New home'}</b></div>
          <div><span>Plan</span><b>{plan.name}</b></div>
          <div><span>Paired devices</span><b>{pairedCount} of {plan.devices}</b></div>
          <div><span>Payment method</span><b>{method}{bank ? ` · ${bank}` : ''}</b></div>
          {customer && <div><span>Billing account</span><b>{customer.account}</b></div>}
          <div className="total"><span>Monthly price</span><b>MYR {plan.price}.00</b></div>
        </div>
        <label className="consent">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I agree to pay <b>MYR {plan.price}/month</b> for the {plan.name} plan for {homeName ?? 'my new home'} via <b>{method}</b>
            {customer ? ` on billing account ${customer.account}` : ` from my ${bank} account`}, starting from my first paired device.
            I can cancel anytime.
          </span>
        </label>
        <div className="form-actions">
          <button className="btn" onClick={() => setView(customer ? 'ctb' : 'ddBank')}>Back</button>
          <span className="spacer" />
          <button className="btn primary" disabled={!agreed}
            onClick={() => onDone({ method, bank, billingAccount: customer?.account ?? null, phone })}>
            Proceed <Icon name="arrow_forward" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth pair">
      <button className="icon-btn back-btn" onClick={onCancel} aria-label="Cancel"><Icon name="close" /></button>
      <Stepper steps={STEPS} step={step} label="Subscription progress" />
      {body}
    </div>
  );
}
