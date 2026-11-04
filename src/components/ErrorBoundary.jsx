import { Component } from 'react';
import Icon from './Icon.jsx';

// Shows a recovery screen instead of a blank page if the app crashes.
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Hearth crashed', error, info?.componentStack); }
  reset = () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith('hearth-')).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    window.location.reload();
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app"><div className="auth-card" style={{ margin: '15vh auto 0' }}>
        <span className="auth-logo err"><Icon name="sync_problem" /></span>
        <h1>Something went wrong</h1>
        <p className="muted">The demo couldn't load your saved data. Reloading usually fixes it. If not, reset the demo data and start again.</p>
        <button className="btn primary wide" onClick={() => window.location.reload()}><Icon name="refresh" /> Reload</button>
        <button className="btn outline wide" onClick={this.reset}>Reset demo data</button>
      </div></div>
    );
  }
}
