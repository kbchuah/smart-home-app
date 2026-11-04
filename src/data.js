// Device type catalog and the default demo home.

export const DEVICE_TYPES = {
  light:      { label: 'Light',      icon: 'lightbulb',        defaults: { on: false, brightness: 80, color: '#ffd27a' } },
  thermostat: { label: 'Thermostat', icon: 'thermostat',       defaults: { on: true, mode: 'heat', target: 21, current: 19.5 } },
  speaker:    { label: 'Speaker',    icon: 'speaker',          defaults: { on: false, volume: 40, track: 'Lo-fi Beats' } },
  tv:         { label: 'TV',         icon: 'tv',               defaults: { on: false, volume: 20, input: 'HDMI 1' } },
  plug:       { label: 'Plug',       icon: 'power',            defaults: { on: false } },
  lock:       { label: 'Lock',       icon: 'lock',             defaults: { on: true } }, // on = locked
  camera:     { label: 'Camera',     icon: 'videocam',         defaults: { on: true } },
  fan:        { label: 'Fan',        icon: 'mode_fan',         defaults: { on: false, speed: 2 } },
};

export const LIGHT_COLORS = ['#ffd27a', '#ffffff', '#ff8a65', '#f06292', '#ba68c8', '#64b5f6', '#4db6ac', '#aed581'];

let seq = 0;
export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

const dev = (id, name, type, roomId, extra = {}) => ({
  id, name, type, roomId, ...DEVICE_TYPES[type].defaults, ...extra,
});

export const DEFAULT_STATE = {
  homeName: 'KB home',
  wifi: 'maxis-home-5G', // the home's Wi-Fi network; new devices should join it
  ecosystem: 'Google Home Premium',
  subscription: { method: 'Charge to Bill', billingAccount: 'BA-2209-4821', billCycleDay: 15, startedOn: '2026-03-15', phone: '0123456789' },
  rooms: [
    { id: 'living', name: 'Living Room' },
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'bedroom', name: 'Bedroom' },
    { id: 'entry', name: 'Entryway' },
  ],
  devices: [
    dev('d1', 'Ceiling Light', 'light', 'living', { on: true, brightness: 70 }),
    dev('d2', 'Floor Lamp', 'light', 'living', { color: '#ff8a65' }),
    dev('d3', 'Living Room TV', 'tv', 'living'),
    dev('d4', 'Soundbar', 'speaker', 'living'),
    dev('d5', 'Pendant Lights', 'light', 'kitchen', { on: true, brightness: 100, color: '#ffffff' }),
    dev('d6', 'Coffee Maker', 'plug', 'kitchen'),
    dev('d7', 'Kitchen Display', 'speaker', 'kitchen', { volume: 25, track: 'Morning News' }),
    dev('d8', 'Bedside Lamp', 'light', 'bedroom', { brightness: 30 }),
    dev('d9', 'Thermostat', 'thermostat', 'bedroom'),
    dev('d10', 'Ceiling Fan', 'fan', 'bedroom'),
    dev('d11', 'Front Door', 'lock', 'entry'),
    dev('d12', 'Doorbell Camera', 'camera', 'entry'),
    dev('d13', 'Porch Light', 'light', 'entry', { color: '#ffd27a' }),
  ],
  routines: [
    {
      id: 'r_morning', name: 'Good morning', icon: 'wb_sunny',
      actions: [
        { target: 'type:light', set: { on: true, brightness: 80 } },
        { target: 'type:thermostat', set: { on: true, target: 22 } },
        { target: 'd6', set: { on: true } },
        { target: 'd7', set: { on: true } },
      ],
    },
    {
      id: 'r_leaving', name: 'Leaving home', icon: 'directions_walk',
      actions: [
        { target: 'all', set: { on: false } },
        { target: 'type:lock', set: { on: true } },
        { target: 'type:camera', set: { on: true } },
      ],
    },
    {
      id: 'r_movie', name: 'Movie time', icon: 'movie',
      actions: [
        { target: 'room:living', set: { on: false } },
        { target: 'd2', set: { on: true, brightness: 20, color: '#ba68c8' } },
        { target: 'd3', set: { on: true } },
        { target: 'd4', set: { on: true, volume: 55 } },
      ],
    },
    {
      id: 'r_night', name: 'Good night', icon: 'bedtime',
      actions: [
        { target: 'type:light', set: { on: false } },
        { target: 'type:tv', set: { on: false } },
        { target: 'type:speaker', set: { on: false } },
        { target: 'type:lock', set: { on: true } },
        { target: 'type:thermostat', set: { target: 19 } },
      ],
    },
  ],
};

