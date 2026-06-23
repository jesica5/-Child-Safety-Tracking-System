import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { AlertTriangle, ShieldCheck, RefreshCw, Filter, BellRing } from 'lucide-react';

const Alerts = () => {
  const { token, user } = useAuth();
  const { alerts, refreshAlerts } = useNotifications();
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const triggerRefresh = async () => {
    setLoading(true);
    await refreshAlerts();
    setLoading(false);
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/location/resolve-alert/${alertId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        refreshAlerts();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterType === 'ALL') return true;
    if (filterType === 'SOS') return alert.type === 'SOS';
    if (filterType === 'GEOFENCE') return alert.type === 'Geofence Entry' || alert.type === 'Geofence Exit';
    if (filterType === 'CHECK') return alert.type === 'Check-In' || alert.type === 'Check-Out';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 font-sans">Security Alerts & Incidents Log</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time log of SOS triggers, safe zone departures, and school check milestones</p>
        </div>

        <button
          onClick={triggerRefresh}
          disabled={loading}
          className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shrink-0 w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1.5">
        <Filter className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
        {[
          { key: 'ALL', label: 'All Incidents' },
          { key: 'SOS', label: '🔴 SOS Emergency' },
          { key: 'GEOFENCE', label: '🚧 Geofence Crossings' },
          { key: 'CHECK', label: '🏫 School Checks' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === tab.key 
                ? 'bg-slate-900 text-white shadow-premium' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No incidents reported matching this category filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map((alert) => {
              const date = new Date(alert.createdAt);
              const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              let alertBg = 'bg-slate-50 border-slate-200 text-slate-600';
              if (alert.severity === 'Critical') {
                alertBg = 'bg-red-50/50 border-red-100 text-red-700';
              } else if (alert.severity === 'High') {
                alertBg = 'bg-amber-50/50 border-amber-100 text-amber-700';
              } else if (alert.type.includes('Check-In')) {
                alertBg = 'bg-green-50/50 border-green-100 text-green-700';
              }

              return (
                <div key={alert._id} className="p-5 hover:bg-slate-50/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 text-xs">
                  
                  {/* Left Block: Icon & Message details */}
                  <div className="flex items-start space-x-4 md:max-w-2xl">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${alertBg}`}>
                      {alert.type === 'SOS' ? (
                        <BellRing className="h-5 w-5 animate-bounce" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2.5 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{alert.childName}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          alert.severity === 'Critical' 
                            ? 'bg-red-500 text-white' 
                            : alert.severity === 'High' 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {alert.type}
                        </span>
                        
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          alert.status === 'Active' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 font-medium mt-1 leading-relaxed">{alert.message}</p>
                      
                      {alert.location && alert.location.lat && (
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          📍 Coordinates at trigger: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Block: Timestamps & Resolve buttons */}
                  <div className="flex flex-col md:items-end justify-between space-y-2 shrink-0 md:pl-6">
                    <div className="text-slate-400 text-right">
                      <p className="font-bold text-slate-600">{formattedDate}</p>
                      <p className="text-[10px] font-medium font-sans mt-0.5">{formattedTime}</p>
                    </div>

                    {['Admin', 'School Staff'].includes(user?.role) && alert.status === 'Active' ? (
                      <button
                        onClick={() => handleResolveAlert(alert._id)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-[10px] font-bold text-green-700 transition-all w-fit self-start md:self-end"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Resolve Alarm</span>
                      </button>
                    ) : alert.status === 'Resolved' && alert.resolvedBy && (
                      <span className="text-[9px] text-slate-400 italic">
                        Resolved by staff (ID: {alert.resolvedBy.slice(0, 6)})
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
