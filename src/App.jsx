import { useState } from 'react';
import Landing from './screens/Landing.jsx';
import AuthChoice from './screens/AuthChoice.jsx';
import GoogleFlow from './screens/GoogleFlow.jsx';
import Homes from './screens/Homes.jsx';
import Dashboard from './screens/Dashboard.jsx';
import PairDevice from './screens/PairDevice.jsx';
import Subscribe from './screens/Subscribe.jsx';
import { createHome, loadHome } from './store.js';
import { DEVICE_TYPES, GENERIC_ROUTINES, uid } from './data.js';
import { PLAN as plan } from './plans.js';

// Screens: landing → auth → signup | login → homes → dashboard
export default function App() {
  const [screen, setScreen] = useState('landing');
  const [user, setUser] = useState(null); // demo: always starts logged out
  const [structureId, setStructureId] = useState(null);

  const signedIn = (u) => {
    setUser(u);
    // Only one home? Skip the list and go straight into it.
    if (u.structures?.length === 1) { setStructureId(u.structures[0]); setScreen('dashboard'); }
    else setScreen('homes');
  };
  // New user with no home: create the home together with the first paired device.
  const firstDevicePaired = ({ home, room, device }) => {
    const id = uid('home');
    createHome(id, {
      ...home,
      rooms: [{ id: 'room1', name: room.name }],
      devices: [{ id: uid('d'), ...DEVICE_TYPES[device.type].defaults, ...device, roomId: 'room1' }],
      routines: GENERIC_ROUTINES,
    });
    setUser((u) => ({ ...u, structures: [...u.structures, id] }));
    setStructureId(id);
    setScreen('dashboard');
  };
  // First pairing needs an active subscription (TAC check → Charge to Bill / Direct Debit → agree).
  const pairedCount = () => (user?.structures ?? []).reduce((n, id) => n + loadHome(id).devices.length, 0);
  const subscribed = (subscription) => setUser((u) => ({ ...u, subscription }));
  const logout = () => { setUser(null); setScreen('landing'); };

  switch (screen) {
    case 'landing':
      return <Landing plan={plan}
        onProceed={() => setScreen(user ? 'homes' : 'auth')} />;
    case 'auth':
      return <AuthChoice plan={plan} onBack={() => setScreen('landing')}
        onSignup={() => setScreen('signup')} onLogin={() => setScreen('login')} />;
    case 'signup':
    case 'login':
      return <GoogleFlow mode={screen} plan={plan} onCancel={() => setScreen('auth')} onDone={signedIn} />;
    case 'homes':
      return <Homes user={user} onOpen={(id) => { setStructureId(id); setScreen('dashboard'); }} onLogout={logout} onAddDevice={() => setScreen(user.subscription ? 'pair' : 'subscribe')} />;
    case 'subscribe':
      return <Subscribe plan={plan} pairedCount={pairedCount()} onCancel={() => setScreen('homes')}
        onDone={(sub) => { subscribed(sub); setScreen('pair'); }} />;
    case 'pair':
      return <PairDevice onCancel={() => setScreen('homes')} onDone={firstDevicePaired} />;
    case 'dashboard':
      return <Dashboard key={structureId} structureId={structureId} user={user} plan={plan}
        pairedCount={pairedCount} onSubscribed={subscribed} onBack={() => setScreen('homes')} />;
    default:
      return null;
  }
}
