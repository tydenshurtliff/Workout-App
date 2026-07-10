import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthScreen from './AuthScreen';
import FitnessTracker from './FitnessTracker';

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div style={{ minHeight: '100vh', background: '#08090c', color: '#7c88a6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!session) return <AuthScreen />;
  return <FitnessTracker user={session.user} />;
}