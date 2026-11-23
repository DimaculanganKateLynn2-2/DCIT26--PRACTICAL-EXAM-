import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthGate({ children }) {
  const { user, loading, login, register, logout } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [logoutError, setLogoutError] = useState('');

  if (loading) return <div className="min-h-screen bg-green-50 p-12 text-center text-green-900" role="status">Checking account…</div>;

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'register') await register(name, email, password);
      else await login(email, password);
      setPassword('');
    } catch (err) { setError(err.message || 'Could not sign in.'); }
    finally { setBusy(false); }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-12">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-md">
          <div className="text-center">
            <div className="text-4xl">🐾</div>
            <h1 className="mt-2 text-3xl font-bold text-green-900">VetCare Meadow</h1>
            <p className="mt-2 text-gray-600">{mode === 'register' ? 'Create your pet owner account' : 'Welcome back'}</p>
          </div>
          <div className="mt-6 flex gap-3">
            {['login', 'register'].map(item => (
              <button key={item} type="button" aria-pressed={mode === item}
                onClick={() => { setMode(item); setError(''); }}
                className={`flex-1 rounded-lg px-4 py-2 font-semibold ${mode === item ? 'bg-green-700 text-white' : 'bg-green-50 text-green-900'}`}>
                {item === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div><label htmlFor="reg-name" className="font-medium">Full name</label>
                <input id="reg-name" className="mt-2 w-full rounded-xl border p-3" required maxLength={80}
                  value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></div>
            )}
            <div><label htmlFor="auth-email" className="font-medium">Email</label>
              <input id="auth-email" type="email" className="mt-2 w-full rounded-xl border p-3" required
                autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label htmlFor="auth-password" className="font-medium">Password</label>
              <input id="auth-password" type="password" className="mt-2 w-full rounded-xl border p-3" required
                minLength={mode === 'register' ? 12 : undefined} maxLength={128}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password} onChange={e => setPassword(e.target.value)} /></div>
            {mode === 'register' && <p className="text-xs text-gray-500">Use at least 12 characters and a unique password.</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-green-700 px-6 py-3 font-semibold text-white disabled:opacity-50">
              {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Login'}
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-gray-500">Student prototype. Use sample observations until the system is fully reviewed.</p>
        </section>
      </main>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-green-950 px-5 py-2 text-sm text-white">
        <span>Signed in: {user.name} ({user.email})</span>
        <button className="rounded-md border border-white/50 px-3 py-1 hover:bg-green-800"
          onClick={async () => { setLogoutError(''); try { await logout(); } catch (err) { setLogoutError(err.message); } }}>
          Log out
        </button>
      </div>
      {logoutError && <p role="alert" className="bg-red-50 px-5 py-2 text-red-700">{logoutError}</p>}
      {children}
    </div>
  );
}
