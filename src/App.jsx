import { useState } from 'react';
import Landing from './screens/Landing.jsx';
import AuthChoice from './screens/AuthChoice.jsx';
import GoogleFlow from './screens/GoogleFlow.jsx';
import Homes from './screens/Homes.jsx';
import Dashboard from './screens/Dashboard.jsx';
import { PLANS } from './plans.js';

// Screens: landing → auth → signup | login → homes → dashboard
export default function App() {
  const [screen, setScreen] = useState('landing');
  const [planId, setPlanId] = useState('starter');
  const [user, setUser] = useState(null); // demo: always starts logged out
  const plan = PLANS.find((p) => p.id === planId);

  const signedIn = (u) => { setUser(u); setScreen('homes'); };
  const logout = () => { setUser(null); setScreen('landing'); };

  switch (screen) {
    case 'landing':
      return <Landing planId={planId} onSelectPlan={setPlanId}
        onProceed={() => setScreen(user ? 'homes' : 'auth')} />;
    case 'auth':
      return <AuthChoice plan={plan} onBack={() => setScreen('landing')}
        onSignup={() => setScreen('signup')} onLogin={() => setScreen('login')} />;
    case 'signup':
    case 'login':
      return <GoogleFlow mode={screen} plan={plan} onCancel={() => setScreen('auth')} onDone={signedIn} />;
    case 'homes':
      return <Homes user={user} onOpen={() => setScreen('dashboard')} onLogout={logout} />;
    case 'dashboard':
      return <Dashboard user={user} onBack={() => setScreen('homes')} />;
    default:
      return null;
  }
}
