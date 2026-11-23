import { useEffect, useState } from 'react';
import VetCareIcon from './VetCareIcon';
import { useAuth } from '../context/AuthContext';
import MyPets from '../pages/MyPets';
import SymptomChecker from '../pages/SymptomChecker';
import HealthHistory from '../pages/HealthHistory';
import SafetyToxins from '../pages/SafetyToxins';
import Dashboard from '../pages/Dashboard';
import AIPetAssistant from '../pages/AIPetAssistant';
import NearbyVetClinics from '../pages/NearbyVetClinics';
import AccountSettings from '../pages/AccountSettings';
import { UserRound, ChevronDown, LogOut } from 'lucide-react';

const publicPages = ['Home', 'About Us', 'Services', 'How It Works', 'Safety & Toxins'];
const privatePages = ['Dashboard', 'My Pets', 'Symptom Assessment', 'AI Pet Assistant', 'Health History', 'Safety & Toxins', 'Nearby Veterinary Clinics'];

function Brand({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-xl font-bold text-green-900">
      <VetCareIcon name="paw" size={22} /> VetCare Meadow
    </button>
  );
}

function AuthScreen({ mode, onChangeMode }) {
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'Register') await register(name, email, password);
      else await login(email, password);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check that the backend is running.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-12">
      <section className="rounded-3xl border border-green-100 bg-white p-7 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-green-900">{mode === 'Register' ? 'Create an account' : 'Welcome back'}</h1>
        <p className="mt-2 text-gray-600">{mode === 'Register' ? 'Manage your pets and their health observations securely.' : 'Sign in to access your pet-owner dashboard.'}</p>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-green-50 p-1">
          {['Login', 'Register'].map(item => (
            <button key={item} type="button" aria-pressed={mode === item}
              onClick={() => { setError(''); setPassword(''); onChangeMode(item); }}
              className={`rounded-lg px-3 py-3 font-semibold ${mode === item ? 'bg-green-700 text-white' : 'text-green-900 hover:bg-green-100'}`}>
              {item}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'Register' && (
            <div>
              <label htmlFor="auth-name" className="font-medium text-gray-800">Name</label>
              <input id="auth-name" type="text" autoComplete="name" required maxLength={80}
                value={name} onChange={event => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-green-600" />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="font-medium text-gray-800">Email address</label>
            <input id="auth-email" type="email" autoComplete="email" required maxLength={254}
              value={email} onChange={event => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-green-600" />
          </div>
          <div>
            <label htmlFor="auth-password" className="font-medium text-gray-800">Password</label>
            <input id="auth-password" type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'Register' ? 'new-password' : 'current-password'}
              required minLength={mode === 'Register' ? 12 : undefined} maxLength={128}
              value={password} onChange={event => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-green-600" />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />
              Show password
            </label>
            {mode === 'Register' && <p className="mt-2 text-xs text-gray-500">Minimum 12 characters. Use a unique password.</p>}
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50">
            {busy ? 'Please wait…' : mode === 'Register' ? 'Create account' : 'Login'}
          </button>
        </form>
        <p className="mt-5 text-xs text-gray-500">Academic prototype. Use synthetic/demo data until deployment is fully security-reviewed.</p>
      </section>
    </main>
  );
}

function PublicPage({ page, goTo }) {
  if (page === 'Login' || page === 'Register') {
    return <AuthScreen mode={page} onChangeMode={goTo} />;
  }
  if (page === 'Safety & Toxins') return <SafetyToxins />;
  if (page === 'About Us') return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-4xl font-bold text-green-900">About VetCare Meadow</h1>
      <p className="mt-5 text-lg text-gray-700">VetCare Meadow is an academic web application for pet profile management, owner-reported health observations, and educational guidance for dog and cat owners.</p>
      <p className="mt-4 text-gray-600">The platform does not replace veterinary diagnosis or treatment. AI guidance is educational, and veterinary clinic search is available to registered users.</p>
    </section>
  );
  if (page === 'Services') return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="text-4xl font-bold text-green-900">Our Services</h1>
      <p className="mt-3 text-gray-600">Start with these working features. AI-assisted symptom guidance and general pet-care questions are available after login; clinic map search is available after login.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[['paw', 'Pet Profile Management', 'Create, update, and organize multiple pets.'], ['stethoscope', 'AI Symptom Assessment', 'Record observations and request educational AI guidance.'], ['bot', 'AI Pet Assistant', 'Ask general educational dog and cat care questions.'], ['clipboard', 'Health History', 'Save and revisit the observations associated with each pet.'], ['shield', 'Safety & Toxins', 'Browse educational safety information and warning signs.']].map(([icon, title, detail]) => (
          <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
            <span className="vetcare-feature-icon"><VetCareIcon name={icon} size={25} /></span>
            <h2 className="mt-3 text-xl font-bold text-green-900">{title}</h2>
            <p className="mt-2 text-gray-600">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
  if (page === 'How It Works') return (
    <section className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-4xl font-bold text-green-900">How It Works</h1>
      <ol className="mt-7 space-y-4">
        {[
          'Create an account or log in.',
          'Register your dog or cat in My Pets.',
          'Select your registered pet and record observed symptoms.',
          'Review your observations, request optional Gemini AI guidance, and read safety warnings.',
          'Save the observation and see it in Health History.',
        ].map((text, index) => <li key={text} className="rounded-2xl bg-white p-5 text-gray-700 shadow-sm"><strong className="mr-2 text-green-800">{index + 1}.</strong> {text}</li>)}
      </ol>
    </section>
  );
  return (
    <main>
      <section className="vetcare-home-hero bg-gradient-to-br from-green-50 to-emerald-100 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl vetcare-hero-grid">
          <div className="vetcare-hero-copy">
          <p className="flex items-center gap-2 font-bold text-green-700"><VetCareIcon name="paw" size={18} /> PET HEALTH & WELLNESS</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-green-950 sm:text-6xl">Every little paw deserves thoughtful care.</h1>
          <p className="mt-5 max-w-2xl text-lg text-green-900/80">Organize pet profiles, keep a history of your observations, and explore educational pet safety information in one place.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => goTo('Register')} className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-bold text-white hover:bg-green-800">Get Started <VetCareIcon name="arrow" size={17} /></button>
            <button onClick={() => goTo('How It Works')} className="rounded-xl border border-green-700 bg-white px-6 py-3 font-semibold text-green-900 hover:bg-green-50">How It Works</button>
          </div>
          </div>
          <figure className="vetcare-hero-photo">
            <img
              src="https://images.pexels.com/photos/28852102/pexels-photo-28852102/free-photo-of-dog-and-cat-standing-together-in-nature.jpeg?auto=compress&dpr=1&h=750&w=1260"
              alt="Real photograph of a dog and a cat standing outdoors together"
              loading="lazy"
              decoding="async"
              onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
            />
            <figcaption>Photo: Alex Jaison / Pexels</figcaption>
          </figure>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 py-12 md:grid-cols-3">
        {[
          ['paw', 'Multiple Pets', 'One account for your dog and cat profiles.'],
          ['clipboard', 'Observation History', 'Organized owner-reported health notes.'],
          ['shield', 'Safety First', 'Educational information and emergency reminders.'],
        ].map(([icon, title, text]) => (
          <article key={title} className="rounded-2xl bg-white p-6 shadow-sm"><span className="vetcare-feature-icon"><VetCareIcon name={icon} size={25} /></span><h2 className="mt-3 text-xl font-bold text-green-900">{title}</h2><p className="mt-2 text-gray-600">{text}</p></article>
        ))}
      </section>
    </main>
  );
}

export default function VetCarePortal() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState('Home');
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    setPage(user ? 'Dashboard' : 'Home');
    setLogoutError('');
  }, [user?.id]);

  async function handleLogout() {
    setLogoutBusy(true);
    setLogoutError('');
    try { await logout(); }
    catch (error) { setLogoutError(error.message || 'Could not log out.'); }
    finally { setLogoutBusy(false); }
  }

  if (loading) return <main role="status" className="min-h-screen bg-green-50 px-5 py-24 text-center font-semibold text-green-900">Loading VetCare Meadow...</main>;

  if (!user) return (
    <div className="min-h-screen bg-green-50 text-gray-800">
      <header className="border-b border-green-100 bg-white">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4" aria-label="Public navigation">
          <Brand onClick={() => setPage('Home')} />
          <div className="flex flex-wrap items-center gap-2">
            {publicPages.map(item => (
              <button key={item} type="button" onClick={() => setPage(item)} aria-current={page === item ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${page === item ? 'bg-green-100 text-green-900' : 'text-gray-700 hover:bg-green-50'}`}>{item}</button>
            ))}
            <button onClick={() => setPage('Login')} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-bold text-green-800">Login</button>
            <button onClick={() => setPage('Register')} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">Sign Up</button>
          </div>
        </nav>
      </header>
      <PublicPage page={page} goTo={setPage} />
      <footer className="border-t border-green-100 bg-white px-5 py-6 text-center text-sm text-gray-600">VetCare Meadow · Educational student prototype · Not a substitute for veterinary care.</footer>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-50 text-gray-800">
      <header className="border-b border-green-100 bg-white">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4" aria-label="Pet owner navigation">
          <Brand onClick={() => setPage('Dashboard')} />
          <div className="flex flex-wrap items-center gap-1">
            {privatePages.map(item => (
              <button key={item} type="button" onClick={() => setPage(item)} aria-current={page === item ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${page === item ? 'bg-green-100 text-green-900' : 'text-gray-700 hover:bg-green-50'}`}>{item}</button>
            ))}
            <details className="relative ml-1">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
                <UserRound size={17} aria-hidden="true" /> Account <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-green-100 bg-white p-2 shadow-lg">
                <button type="button" onClick={() => setPage('My Account')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-green-900 hover:bg-green-50"><UserRound size={16}/> My Account</button>
                <button type="button" onClick={handleLogout} disabled={logoutBusy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"><LogOut size={16}/> {logoutBusy ? 'Logging out...' : 'Log Out'}</button>
              </div>
            </details>
          </div>
        </nav>
      </header>
      {logoutError && <p role="alert" className="bg-red-50 px-5 py-2 text-center text-red-800">{logoutError}</p>}
      {page === 'Dashboard' && <Dashboard user={user} onNavigate={setPage} />}
      {page === 'My Pets' && <MyPets />}
      {page === 'Symptom Assessment' && <SymptomChecker />}
      {page === 'AI Pet Assistant' && <AIPetAssistant />}
      {page === 'Nearby Veterinary Clinics' && <NearbyVetClinics />}
      {page === 'Health History' && <HealthHistory />}
      {page === 'Safety & Toxins' && <SafetyToxins />}
      {page === 'My Account' && <AccountSettings />}
      <footer className="border-t border-green-100 bg-white px-5 py-5 text-center text-sm text-gray-600">VetCare Meadow · Academic prototype · Observations are not veterinary diagnoses.</footer>
    </div>
  );
}
