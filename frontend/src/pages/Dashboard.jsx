import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import MapTracker from '../components/MapTracker';
import { 
  Users, 
  Navigation, 
  CheckCircle, 
  AlertOctagon, 
  Play, 
  Pause, 
  RefreshCw, 
  ChevronRight, 
  AlertTriangle,
  School,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { token, user } = useAuth();
  const { alerts, refreshAlerts } = useNotifications();

  const [stats, setStats] = useState({ totalChildren: 0, activeTracking: 0, safeCheckIns: 0, emergencyAlerts: 0 });
  const [statusDistribution, setStatusDistribution] = useState({ safe: 0, outside: 0, sos: 0, inactive: 0 });
  const [attendanceChartData, setAttendanceChartData] = useState([]);
  const [childrenList, setChildrenList] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [historyPath, setHistoryPath] = useState([]);
  const [simPlaying, setSimPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/reports/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setStatusDistribution(data.data.statusDistribution);
        setAttendanceChartData(data.data.attendanceChartData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChildrenAndGeofences = async () => {
    try {
      // Fetch Children
      const resChild = await fetch('/api/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const childData = await resChild.json();
      if (childData.success) {
        setChildrenList(childData.data);
        
        // Auto-select first child if none selected yet
        if (!selectedChild && childData.data.length > 0) {
          setSelectedChild(childData.data[0]);
        } else if (selectedChild) {
          // Sync changes
          const updatedSelected = childData.data.find(c => c._id === selectedChild._id);
          if (updatedSelected) setSelectedChild(updatedSelected);
        }
      }

      // Fetch Geofences
      const resFence = await fetch('/api/geofences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fenceData = await resFence.json();
      if (fenceData.success) {
        setGeofences(fenceData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSelectedChildHistory = async () => {
    if (!selectedChild) return;
    try {
      const res = await fetch(`/api/location/history/${selectedChild._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistoryPath(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Initial load
  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardStats(), fetchChildrenAndGeofences()]);
      setLoading(false);
    };
    initLoad();
  }, [token]);

  // Periodic polling for coordinates and stats (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChildrenAndGeofences();
      fetchDashboardStats();
    }, 3000);
    return () => clearInterval(interval);
  }, [token, selectedChild]);

  // Load history line when focused child changes
  useEffect(() => {
    fetchSelectedChildHistory();
  }, [selectedChild]);

  const handleSimTrigger = async (actionType) => {
    if (!selectedChild) return;
    try {
      let lat = selectedChild.currentLocation.lat;
      let lng = selectedChild.currentLocation.lng;
      
      if (actionType === 'school') {
        // Oakwood Primary
        lat = 37.7858;
        lng = -122.4008;
      } else if (actionType === 'home') {
        // Green Residence
        lat = 37.7794;
        lng = -122.4194;
      } else if (actionType === 'transit') {
        // Transit coordinate (outside safe circles)
        lat = 37.7812;
        lng = -122.4135;
      }

      const res = await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childId: selectedChild._id,
          lat,
          lng,
          speed: actionType === 'transit' ? 35 : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        // Sync states
        fetchChildrenAndGeofences();
        fetchDashboardStats();
        refreshAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/location/resolve-alert/${alertId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardStats();
        refreshAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 font-sans">Compiling telemetry logs...</p>
        </div>
      </div>
    );
  }

  // Stat Card Configs
  const cardData = [
    { title: 'Total Children Registered', value: stats.totalChildren, icon: Users, color: 'bg-brand-500/10 text-brand-600' },
    { title: 'Active GPS Feeds', value: stats.activeTracking, icon: Navigation, color: 'bg-emerald-500/10 text-emerald-600' },
    { title: 'Today Safe Check-ins', value: stats.safeCheckIns, icon: CheckCircle, color: 'bg-blue-500/10 text-blue-600' },
    { title: 'Active Emergency Alarms', value: stats.emergencyAlerts, icon: AlertOctagon, color: stats.emergencyAlerts > 0 ? 'bg-red-500/20 text-red-600 animate-pulse' : 'bg-slate-500/10 text-slate-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview stats cards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 font-sans tracking-wide uppercase">{card.title}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{card.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map & Controller Side-by-side Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leaflet Map display - takes 2/3 cols */}
        <div className="lg:col-span-2 h-[450px] bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col">
          <div className="flex items-center justify-between mb-3.5 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Live Tracking Console</h2>
              <p className="text-[10px] text-slate-400 font-medium">Click on markers to inspect profiles and safe bounds</p>
            </div>
            {selectedChild && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Tracking: <strong className="text-slate-800">{selectedChild.name}</strong>
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden relative rounded-xl border border-slate-200">
            <MapTracker 
              childrenList={childrenList} 
              geofences={geofences} 
              selectedChild={selectedChild}
              historyPath={historyPath}
            />
          </div>
        </div>

        {/* Sidebar Controls: Child List and GPS Simulation Console */}
        <div className="space-y-6">
          
          {/* Children List selection */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium flex flex-col max-h-[220px]">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">Children Monitored</h2>
            <div className="flex-1 overflow-y-auto space-y-2">
              {childrenList.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6">No children registered under this profile.</div>
              ) : (
                childrenList.map((child) => {
                  const isSelected = selectedChild && selectedChild._id === child._id;
                  
                  let dotColor = 'bg-green-500';
                  if (child.status === 'SOS') dotColor = 'bg-red-500 animate-ping';
                  else if (child.status === 'Outside Safe Zone') dotColor = 'bg-amber-500';

                  return (
                    <button
                      key={child._id}
                      onClick={() => setSelectedChild(child)}
                      className={`flex w-full items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected ? 'border-brand-500 bg-brand-50/30' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`relative flex h-2.5 w-2.5 rounded-full ${dotColor}`}>
                          {child.status === 'SOS' && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                          )}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{child.name}</p>
                          <p className="text-[10px] text-slate-400">{child.class} • {child.parentName}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* GPS Simulation Deck */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Simulate Tracker</h2>
            <p className="text-[10px] text-slate-400 mb-4 leading-normal">
              Force coordinate jumps for testing geofences and SOS alert thresholds. The system auto-updates every 15s.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleSimTrigger('home')}
                className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏡</span>
                  <span>Teleport to Home Zone</span>
                </div>
                <span className="text-[9px] bg-green-500/10 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Safe</span>
              </button>

              <button
                onClick={() => handleSimTrigger('transit')}
                className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🚌</span>
                  <span>Teleport into Transit (Street)</span>
                </div>
                <span className="text-[9px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Outside Zone</span>
              </button>

              <button
                onClick={() => handleSimTrigger('school')}
                className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏫</span>
                  <span>Teleport to School Zone</span>
                </div>
                <span className="text-[9px] bg-brand-500/10 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">Checked-In</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500">Auto-movement Ticker:</span>
              <span className="flex items-center text-[10px] font-extrabold text-green-600">
                <Play className="h-3 w-3 fill-green-600 mr-1 animate-pulse" />
                Active path ticking
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Analytics Chart & Recent Alert Feeds */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance graph - 2/3 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-premium flex flex-col h-[300px]">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Weekly School Entry (Check-Ins)</h2>
          <div className="flex-1 w-full text-xs">
            {attendanceChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">Loading charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="95%">
                <AreaChart data={attendanceChartData}>
                  <defs>
                    <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b66ff" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b66ff" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'sans-serif', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="checkIns" stroke="#3b66ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCheckIns)" name="Checked Children" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Timeline logs feed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium flex flex-col h-[300px]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Critical Incidents</h2>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {alerts.filter(a => a.status === 'Active' || a.severity === 'Critical').length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-10">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2 opacity-70" />
                <p className="text-xs font-semibold text-slate-500">System Secure</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No critical alert triggers pending.</p>
              </div>
            ) : (
              alerts.filter(a => a.status === 'Active' || a.severity === 'Critical').slice(0, 8).map(alert => (
                <div key={alert._id} className="flex space-x-3 text-xs leading-normal">
                  <div className="flex flex-col items-center">
                    <div className={`p-1.5 rounded-full shrink-0 ${
                      alert.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{alert.childName}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{alert.message}</p>
                    {['Admin', 'School Staff'].includes(user?.role) && alert.status === 'Active' && (
                      <button
                        onClick={() => handleResolveAlert(alert._id)}
                        className="mt-1 font-bold text-green-600 hover:text-green-700 block"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
