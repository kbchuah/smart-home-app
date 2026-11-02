import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import GoogleG from '../components/GoogleG.jsx';
import { DEMO_USERS } from '../plans.js';

const SIGNUP_STEPS = ['Account', 'Permissions', 'Profile', 'Plan', 'Done'];

function Stepper({ step }) {
  return (
    <ol className="stepper-bar" aria-label="Sign-up progress">
      {SIGNUP_STEPS.map((s, i) => (
        <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''}>
          <span>{i < step ? <Icon name="check" /> : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  );
}

function MockGoogleFrame({ children }) {
  return (
    <div className="gframe">
      <div className="gframe-head"><GoogleG size={20} /> <span>Sign in with Google</span></div>
      <div className="gframe-demo"><Icon name="science" /> Simulated sign-in for this demo. Nothing is sent anywhere.</div>
      {children}
    </div>
  );
}

function Spinner({ label }) {
  return <div className="spinner-wrap"><div className="spinner" /><p>{label}</p></div>;
}

export default function GoogleFlow({ mode, plan, onCancel, onDone }) {
  const isSignup = mode === 'signup';
  const account = isSignup ? { ...DEMO_USERS.fresh, isNew: true } : { ...DEMO_USERS.existing, isNew: false };
  // signup steps: 0 account, 1 permissions, 2 profile, 3 plan, 4 done. login: 0 account, 1 signing in
  const [step, setStep] = useState(-1); // -1 = intro
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(account.name);

  const next = (delay = 700) => { setBusy(true); setTimeout(() => { setBusy(false); setStep((s) => s + 1); }, delay); };

  useEffect(() => {
    if (!isSignup && step === 1) { const t = setTimeout(() => onDone(account), 1200); return () => clearTimeout(t); }
  }, [isSignup, step]); // eslint-disable-line react-hooks/exhaustive-deps

  let body;
  if (step === -1) {
    body = (
      <div className="auth-card">
        <span className="auth-logo"><Icon name={isSignup ? 'person_add' : 'login'} /></span>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{isSignup ? 'Sign up in a few steps using your Google account.' : 'Log in to see your homes and devices.'}</p>
        <button className="btn google wide" onClick={() => setStep(0)}>
          <GoogleG /> {isSignup ? 'Sign up with Google' : 'Log in with Google'}
        </button>
      </div>
    );
  } else if (busy) {
    body = <div className="auth-card"><Spinner label="Please wait…" /></div>;
  } else if (step === 0) {
    body = (
      <MockGoogleFrame>
        <h2>Choose an account</h2>
        <p className="muted">to continue to Hearth</p>
        <button className="account" onClick={() => next()}>
          <span className="avatar">{account.initials}</span>
          <span><b>{account.name}</b><small>{account.email}</small></span>
        </button>
        <button className="account other" onClick={() => next()}>
          <span className="avatar ghost"><Icon name="person" /></span><span>Use another account</span>
        </button>
      </MockGoogleFrame>
    );
  } else if (!isSignup) {
    body = <div className="auth-card"><Spinner label={`Signing in as ${account.email}…`} /></div>;
  } else if (step === 1) {
    body = (
      <MockGoogleFrame>
        <h2>Hearth wants to access your Google Account</h2>
        <p className="muted">{account.email}</p>
        <ul className="perm-list">
          <li><Icon name="badge" /> See your name and profile picture</li>
          <li><Icon name="mail" /> See your email address</li>
        </ul>
        <div className="form-actions">
          <span className="spacer" />
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={() => next()}>Allow</button>
        </div>
      </MockGoogleFrame>
    );
  } else if (step === 2) {
    body = (
      <form className="auth-card left" onSubmit={(e) => { e.preventDefault(); next(); }}>
        <h1>Your profile</h1>
        <p className="muted">We've filled this in from your Google account.</p>
        <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>Email</span><input value={account.email} readOnly /></label>
        <label className="field"><span>Country</span><select defaultValue="MY"><option value="MY">Malaysia</option><option value="SG">Singapore</option></select></label>
        <button className="btn primary wide" disabled={!name.trim()}>Continue</button>
      </form>
    );
  } else if (step === 3) {
    body = (
      <div className="auth-card left">
        <h1>Confirm your plan</h1>
        <div className="summary-box">
          <div><span>Plan</span><b>{plan.name}</b></div>
          <div><span>Devices</span><b>Up to {plan.devices}</b></div>
          <div><span>Billing</span><b>Monthly</b></div>
          <div className="total"><span>Due today</span><b>MYR {plan.price}.00</b></div>
        </div>
        <div className="pay-method"><Icon name="credit_card" /> Demo card •••• 4242 <span className="demo-pill">Mock</span></div>
        <button className="btn primary wide" onClick={() => next(1200)}>Subscribe · MYR {plan.price}/month</button>
      </div>
    );
  } else {
    body = (
      <div className="auth-card">
        <span className="auth-logo ok"><Icon name="check_circle" fill /></span>
        <h1>You're all set, {name.trim()}!</h1>
        <p className="muted">Your <b>{plan.name}</b> plan is active. Let's set up your home.</p>
        <button className="btn primary wide" onClick={() => onDone({ ...account, name: name.trim(), initials: name.trim()[0].toUpperCase(), plan: plan.name })}>
          Go to my home <Icon name="arrow_forward" />
        </button>
      </div>
    );
  }

  return (
    <div className="auth">
      <button className="icon-btn back-btn" onClick={onCancel} aria-label="Cancel"><Icon name="close" /></button>
      {isSignup && step >= 0 && <Stepper step={step} />}
      {body}
    </div>
  );
}
