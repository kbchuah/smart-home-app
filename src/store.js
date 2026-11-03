import { useCallback, useEffect, useReducer } from 'react';
import { STRUCTURES, DEVICE_TYPES, matchesTarget, uid } from './data.js';

const keyFor = (id) => `hearth-home-v3-${id}`;
const CREATED = {}; // homes created during this session (e.g. by a new user)
const defaultsFor = (id) => STRUCTURES[id] ?? CREATED[id];

export function createHome(id, state) {
  CREATED[id] = state;
  try { localStorage.setItem(keyFor(id), JSON.stringify(state)); } catch { /* ignore */ }
}

// Read a home's saved state (or its defaults). Also used for the homes list.
export function loadHome(id) {
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable */ }
  return structuredClone(defaultsFor(id));
}

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
    case 'reset':
      return structuredClone(a.defaults);
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
