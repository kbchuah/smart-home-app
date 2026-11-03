export const PLAN = {
  id: 'premium', name: 'Premium Home', price: 60, devices: 4,
  tagline: 'Smart home control, powered by AI.',
  perks: [
    'Up to 4 devices in 1 home',
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
  existing: { name: 'KB', email: 'kb.demo@gmail.com', initials: 'K', structures: ['kb'], subscription: { method: 'Charge to Bill' } },
  future: { name: 'Future', email: 'future@example.com', initials: 'F', structures: ['future_kl', 'future_penang', 'future_office'], subscription: { method: 'Direct Debit' } },
  fresh: { name: 'New User', email: 'new.user.demo@gmail.com', initials: 'N', structures: [] },
};
