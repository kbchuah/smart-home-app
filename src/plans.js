export const PLAN = {
  id: 'premium', name: 'Premium Home', price: 80, devices: 5, extraDevicePrice: 10, // MYR/month per device beyond `devices`
  tagline: 'Smart home control with Gemini built in.',
  perks: [
    '5 devices included per home',
    '30-day event video history',
    'Familiar face and garage door alerts',
    'Smoke/CO alarm and glass-break detection',
    'Gemini Live and Daily Home Brief',
    '“Help me create” automations',
  ],
};

// Mock accounts for the simulated Google sign-in.
export const DEMO_USERS = {
  existing: { name: 'KB', email: 'kb.demo@gmail.com', initials: 'K', structures: ['kb'] },
  future: { name: 'Future', email: 'future@example.com', initials: 'F', structures: ['future_kl', 'future_penang', 'future_office'] },
  fresh: { name: 'New User', email: 'new.user.demo@gmail.com', initials: 'N', structures: [] },
};

// Free vs Premium, per home. One table drives the marketing page, the comparison table,
// the in-home Premium features panel and the cancel screen.
export const FEATURE_COMPARE = [
  { id: 'video', icon: 'history', name: 'Video history', free: 'Live view + 3-hour event clips and snapshots', premium: '30-day event video history, clips up to 5 min' },
  { id: 'alerts', icon: 'face', name: 'Camera alerts', free: 'Motion, person, vehicle and animal', premium: 'Plus familiar faces and garage door alerts' },
  { id: 'sound', icon: 'detector_smoke', name: 'Sound alerts', free: 'Not available', premium: 'Smoke/CO alarm and glass-break detection' },
  { id: 'gemini', icon: 'auto_awesome', name: 'Gemini AI', free: 'Standard voice commands', premium: 'Gemini Live conversations and Daily Home Brief' },
  { id: 'automation', icon: 'magic_button', name: 'Automations', free: 'Manual setup', premium: '“Help me create” from plain language' },
];
// Premium-only versions of each feature (in-home panel, cancel screen).
export const PREMIUM_FEATURES = FEATURE_COMPARE.map((f) => ({ id: f.id, icon: f.icon, name: f.name, desc: f.premium, freeDesc: f.free }));
// What the free tier always keeps.
export const FREE_KEEPS = ['All your devices and rooms', 'Adding more devices at no charge'];
