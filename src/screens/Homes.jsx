import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useHome } from '../store.js';

export default function Homes({ user, onOpen, onLogout }) {
  const [home] = useHome();
  const [toast, setToast] = useState(null);
  const structures = user?.isNew ? [] : [{ id: 'kb', name: home.homeName, rooms: home.rooms.length, devices: home.devices.length, ecosystem: 'Google Home Premium' }];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow"><Icon name="cottage" fill /> Hearth</p>
          <h1>Hi, {user?.name}</h1>
        </div>
        <div className="top-actions">
          <button className="btn subtle" onClick={onLogout}><Icon name="logout" /> Log out</button>
          <div className="avatar" title={user?.email}>{user?.initials}</div>
        </div>
      </header>

      <h3 className="section-title">Your homes <small>{structures.length}</small></h3>

      {structures.length === 0 ? (
        <div className="empty-state">
          <span className="empty-art"><Icon name="add_home" /></span>
          <h2>No homes or devices yet</h2>
          <p className="muted">Add your first device to get started. We'll help you set up your home along the way.</p>
          <button className="btn primary cta" onClick={() => setToast('Add device flow coming soon')}>
            <Icon name="add" /> Add device
          </button>
        </div>
      ) : (
        <div className="structures">
          {structures.map((s) => (
            <button key={s.id} className="structure" onClick={onOpen}>
              <span className="structure-icon"><Icon name="home" fill /></span>
              <span className="structure-body">
                <b>{s.name}</b>
                <small>{s.rooms} rooms · {s.devices} devices</small>
                {s.ecosystem && <span className="ecosystem"><Icon name="hub" /> Powered by {s.ecosystem}</span>}
              </span>
              <Icon name="chevron_right" />
            </button>
          ))}
        </div>
      )}

      {toast && <div className="toast" role="status"><Icon name="info" fill /> {toast}</div>}
    </div>
  );
}
