import Icon from '../components/Icon.jsx';

export default function AuthChoice({ plan, onBack, onSignup, onLogin }) {
  return (
    <div className="auth">
      <button className="icon-btn back-btn" onClick={onBack} aria-label="Back"><Icon name="arrow_back" /></button>
      <div className="auth-card">
        <span className="auth-logo"><Icon name="cottage" fill /></span>
        <h1>Welcome to Sixam Home</h1>
        <p className="muted">You're not signed in. Create an account to start your <b>{plan.name}</b> plan, or log in if you already have one.</p>
        <button className="btn primary wide" onClick={onSignup}><Icon name="person_add" /> Sign up</button>
        <button className="btn outline wide" onClick={onLogin}><Icon name="login" /> Log in</button>
      </div>
    </div>
  );
}
