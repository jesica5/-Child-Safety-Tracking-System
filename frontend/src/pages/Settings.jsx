import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User, Bell, Shield, Mail, Smartphone, Volume2, Save, Key } from 'lucide-react';

const Settings = () => {
  const { user, token } = useAuth();
  const { playBeep } = useNotifications();

  // Profile forms state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Notification configs
  const [audioBeeps, setAudioBeeps] = useState(localStorage.getItem('alert_audio_beeps') !== 'false');
  const [emailAlerts, setEmailAlerts] = useState(localStorage.getItem('alert_email_sim') === 'true');
  const [smsAlerts, setSmsAlerts] = useState(localStorage.getItem('alert_sms_sim') === 'true');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Sync settings modifications
  const handleSaveAlertSettings = (e) => {
    e.preventDefault();
    setSavingAlerts(true);
    
    // Write configs to localStorage
    localStorage.setItem('alert_audio_beeps', audioBeeps.toString());
    localStorage.setItem('alert_email_sim', emailAlerts.toString());
    localStorage.setItem('alert_sms_sim', smsAlerts.toString());

    setTimeout(() => {
      setSavingAlerts(false);
      triggerToast('success', 'Security alert routes saved successfully');
      if (audioBeeps) playBeep(520, 'sine', 0.2); // trigger a check beep
    }, 800);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    setSavingProfile(true);
    try {
      // Simulate profile updates in JSON model
      const res = await fetch(`/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Since we are mocking updating the active user details locally in this prototype:
        triggerToast('success', 'User profile information updated');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      return triggerToast('error', 'All password fields are required.');
    }
    if (newPassword !== confirmPassword) {
      return triggerToast('error', 'Passwords do not match.');
    }

    setUpdatingPass(true);
    setTimeout(() => {
      setUpdatingPass(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('success', 'Password updated successfully');
    }, 1000);
  };

  const triggerToast = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 dark:text-white font-sans">User Settings & Preferences</h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage details, active alerts routes, and authentication credentials</p>
      </div>

      {/* Floating Status Toast alert notification */}
      {msg.text && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-xl text-xs font-bold transition-all ${
          msg.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800' 
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#121826] border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-premium flex flex-col">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
            <User className="h-4 w-4 mr-1.5" />
            Account Details
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs flex-1">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-[#0B0F19] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-[#0B0F19] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Phone Number (SMS alerts destination)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-[#0B0F19] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center space-x-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingProfile ? 'Updating Profile...' : 'Save Profile Details'}</span>
            </button>
          </form>
        </div>

        {/* Security Alert Config Card */}
        <div className="bg-white dark:bg-[#121826] border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-premium">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
            <Bell className="h-4 w-4 mr-1.5" />
            Security Alert Configurations
          </h2>

          <form onSubmit={handleSaveAlertSettings} className="space-y-5 text-xs">
            {/* Audio Alert check */}
            <div className="flex items-start space-x-3.5">
              <input
                id="audioBeeps"
                type="checkbox"
                checked={audioBeeps}
                onChange={(e) => setAudioBeeps(e.target.checked)}
                className="mt-0.5 h-4.5 w-4.5 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
              />
              <div>
                <label htmlFor="audioBeeps" className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                  <Volume2 className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Synthesizer Audio Warnings
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  Synthesize beep frequency warning sequences through the browser on geofence crossings or SOS triggers.
                </p>
              </div>
            </div>

            {/* Email alert check */}
            <div className="flex items-start space-x-3.5">
              <input
                id="emailAlerts"
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="mt-0.5 h-4.5 w-4.5 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
              />
              <div>
                <label htmlFor="emailAlerts" className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Simulate Email Incident Dispatch
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  Log email trigger warnings into the Express API terminal when child safe zones are breached.
                </p>
              </div>
            </div>

            {/* SMS alert check */}
            <div className="flex items-start space-x-3.5">
              <input
                id="smsAlerts"
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="mt-0.5 h-4.5 w-4.5 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
              />
              <div>
                <label htmlFor="smsAlerts" className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                  <Smartphone className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Simulate SMS Alerts
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  Log simulated text message notifications mapping to your registered number during SOS states.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingAlerts}
              className="flex items-center space-x-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingAlerts ? 'Updating Routes...' : 'Save Security Options'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-[#121826] border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-premium">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
            <Key className="h-4 w-4 mr-1.5" />
            Update Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Old Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-[#0B0F19] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-[#0B0F19] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-[#0B0F19] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPass}
              className="flex items-center space-x-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Key className="h-3.5 w-3.5 animate-pulse" />
              <span>{updatingPass ? 'Rewriting Password...' : 'Save New Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
