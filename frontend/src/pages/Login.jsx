import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, Shield } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all credentials');
    }

    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Invalid credentials. Double check details.');
    }
  };

  const handleQuickLogin = (selectedEmail) => {
    setEmail(selectedEmail);
    setPassword('safety123');
    setError('');
  };

  const demoAccounts = [
    { role: 'Parent Profile', email: 'parent@safety.com', color: 'border-green-100 bg-green-50/50 hover:bg-green-50 text-green-700' },
    { role: 'School Staff', email: 'staff@safety.com', color: 'border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700' },
    { role: 'System Admin', email: 'admin@safety.com', color: 'border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-purple-700' }
  ];

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center font-sans text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign in to SafeSteps
        </h2>
        <p className="mt-1.5 text-center text-xs font-semibold text-slate-500">
          Child Safety & Real-Time Tracking Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-8 py-8 shadow-premium rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-4 rounded-xl bg-danger-50 p-3.5 border border-danger-100 text-xs font-semibold text-danger-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Login Section */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="text-center">
              <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Prototype Quick Logins
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {demoAccounts.map(account => (
                <button
                  key={account.role}
                  onClick={() => handleQuickLogin(account.email)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed text-[10px] font-bold transition-all hover:scale-[1.03] ${account.color}`}
                >
                  <Shield className="h-3.5 w-3.5 mb-1 opacity-80" />
                  <span>{account.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-400">Need a parent account? </span>
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
