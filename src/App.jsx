import { useEffect, useState } from 'react';
import Landing from './screens/Landing.jsx';
import AuthChoice from './screens/AuthChoice.jsx';
import GoogleFlow from './screens/GoogleFlow.jsx';
import Homes from './screens/Homes.jsx';
import Dashboard from './screens/Dashboard.jsx';
import FirstPairing from './screens/FirstPairing.jsx';
import { createHome, loadHome } from './store.js';
import { DEVICE_TYPES, GENERIC_ROUTINES, uid } from './data.js';
import { PLAN as plan } from './plans.js';
import { loadSession, saveSession } from './session.js';

// Where a signed-in user lands: their only home, or the homes list.
const landingFor = (u) => (u?.structures?.length === 1 ? { screen: 'dashboard', id: u.structures[0] } : { screen: 'homes', id: null });

// Screens: landing → auth → signup | login → homes → dashboard
export default function App() {
  // A saved session skips the marketing page after a refresh.
  const [user, setUser] = useState(loadSession);
  const [screen, setScreen] = useState(() => (user ? landingFor(user).screen : 'landing'));
  const [structureId, setStructureId] = useState(() => (user ? landingFor(user).id : null));
  useEffect(() => { saveSession(user); }, [user]);

  const signedIn = (u) => {
    setUser(u);
    // Only one home? Skip the list and go straight into it.
    const to = landingFor(u);
    setStructureId(to.id); setScreen(to.screen);
  };
  // New user with no home: create the home together with the first paired device.
  const firstDevicePaired = ({ home, room, device, subscription }) => {
    const id = uid('home');
    createHome(id, {
      ...home,
      subscription,
      rooms: [{ id: 'room1', name: room.name }],
      devices: [{ id: uid('d'), ...DEVICE_TYPES[device.type].defaults, ...device, roomId: 'room1' }],
      routines: GENERIC_ROUTINES,
    });
    setUser((u) => ({ ...u, structures: [...u.structures, id] }));
    setStructureId(id);
    setScreen('dashboard');
  };
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
      return <Homes user={user} onOpen={(id) => { setStructureId(id); setScreen('dashboard'); }} onLogout={logout} onAddHome={() => setScreen('firstPair')} />;
    case 'firstPair':
      // New home: billing is per home, so its first pairing includes the subscription.
      return <FirstPairing plan={plan} account={user?.email} existingHomeNames={(user?.structures ?? []).map((id) => loadHome(id).homeName)} onCancel={() => setScreen('homes')} onDone={firstDevicePaired} />;
    case 'dashboard':
      return <Dashboard key={structureId} structureId={structureId} user={user} plan={plan} onBack={() => setScreen('homes')} />;
    default:
      return null;
  }
}
