import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  LayoutDashboard, 
  Baby, 
  Map, 
  ShieldAlert, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  FileSpreadsheet, 
  CalendarCheck, 
  ChevronDown,
  User,
  AlertTriangle,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, login } = useAuth();
  const { alerts, unreadCount, markAllRead, refreshAlerts } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [sosTriggering, setSosTriggering] = useState(false);
  
  // Theme state
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Parent', 'School Staff'] },
    { name: 'Child Directory', path: '/children', icon: Baby, roles: ['Admin', 'Parent', 'School Staff'] },
    { name: 'Safe Zones (Geofencing)', path: '/geofences', icon: Map, roles: ['Admin', 'Parent'] },
    { name: 'School Entry/Exit Logs', path: '/attendance', icon: CalendarCheck, roles: ['Admin', 'Parent', 'School Staff'] },
    { name: 'Security Alerts', path: '/alerts', icon: ShieldAlert, roles: ['Admin', 'Parent', 'School Staff'] },
    { name: 'Reports & Analytics', path: '/reports', icon: FileSpreadsheet, roles: ['Admin', 'Parent', 'School Staff'] },
    { name: 'Profile & Settings', path: '/settings', icon: Settings, roles: ['Admin', 'Parent', 'School Staff'] }
  ];

  // Set initial class on html element
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleRoleQuickSwitch = async (roleEmail) => {
    setRoleDropdownOpen(false);
    const result = await login(roleEmail, 'safety123');
    if (result.success) {
      navigate('/dashboard');
      window.location.reload(); // refresh contexts
    }
  };

  const handleGlobalSos = async () => {
    if (sosTriggering) return;
    setSosTriggering(true);
    try {
      // Find a child to trigger SOS for demo
      const res = await fetch('/api/children', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const testChild = data.data[0];
        const sosRes = await fetch(`/api/location/sos/${testChild._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            lat: testChild.currentLocation.lat + 0.001, // shift slightly
            lng: testChild.currentLocation.lng + 0.001
          })
        });
        const sosData = await sosRes.json();
        if (sosData.success) {
          alert(`🚨 Emergency SOS Simulation triggered for ${testChild.name}!`);
          refreshAlerts();
        }
      } else {
        alert('No registered children found to trigger SOS.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSosTriggering(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'Active');

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/location/resolve-alert/${alertId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        refreshAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#0F172A] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}>
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121826] transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'}`}>
        {/* Brand Logo */}
        <div className="flex h-16 items-center border-b border-slate-100 dark:border-slate-800/60 px-6">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-slate-900 dark:text-white">SafeSteps</span>
          </Link>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {menuItems
            .filter(item => item.roles.includes(user?.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-brand-50 text-brand-600 shadow-premium dark:bg-brand-500/10 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-white'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-[#0B0F19]/40 p-3.5 border border-transparent dark:border-slate-800/30">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none mb-0.5">{user?.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="text-slate-400 hover:text-danger-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121826] px-6 shadow-sm">
          {/* Mobile Sidebar Toggle */}
          <button 
            className="text-slate-600 dark:text-slate-350 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Page Name */}
          <h1 className="hidden md:block font-sans text-base font-bold text-slate-800 dark:text-white">
            {menuItems.find(item => item.path === location.pathname)?.name || 'System'}
          </h1>

          {/* Right Header Navigation Panel */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-brand-400" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* SOS Simulated Trigger button */}
            {user?.role !== 'School Staff' && (
              <button
                onClick={handleGlobalSos}
                disabled={sosTriggering}
                className="flex items-center space-x-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-danger-700 active:scale-95 transition-all shadow-md shadow-danger-600/20 animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Simulate SOS</span>
              </button>
            )}

            {/* Quick Role Switcher Dropdown (Demo Purpose) */}
            <div className="relative">
              <button 
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]/40 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <span>Demo Profile: <strong className="text-slate-900 dark:text-slate-200">{user?.role}</strong></span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 z-30 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121826] p-1.5 shadow-lg">
                  <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Switch demo credentials
                  </div>
                  <button 
                    onClick={() => handleRoleQuickSwitch('parent@safety.com')}
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    Parent Perspective
                  </button>
                  <button 
                    onClick={() => handleRoleQuickSwitch('staff@safety.com')}
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    School Staff Perspective
                  </button>
                  <button 
                    onClick={() => handleRoleQuickSwitch('admin@safety.com')}
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    Admin Perspective
                  </button>
                </div>
              )}
            </div>

            {/* Alerts Notification dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setAlertsDropdownOpen(!alertsDropdownOpen);
                  if (!alertsDropdownOpen) markAllRead();
                }}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[8px] font-black text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {alertsDropdownOpen && (
                <div className="absolute right-0 mt-2 z-30 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121826] p-1.5 shadow-lg">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Recent Security Alerts</span>
                    <button 
                      onClick={() => markAllRead()}
                      className="text-[10px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Clear flags
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {activeAlerts.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-slate-400">
                        No active security flags reported.
                      </div>
                    ) : (
                      activeAlerts.map(alert => (
                        <div key={alert._id} className="flex flex-col border-b border-slate-50 dark:border-slate-800/20 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <div className="flex items-start justify-between">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                              alert.severity === 'Critical' ? 'bg-red-500' : alert.severity === 'High' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}>
                              {alert.type}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-350 mt-1">{alert.message}</p>
                          {['Admin', 'School Staff'].includes(user?.role) && alert.status === 'Active' && (
                            <button
                              onClick={() => handleResolveAlert(alert._id)}
                              className="mt-1.5 text-left text-[10px] font-bold text-green-600 hover:text-green-700 font-sans"
                            >
                              ✓ Mark Resolved
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800/60 p-1.5 text-center">
                    <Link 
                      to="/alerts" 
                      onClick={() => setAlertsDropdownOpen(false)}
                      className="block w-full rounded-lg bg-slate-50 dark:bg-[#0B0F19]/40 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      View alert history log
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

