export const PLANS = [
  { id: 'starter', name: 'Starter', price: 60, devices: 4, perks: ['Up to 4 devices', '1 home', 'Routines & schedules', 'Email support'] },
  { id: 'plus', name: 'Plus', price: 120, devices: 10, popular: true, perks: ['Up to 10 devices', 'Up to 3 homes', 'Camera history (7 days)', 'Priority support'] },
  { id: 'family', name: 'Family', price: 200, devices: 25, perks: ['Up to 25 devices', 'Unlimited homes', 'Camera history (30 days)', 'Share with 6 members'] },
];

// Mock accounts for the simulated Google sign-in.
export const DEMO_USERS = {
  existing: { name: 'KB', email: 'kb.demo@gmail.com', initials: 'K' },
  fresh: { name: 'New User', email: 'new.user.demo@gmail.com', initials: 'N' },
};
