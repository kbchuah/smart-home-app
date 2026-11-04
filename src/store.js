import { useCallback, useEffect, useReducer } from 'react';
import { STRUCTURES, DEVICE_TYPES, matchesTarget, uid } from './data.js';

const keyFor = (id) => `hearth-home-v6-${id}`;
// Older storage versions. Homes saved under them are moved to the current key on first read,
// so a version bump never loses a home the user created (that blanked the app once).
const LEGACY = [
  { key: (id) => `hearth-home-v5-${id}`, fix: (raw) => raw.replace(/unifi-home/g, 'maxis-home') },
  { key: (id) => `hearth-home-v4-${id}`, fix: (raw) => raw.replace(/unifi-home/g, 'maxis-home'), dropPrice: true }, // v4 = old pricing
];
const CREATED = {}; // homes created during this session (e.g. by a new user)
const defaultsFor = (id) => STRUCTURES[id] ?? CREATED[id];

export function createHome(id, state) {
  CREATED[id] = state;
  try { localStorage.setItem(keyFor(id), JSON.stringify(state)); } catch { /* ignore */ }
}

// Read a home's saved state (or its defaults). Also used for the homes list.
export function loadHome(id) {
  try {
    let raw = localStorage.getItem(keyFor(id));
    if (!raw) {
      for (const v of LEGACY) {
        const old = localStorage.getItem(v.key(id));
        if (!old) continue;
        const migrated = JSON.parse(v.fix(old));
        if (v.dropPrice && migrated.subscription) delete migrated.subscription.price; // recomputed from today's price rule
        raw = JSON.stringify(migrated);
        localStorage.setItem(keyFor(id), raw);
        localStorage.removeItem(v.key(id));
        break;
      }
    }
    if (raw) {
      const saved = JSON.parse(raw);
      // Homes saved before the Wi-Fi field existed pick it up from their defaults.
      if (!saved.wifi && defaultsFor(id)?.wifi) saved.wifi = defaultsFor(id).wifi;
      // ...and billing anchors (bill cycle day / start date) for renewal dates.
      const dsub = defaultsFor(id)?.subscription;
      if (saved.subscription && dsub) for (const k of ['billCycleDay', 'startedOn']) if (saved.subscription[k] == null && dsub[k] != null) saved.subscription[k] = dsub[k];
      return saved;
    }
  } catch { /* storage unavailable */ }
  const d = defaultsFor(id);
  return d ? structuredClone(d) : null; // null: home not found (callers skip it)
}

// True if a home can be loaded (saved, or a built-in demo home).
export const homeExists = (id) => loadHome(id) != null;

function reducer(state, a) {
  const mapDevices = (fn) => ({ ...state, devices: state.devices.map(fn) });
  switch (a.type) {
    case 'update':
      return mapDevices((d) => (d.id === a.id ? { ...d, ...a.patch } : d));
    case 'toggle':
      return mapDevices((d) => (d.id === a.id ? { ...d, on: !d.on } : d));
    case 'roomPower':
      return mapDevices((d) => (d.roomId === a.roomId && d.type !== 'lock' && d.type !== 'camera' ? { ...d, on: a.on } : d));
    case 'runRoutine': {
      const r = state.routines.find((x) => x.id === a.id);
      if (!r) return state;
      let devices = state.devices;
      for (const act of r.actions) {
        devices = devices.map((d) => (matchesTarget(act.target, d) ? { ...d, ...act.set } : d));
      }
      return { ...state, devices };
    }
    case 'addDevice':
      return { ...state, devices: [...state.devices, { id: uid('d'), ...DEVICE_TYPES[a.device.type].defaults, ...a.device }] };
    case 'removeDevice':
      return { ...state, devices: state.devices.filter((d) => d.id !== a.id) };
    case 'addRoom':
      return { ...state, rooms: [...state.rooms, { id: a.id ?? uid('room'), name: a.name }] };
    case 'renameHome':
      return { ...state, homeName: a.name };
    case 'renameRoom':
      return { ...state, rooms: state.rooms.map((r) => (r.id === a.id ? { ...r, name: a.name } : r)) };
    case 'removeRoom': {
      const fallback = state.rooms.find((r) => r.id !== a.id);
      return {
        ...state,
        rooms: state.rooms.filter((r) => r.id !== a.id),
        devices: fallback
          ? state.devices.map((d) => (d.roomId === a.id ? { ...d, roomId: fallback.id } : d))
          : state.devices.filter((d) => d.roomId !== a.id),
      };
    }
    case 'setWifi':
      return { ...state, wifi: a.wifi };
    case 'setSubscription':
      return { ...state, subscription: a.subscription };
    case 'patchSubscription':
      return { ...state, subscription: { ...state.subscription, ...a.patch } };
    case 'reset':
      return a.defaults ? structuredClone(a.defaults) : state; // homes created in an earlier page session have no defaults
    default:
      return state;
  }
}

export function useHome(id) {
  const [state, rawDispatch] = useReducer(reducer, id, loadHome);
  useEffect(() => {
    try { localStorage.setItem(keyFor(id), JSON.stringify(state)); } catch { /* ignore */ }
  }, [id, state]);
  const dispatch = useCallback(
    (a) => rawDispatch(a.type === 'reset' ? { ...a, defaults: defaultsFor(id) } : a),
    [id],
  );
  return [state, dispatch];
}
