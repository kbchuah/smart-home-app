import { useEffect, useState } from 'react';
import ShopDevices from '../components/ShopDevices.jsx';
import Icon from '../components/Icon.jsx';
import { loadHome } from '../store.js';
import { billedPrice, subStatus } from '../mockBackend.js';

// Each home gets its own colour in the list.
const HOME_TONES = ['sage', 'blue', 'honey', 'plum'];

export default function Homes({ user, onOpen, onLogout, onAddHome }) {
  const [toast, setToast] = useState(null);
  const structures = (user?.structures ?? []).filter((id) => loadHome(id)).map((id) => {
    const h = loadHome(id);
    return { id, name: h.homeName, rooms: h.rooms.length, devices: h.devices.length, ecosystem: h.ecosystem, billing: h.subscription?.method, price: h.subscription ? billedPrice(h) : null, status: subStatus(h.subscription) };
  });

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

      <div className="room-head">
        <h3 className="section-title">Your homes <small>{structures.length}</small></h3>
        {structures.length > 0 && <button className="btn subtle" onClick={onAddHome}><Icon name="add_home" /> Add home</button>}
      </div>

      {structures.length === 0 ? (
        <div className="empty-state">
          <span className="empty-art"><Icon name="add_home" /></span>
          <h2>No homes or devices yet</h2>
          <p className="muted">Add your first device to get started. We'll help you set up your home along the way.</p>
          <button className="btn primary cta" onClick={onAddHome}>
            <Icon name="add" /> Add device
          </button>
          <ShopDevices />
        </div>
      ) : (
        <div className="structures">
          {structures.map((s, i) => (
            <button key={s.id} className="structure" onClick={() => onOpen(s.id)}>
              <span className={`structure-icon tone-${HOME_TONES[i % HOME_TONES.length]}`}><Icon name="home" fill /></span>
              <span className="structure-body">
                <b>{s.name}</b>
                <small>{s.rooms} room{s.rooms === 1 ? '' : 's'} · {s.devices} device{s.devices === 1 ? '' : 's'}{s.status === 'free' ? ' · Free plan' : `${s.price ? ` · MYR ${s.price}/month` : ''}${s.billing ? ` · ${s.billing}` : ''}${s.status === 'cancelling' ? ' · Ending' : ''}`}</small>
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
