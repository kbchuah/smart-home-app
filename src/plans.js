export const PLAN = {
  id: 'premium', name: 'Premium Home', price: 60, devices: 4, extraDevicePrice: 15, // MYR/month per device beyond `devices`
  tagline: 'Smart home control, powered by AI.',
  perks: [
    '4 devices included per home',
    'AI home assistant: control devices in plain language',
    'AI-suggested routines based on your habits',
    'Smart camera alerts: people, packages and pets',
    'Energy insights and saving tips',
    'Routines, schedules and live camera view',
    'Priority support',
  ],
};

// Mock accounts for the simulated Google sign-in.
export const DEMO_USERS = {
  existing: { name: 'KB', email: 'kb.demo@gmail.com', initials: 'K', structures: ['kb'] },
  future: { name: 'Future', email: 'future@example.com', initials: 'F', structures: ['future_kl', 'future_penang', 'future_office'] },
  fresh: { name: 'New User', email: 'new.user.demo@gmail.com', initials: 'N', structures: [] },
};

// Features that need Premium. On the free tier they are disabled (devices and basic control stay).
export const PREMIUM_FEATURES = [
  { id: 'assistant', icon: 'auto_awesome', name: 'AI home assistant', desc: 'Control devices in plain language' },
  { id: 'routines', icon: 'psychology', name: 'AI-suggested routines', desc: 'Routines based on your habits' },
  { id: 'alerts', icon: 'notifications_active', name: 'Smart camera alerts', desc: 'People, packages and pets' },
  { id: 'energy', icon: 'bolt', name: 'Energy insights', desc: 'Usage and saving tips' },
  { id: 'support', icon: 'support_agent', name: 'Priority support', desc: 'Faster help when you need it' },
];
// What the free tier keeps.
export const FREE_KEEPS = ['All your devices and rooms', 'On/off, controls and live camera view', 'Manual routines', 'Adding more devices at no charge'];