// Routines that only use type targets, so they work in any home.
export const GENERIC_ROUTINES = [
  { id: 'r_morning', name: 'Good morning', icon: 'wb_sunny', actions: [
    { target: 'type:light', set: { on: true, brightness: 80 } },
    { target: 'type:thermostat', set: { on: true, target: 22 } },
  ] },
  { id: 'r_leaving', name: 'Leaving', icon: 'directions_walk', actions: [
    { target: 'all', set: { on: false } },
    { target: 'type:lock', set: { on: true } },
    { target: 'type:camera', set: { on: true } },
  ] },
  { id: 'r_night', name: 'Good night', icon: 'bedtime', actions: [
    { target: 'type:light', set: { on: false } },
    { target: 'type:tv', set: { on: false } },
    { target: 'type:lock', set: { on: true } },
  ] },
];

// Every demo home (structure), keyed by id. Each keeps its own saved state.
export const STRUCTURES = {
  kb: DEFAULT_STATE,
  future_kl: {
    homeName: 'Future home, KL',
    wifi: 'maxis-home-5G',
    ecosystem: 'Google Home Premium',
    subscription: { method: 'Charge to Bill', billingAccount: 'BA-3310-1177', billCycleDay: 22, startedOn: '2026-05-22', phone: '0198765432' },
    rooms: [{ id: 'living', name: 'Living Room' }, { id: 'kitchen', name: 'Kitchen' }, { id: 'master', name: 'Master Bedroom' }],
    devices: [
      dev('f1', 'Living Room Lights', 'light', 'living', { on: true, brightness: 60 }),
      dev('f2', 'Smart Display', 'speaker', 'living'),
      dev('f3', 'Kitchen Lights', 'light', 'kitchen', { color: '#ffffff' }),
      dev('f4', 'Air Conditioner', 'thermostat', 'master', { mode: 'cool', target: 24, current: 27 }),
      dev('f5', 'Front Door', 'lock', 'living'),
    ],
    routines: GENERIC_ROUTINES,
  },
  future_penang: {
    homeName: 'Penang condo',
    wifi: 'maxis-home-2.4G',
    ecosystem: 'Samsung SmartThings',
    subscription: { method: 'Direct Debit', bank: 'Maybank', startedOn: '2026-08-17', phone: '0174441234' },
    rooms: [{ id: 'living', name: 'Living Room' }, { id: 'bedroom', name: 'Bedroom' }],
    devices: [
      dev('p1', 'Living Room TV', 'tv', 'living'),
      dev('p2', 'Ceiling Fan', 'fan', 'living', { on: true, speed: 1 }),
      dev('p3', 'Bedroom Lamp', 'light', 'bedroom', { color: '#ff8a65' }),
      dev('p4', 'Aircond', 'thermostat', 'bedroom', { on: false, mode: 'cool', target: 25, current: 29 }),
    ],
    routines: GENERIC_ROUTINES,
  },
  future_office: {
    homeName: 'Office',
    wifi: 'maxis-home-5G',
    ecosystem: 'Apple Home',
    subscription: { method: 'Direct Debit', bank: 'CIMB Bank', startedOn: '2026-01-31', phone: '0165550199' }, // shows month-end clamping
    rooms: [{ id: 'work', name: 'Workspace' }, { id: 'meeting', name: 'Meeting Room' }],
    devices: [
      dev('o1', 'Desk Lights', 'light', 'work', { on: true, brightness: 90, color: '#ffffff' }),
      dev('o2', 'Coffee Machine', 'plug', 'work'),
      dev('o3', 'Meeting Room Screen', 'tv', 'meeting', { input: 'HDMI 2' }),
      dev('o4', 'Entrance Camera', 'camera', 'work'),
      dev('o5', 'Office Door', 'lock', 'work', { on: false }),
    ],
    routines: GENERIC_ROUTINES,
  },
};

// Does a routine action target apply to this device?
export function matchesTarget(target, d) {
  if (target === 'all') return d.type !== 'lock' && d.type !== 'camera' && d.type !== 'thermostat';
  if (target.startsWith('type:')) return d.type === target.slice(5);
  if (target.startsWith('room:')) return d.roomId === target.slice(5);
  return d.id === target;
}

export function statusText(d) {
  switch (d.type) {
    case 'light': return d.on ? `${d.brightness}%` : 'Off';
    case 'thermostat': return d.on ? `${d.mode === 'heat' ? 'Heat' : 'Cool'} · ${d.target}°` : 'Off';
    case 'speaker': return d.on ? `Playing · ${d.volume}%` : 'Off';
    case 'tv': return d.on ? d.input : 'Off';
    case 'lock': return d.on ? 'Locked' : 'Unlocked';
    case 'camera': return d.on ? 'Live' : 'Off';
    case 'fan': return d.on ? `Speed ${d.speed}` : 'Off';
    default: return d.on ? 'On' : 'Off';
  }
}
