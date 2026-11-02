import { useEffect } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ title, onClose, children, actions }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="sheet-head">
          <h2>{title}</h2>
          <div className="sheet-actions">
            {actions}
            <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          </div>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
