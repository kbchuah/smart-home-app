// Online store for buying compatible devices (upsell links).
export const STORE_URL = 'https://store.maxis.com.my';

export const PLAN = {
  id: 'premium', name: 'Premium Home', price: 80, devices: 5, extraDevicePrice: 10, // MYR/month per device beyond `devices`
  tagline: 'Smart home control with Gemini built in.',
  // Plan basics for the marketing plan card. Features are described once, in FEATURE_COMPARE.
  perks: [
    'Priced per home',
    'Pay on your telco bill or by Direct Debit',
    'Billed monthly · cancel anytime',
  ],
};

// Mock accounts for the simulated Google sign-in.
export const DEMO_USERS = {
  existing: { name: 'KB', email: 'kb.demo@gmail.com', initials: 'K', structures: ['kb'] },
  future: { name: 'Future', email: 'future@example.com', initials: 'F', structures: ['future_kl', 'future_penang', 'future_office'] },
  fresh: { name: 'New User', email: 'new.user.demo@gmail.com', initials: 'N', structures: [] },
};

// Features, per home. One table drives the marketing page (headline + pitch: Premium only, the free
// tier isn't advertised), the in-home Premium features panel and the cancel screen (Free vs Premium).
export const FEATURE_COMPARE = [
  { id: 'video', icon: 'history', name: 'Video history', free: 'Live view + 3-hour event clips and snapshots', premium: '30-day event video history, clips up to 5 min',
    headline: '30 days of video history', pitch: 'See what happened while you were out. Event clips up to 5 minutes, kept for 30 days.' },
  { id: 'alerts', icon: 'face', name: 'Camera alerts', free: 'Motion, person, vehicle and animal', premium: 'Plus familiar faces and garage door alerts',
    headline: 'Know who\'s at the door', pitch: 'Alerts for motion, people, vehicles and animals, plus familiar faces and garage doors.' },
  { id: 'sound', icon: 'detector_smoke', name: 'Sound alerts', free: 'Not available', premium: 'Smoke/CO alarm and glass-break detection',
    headline: 'Hear what matters', pitch: 'Get alerted when a smoke or CO alarm goes off, or glass breaks.' },
  { id: 'gemini', icon: 'auto_awesome', name: 'Gemini AI', free: 'Standard voice commands', premium: 'Gemini Live conversations and Daily Home Brief',
    headline: 'Gemini for your home', pitch: 'Talk naturally with Gemini Live, and get a Daily Home Brief of what happened at home.' },
  { id: 'automation', icon: 'magic_button', name: 'Automations', free: 'Manual setup', premium: '“Help me create” from plain language',
    headline: 'Automations in plain words', pitch: 'Describe what you want, like “turn on the porch light at sunset”, and Help me create sets it up.' },
];
// Premium-only versions of each feature (in-home panel, cancel screen).
export const PREMIUM_FEATURES = FEATURE_COMPARE.map((f) => ({ id: f.id, icon: f.icon, name: f.name, desc: f.premium, freeDesc: f.free }));
// What the free tier always keeps.
export const FREE_KEEPS = ['All your devices and rooms', 'Adding more devices at no charge'];
