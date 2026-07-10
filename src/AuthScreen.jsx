import { useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090c', color: '#f3f5fb', fontFamily: 'sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, padding: 24 }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 8px' }}>{mode === 'signin' ? 'Log In' : 'Create Account'}</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          style={{ padding: 10, borderRadius: 8, border: '1px solid #242836', background: '#12141c', color: '#fff', fontSize: 14 }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
          style={{ padding: 10, borderRadius: 8, border: '1px solid #242836', background: '#12141c', color: '#fff', fontSize: 14 }} />
        {error && <div style={{ color: '#ff5c5c', fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={loading}
          style={{ padding: 10, borderRadius: 8, border: 'none', background: '#3e8bff', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          {loading ? 'Loading...' : mode === 'signin' ? 'Log In' : 'Sign Up'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#7c88a6', cursor: 'pointer' }}
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </div>
      </form>
    </div>
  );
}