import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHome } from '../store.js';
import { DEVICE_TYPES } from '../data.js';
import Icon from '../components/Icon.jsx';
import DeviceTile from '../components/DeviceTile.jsx';
import DeviceControls from '../components/DeviceControls.jsx';
import DeviceForm from '../components/DeviceForm.jsx';
import FirstPairing from './FirstPairing.jsx';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import WifiChange from '../components/WifiChange.jsx';
import CancelPremium from '../components/CancelPremium.jsx';
import PremiumFeatures from '../components/PremiumFeatures.jsx';
import { isPremium, resumePremium, billedPrice, addMonth, renewsOn } from '../mockBackend.js';
import UnpairDevice from '../components/UnpairDevice.jsx';
import { uid } from '../data.js';
import RoomManager from '../components/RoomManager.jsx';
import Modal from '../components/Modal.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard({ structureId, user, plan, onBack }) {
  const [state, dispatch] = useHome(structureId);
  const { rooms, devices, routines } = state;
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null); // { device } | null — edit an existing device
  const [pairing, setPairing] = useState(null); // { roomId? } | null — pair a new device
  const [wifiFor, setWifiFor] = useState(null); // device id whose Wi-Fi is being changed
  const [cancelling, setCancelling] = useState(null); // { price, endsOn } while the cancel dialog is open
  const [upgrading, setUpgrading] = useState(false); // free home re-subscribing
  const [unpairId, setUnpairId] = useState(null); // device being unpaired
  const [showRooms, setShowRooms] = useState(false);
  const [toast, setToast] = useState(null);

  const update = useCallback((id, patch) => dispatch({ type: 'update', id, patch }), [dispatch]);
  const toggle = useCallback((id) => dispatch({ type: 'toggle', id }), [dispatch]);

  // Simulate thermostats drifting toward their target temperature.
  useEffect(() => {
    const t = setInterval(() => {
      devices.filter((d) => d.type === 'thermostat').forEach((d) => {
        const goal = d.on ? d.target : 20;
        const diff = goal - d.current;
        if (Math.abs(diff) >= 0.05) update(d.id, { current: Math.round((d.current + Math.sign(diff) * Math.min(0.1, Math.abs(diff))) * 10) / 10 });
      });
    }, 2000);
    return () => clearInterval(t);
  }, [devices, update]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset filter if the selected room was deleted.
  useEffect(() => {
    if (filter !== 'all' && !rooms.some((r) => r.id === filter)) setFilter('all');
  }, [rooms, filter]);

  const summary = useMemo(() => {
    const lightsOn = devices.filter((d) => d.type === 'light' && d.on).length;
    const unlocked = devices.filter((d) => d.type === 'lock' && !d.on).length;
    const thermo = devices.find((d) => d.type === 'thermostat');
    return { lightsOn, unlocked, thermo };
  }, [devices]);

  const visibleRooms = filter === 'all' ? rooms : rooms.filter((r) => r.id === filter);
  const openDevice = devices.find((d) => d.id === openId);
  // Wi-Fi per device: devices without a saved network are assumed to be on the home's network.
  const homeWifi = state.wifi ?? null;
  const wifiOf = (d) => d.wifi ?? homeWifi;
  const offNetwork = homeWifi ? devices.filter((d) => wifiOf(d) && wifiOf(d) !== homeWifi) : [];

  const runRoutine = (r) => {
    dispatch({ type: 'runRoutine', id: r.id });
    setToast(`“${r.name}” routine ran`);
  };

  if (upgrading) {
    // Free home re-subscribes: same billing steps as first pairing (price → TAC → payment).
    return (
      <FirstPairing plan={plan} home={state} upgrade account={user?.email} onCancel={() => setUpgrading(false)}
        onDone={({ subscription }) => { dispatch({ type: 'setSubscription', subscription }); setUpgrading(false); setToast(`${plan.name} is active again`); }} />
    );
  }

  if (pairing) {
    // Same pairing flow as first pairing, in existing-home mode (no TAC/payment; price re-quoted).
    const presetRoom = rooms.find((r) => r.id === pairing.roomId);
    return (
      <FirstPairing plan={plan} home={state} defaultRoom={presetRoom?.name ?? 'My room'} onCancel={() => setPairing(null)}
        onDone={({ room, device, price }) => {
          let roomId = rooms.find((r) => r.name.toLowerCase() === room.name.toLowerCase())?.id;
          if (!roomId) { roomId = uid('room'); dispatch({ type: 'addRoom', id: roomId, name: room.name }); }
          dispatch({ type: 'addDevice', device: { ...device, roomId } });
          // Homes created before Wi-Fi was saved learn it from their next device.
          if (!state.wifi && device.wifi) dispatch({ type: 'setWifi', wifi: device.wifi });
          // Adding raises the price immediately; it never lowers it (drops wait for renewal).
          if (isPremium(state.subscription) && price > billedPrice(state)) {
            dispatch({ type: 'patchSubscription', patch: { price } });
          }
          setPairing(null);
          setFilter('all');
          setToast(`${device.name} added`);
        }} />
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <button className="eyebrow back" onClick={onBack} aria-label="Back to homes">
            <Icon name="arrow_back" /> <Icon name="home" fill /> {state.homeName}
          </button>
          <h1>{greeting()}</h1>
          {state.ecosystem && <span className="ecosystem"><Icon name="hub" /> Powered by {state.ecosystem}</span>}
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setShowRooms(true)} aria-label="Home settings" title="Home settings"><Icon name="settings" /></button>
          <div className="avatar" aria-hidden>{user?.initials ?? 'H'}</div>
        </div>
      </header>

      <SubscriptionCard home={state}
        onCancel={(price, endsOn) => setCancelling({ price, endsOn })}
        onUndo={async () => { await resumePremium(); dispatch({ type: 'patchSubscription', patch: { status: 'active' } }); setToast('Cancellation undone. Premium continues.'); }}
        onUpgrade={() => setUpgrading(true)}
        onRenew={(next) => { dispatch({ type: 'patchSubscription', patch: { price: next, renewsOn: addMonth(renewsOn(state.subscription)) } }); setToast(`Renewed: now ${'MYR'} ${next.toFixed(2)}/month`); }}
        onEndPeriod={() => { dispatch({ type: 'patchSubscription', patch: { status: 'free' } }); setToast(`${state.homeName} is now on the free plan`); }} />
      {cancelling && (
        <CancelPremium home={state} price={cancelling.price} endsOn={cancelling.endsOn} onClose={() => setCancelling(null)}
          onCancelled={() => dispatch({ type: 'patchSubscription', patch: { status: 'cancelling', renewsOn: new Date(cancelling.endsOn).toISOString() } })} />
      )}

      <section className="summary">
        {devices.some((d) => d.type === 'light') && (
          <button className="chip-card" onClick={() => setFilter('all')}>
            <Icon name="lightbulb" fill={summary.lightsOn > 0} />
            <span><b>{summary.lightsOn}</b> light{summary.lightsOn === 1 ? '' : 's'} on</span>
          </button>
        )}
        {summary.thermo && (
          <button className="chip-card" onClick={() => setOpenId(summary.thermo.id)}>
            <Icon name="thermostat" />
            <span><b>{summary.thermo.current.toFixed(1)}°</b> indoors</span>
          </button>
        )}
        {devices.some((d) => d.type === 'lock') && (
          <button className={`chip-card ${summary.unlocked ? 'warn' : ''}`}
            onClick={() => { const l = devices.find((d) => d.type === 'lock'); if (l) setOpenId(l.id); }}>
            <Icon name={summary.unlocked ? 'lock_open' : 'lock'} fill />
            <span>{summary.unlocked ? <><b>{summary.unlocked}</b> unlocked</> : 'All locked'}</span>
          </button>
        )}
      </section>

      <section>
        <h3 className="section-title">Routines</h3>
        <div className="routines">
          {routines.map((r) => (
            <button key={r.id} className="routine" onClick={() => runRoutine(r)}>
              <Icon name={r.icon} fill /> {r.name}
            </button>
          ))}
        </div>
      </section>

      {state.subscription && (
        <PremiumFeatures premium={isPremium(state.subscription)} onUpgrade={() => setUpgrading(true)}
          onTry={(f) => setToast(`${f.name} is on for this home`)} />
      )}

      <nav className="filters" aria-label="Filter by room">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All rooms</button>
        {rooms.map((r) => (
          <button key={r.id} className={filter === r.id ? 'active' : ''} onClick={() => setFilter(r.id)}>{r.name}</button>
        ))}
      </nav>

      {offNetwork.length > 0 && (
        <div className="alert warn wifi-banner"><Icon name="wifi_off" />
          <span><b>{offNetwork.length} device{offNetwork.length === 1 ? ' is' : 's are'} on a different Wi-Fi network.</b>{' '}
            Your home network is {homeWifi}. Open {offNetwork.length === 1 ? 'it' : 'each one'} to change its Wi-Fi: {offNetwork.map((d) => d.name).join(', ')}.</span>
        </div>
      )}

      {visibleRooms.map((room) => {
        const list = devices.filter((d) => d.roomId === room.id);
        const anyOn = list.some((d) => d.on && d.type !== 'lock' && d.type !== 'camera');
        return (
          <section key={room.id} className="room">
            <div className="room-head">
              <h3 className="section-title">{room.name} <small>{list.length}</small></h3>
              {list.some((d) => d.type !== 'lock' && d.type !== 'camera') && (
                <button className="btn subtle" onClick={() => dispatch({ type: 'roomPower', roomId: room.id, on: !anyOn })}>
                  <Icon name="power_settings_new" /> {anyOn ? 'Turn off all' : 'Turn on all'}
                </button>
              )}
            </div>
            {list.length ? (
              <div className="grid">
                {list.map((d) => <DeviceTile key={d.id} device={d} onToggle={toggle} onOpen={setOpenId} wifiMismatch={offNetwork.includes(d)} />)}
              </div>
            ) : (
              <button className="empty" onClick={() => setPairing({ roomId: room.id })}>
                <Icon name="add_circle" /> Add a device to {room.name}
              </button>
            )}
          </section>
        );
      })}

      <button className="fab" onClick={() => setPairing({ roomId: filter !== 'all' ? filter : undefined })}>
        <Icon name="add" /> Add device
      </button>

      {openDevice && (
        <Modal
          title={openDevice.name}
          onClose={() => setOpenId(null)}
          actions={
            <button className="icon-btn" aria-label="Edit device" title="Edit device"
              onClick={() => { setForm({ device: openDevice }); setOpenId(null); }}>
              <Icon name="edit" />
            </button>
          }
        >
          <p className="sheet-sub">
            {DEVICE_TYPES[openDevice.type].label} · {rooms.find((r) => r.id === openDevice.roomId)?.name}
          </p>
          {wifiOf(openDevice) && (
            <div className={`wifi-row ${offNetwork.includes(openDevice) ? 'warn' : ''}`}>
              <Icon name={offNetwork.includes(openDevice) ? 'wifi_off' : 'wifi'} />
              <span className="wifi-row-body"><small>Wi-Fi</small><b>{wifiOf(openDevice)}</b>
                {offNetwork.includes(openDevice)
                  ? <small>Different from your home network ({homeWifi}). Service might be impacted.</small>
                  : homeWifi === wifiOf(openDevice) && <small>Home network</small>}</span>
              <button className="btn subtle" onClick={() => setWifiFor(openDevice.id)}>Change Wi-Fi</button>
            </div>
          )}
          <DeviceControls device={openDevice} update={update} />
          <button className="btn subtle unpair-btn" onClick={() => { setUnpairId(openDevice.id); setOpenId(null); }}><Icon name="link_off" /> Unpair device</button>
        </Modal>
      )}

      {unpairId && (() => {
        const d = devices.find((x) => x.id === unpairId);
        if (!d) return null;
        return (
          <UnpairDevice home={state} device={d} onClose={() => setUnpairId(null)}
            onUnpaired={() => {
              // Keep the billed price until renewal: save it now if it was only derived from the device count.
              if (isPremium(state.subscription) && state.subscription.price == null) dispatch({ type: 'patchSubscription', patch: { price: billedPrice(state) } });
              dispatch({ type: 'removeDevice', id: d.id }); setUnpairId(null); setToast(`${d.name} unpaired`);
            }} />
        );
      })()}

      {wifiFor && (() => {
        const d = devices.find((x) => x.id === wifiFor);
        return (
          <WifiChange device={d} current={wifiOf(d)} homeWifi={homeWifi} onClose={() => setWifiFor(null)}
            onChanged={(ssid) => { update(d.id, { wifi: ssid }); setWifiFor(null); setToast(`${d.name} moved to ${ssid}`); }} />
        );
      })()}

      {form && (
        <DeviceForm
          device={form.device}
          rooms={rooms}
          defaultRoom={form.roomId}
          onClose={() => setForm(null)}
          onDelete={() => { setUnpairId(form.device.id); setForm(null); }}
          onSave={(data) => {
            if (form.device) dispatch({ type: 'update', id: form.device.id, patch: data });
            else dispatch({ type: 'addDevice', device: data });
            setToast(form.device ? 'Device saved' : `${data.name} added`);
            setForm(null);
          }}
        />
      )}

      {showRooms && <RoomManager homeName={state.homeName} rooms={rooms} devices={devices} dispatch={dispatch} onClose={() => setShowRooms(false)} />}

      {toast && <div className="toast" role="status"><Icon name="check_circle" fill /> {toast}</div>}
    </div>
  );
}
