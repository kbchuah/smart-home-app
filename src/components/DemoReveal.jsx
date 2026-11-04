import Icon from './Icon.jsx';
import { useDemoReveal, setDemoReveal } from '../demoStore.js';

// Demo-only content, collapsed behind a small "Show demo options" button so the screen looks real.
export default function DemoReveal({ label = 'Demo options', children }) {
  const shown = useDemoReveal();
  if (!shown) {
    return (
      <button type="button" className="demo-reveal-btn" onClick={() => setDemoReveal(true)}>
        <Icon name="science" /> Show demo options
      </button>
    );
  }
  return (
    <div className="demo-reveal">
      <div className="demo-reveal-head">
        <span><Icon name="science" /> {label}</span>
        <button type="button" className="demo-reveal-hide" onClick={() => setDemoReveal(false)}>Hide</button>
      </div>
      {children}
    </div>
  );
}

// Inline demo text (hints, test-data notes): shown only while demo options are revealed.
export function DemoOnly({ children }) {
  return useDemoReveal() ? children : null;
}
