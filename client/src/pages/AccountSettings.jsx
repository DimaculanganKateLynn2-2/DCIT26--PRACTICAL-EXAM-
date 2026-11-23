import { useState } from 'react';
import { CircleAlert, KeyRound, Save, Trash2, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { permanentlyDeleteAccount, saveAccountName, updateAccountPassword } from '../services/accountApi';

const fieldStyle = 'mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-700 focus:outline-none';

export default function AccountSettings() {
  const { user, updateCurrentUser, endLocalSession } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteText, setDeleteText] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function saveProfile(event) {
    event.preventDefault(); setProfileError(''); setProfileStatus('');
    setProfileBusy(true);
    try {
      const result = await saveAccountName(name.trim());
      updateCurrentUser(result.user);
      setProfileStatus('Account name updated successfully.');
    } catch (error) { setProfileError(error.message); }
    finally { setProfileBusy(false); }
  }

  async function changePassword(event) {
    event.preventDefault(); setPasswordError('');
    if (newPassword !== repeat) { setPasswordError('New passwords do not match.'); return; }
    setPasswordBusy(true);
    try {
      const result = await updateAccountPassword(current, newPassword);
      setCurrent(''); setNewPassword(''); setRepeat('');
      if (result.signedOut) endLocalSession(); // Requires fresh login after password change.
    } catch (error) { setPasswordError(error.message); }
    finally { setPasswordBusy(false); }
  }

  async function deleteMyAccount(event) {
    event.preventDefault(); setDeleteError('');
    if (deleteText !== 'DELETE') { setDeleteError('Type DELETE exactly to confirm.'); return; }
    const confirmed = window.confirm('Permanently delete your account, registered pets, all saved health records, and assessment drafts? This cannot be undone.');
    if (!confirmed) return;
    setDeleteBusy(true);
    try {
      await permanentlyDeleteAccount(deletePassword, deleteText);
      setDeletePassword(''); setDeleteText('');
      endLocalSession();
    } catch (error) { setDeleteError(error.message); }
    finally { setDeleteBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-gray-800">
      <h1 className="text-3xl font-bold text-green-900">My Account</h1>
      <p className="mt-2 text-gray-600">Manage your profile and account security.</p>

      <section className="mt-7 rounded-3xl border border-green-100 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="flex items-center gap-2 text-xl font-bold text-green-900"><UserRound size={22} /> Account Information</h2>
        <p className="mt-4 text-sm text-gray-500">Email address</p>
        <p className="font-semibold break-all">{user?.email}</p>
        <form onSubmit={saveProfile} className="mt-5">
          <label htmlFor="account-name" className="font-semibold">Account name</label>
          <input id="account-name" value={name} maxLength={80} required autoComplete="name" onChange={e => setName(e.target.value)} className={fieldStyle} />
          {profileStatus && <p role="status" className="mt-3 text-sm text-green-800">{profileStatus}</p>}
          {profileError && <p role="alert" className="mt-3 text-sm text-red-700">{profileError}</p>}
          <button type="submit" disabled={profileBusy || !name.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"><Save size={17}/>{profileBusy ? 'Saving...' : 'Save Name'}</button>
        </form>
      </section>

      <section className="mt-5 rounded-3xl border border-green-100 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="flex items-center gap-2 text-xl font-bold text-green-900"><KeyRound size={22}/> Change Password</h2>
        <p className="mt-2 text-sm text-gray-600">After updating, you will need to log in again on every device.</p>
        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <div><label htmlFor="current-pass" className="font-semibold">Current password</label><input id="current-pass" type="password" autoComplete="current-password" required value={current} onChange={e=>setCurrent(e.target.value)} className={fieldStyle}/></div>
          <div><label htmlFor="new-pass" className="font-semibold">New password</label><input id="new-pass" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={fieldStyle}/><p className="mt-1 text-xs text-gray-500">12–128 characters.</p></div>
          <div><label htmlFor="repeat-pass" className="font-semibold">Confirm new password</label><input id="repeat-pass" type="password" autoComplete="new-password" required value={repeat} onChange={e=>setRepeat(e.target.value)} className={fieldStyle}/></div>
          {passwordError && <p role="alert" className="text-sm text-red-700">{passwordError}</p>}
          <button type="submit" disabled={passwordBusy} className="rounded-xl border border-green-700 px-5 py-3 font-semibold text-green-900 hover:bg-green-50 disabled:opacity-60">{passwordBusy ? 'Updating...' : 'Update Password'}</button>
        </form>
      </section>

      <section className="mt-5 rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="flex items-center gap-2 text-xl font-bold text-red-800"><Trash2 size={21}/> Delete Account</h2>
        <p className="mt-3 flex gap-2 text-sm text-red-800"><CircleAlert size={20} className="shrink-0"/>This permanently deletes your account, saved pets, health records, and AI assessment drafts. You will be logged out. This action cannot be undone.</p>
        <form onSubmit={deleteMyAccount} className="mt-5 space-y-4">
          <div><label htmlFor="delete-password" className="font-semibold">Current password</label><input id="delete-password" type="password" autoComplete="current-password" required value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} className={fieldStyle}/></div>
          <div><label htmlFor="delete-confirm" className="font-semibold">Type DELETE to confirm</label><input id="delete-confirm" type="text" autoComplete="off" required value={deleteText} onChange={e=>setDeleteText(e.target.value)} className={fieldStyle}/></div>
          {deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}
          <button type="submit" disabled={deleteBusy || deleteText !== 'DELETE' || !deletePassword} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"><Trash2 size={17}/>{deleteBusy ? 'Deleting...' : 'Permanently Delete Account'}</button>
        </form>
      </section>
    </main>
  );
}
