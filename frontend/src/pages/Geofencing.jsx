import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import MapTracker from '../components/MapTracker';
import { Plus, Trash2, MapPin, Compass, AlertTriangle, ShieldCheck } from 'lucide-react';

const Geofencing = () => {
  const { token, user } = useAuth();
  const { refreshAlerts } = useNotifications();

  const [geofences, setGeofences] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [lat, setLat] = useState('37.7794');
  const [lng, setLng] = useState('-122.4194');
  const [radius, setRadius] = useState('150');
  const [childId, setChildId] = useState('ALL');

  const fetchData = async () => {
    try {
      // Get Geofences
      const resFence = await fetch('/api/geofences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fenceData = await resFence.json();
      if (fenceData.success) setGeofences(fenceData.data);

      // Get Children list (to associate fence with child)
      const resChild = await fetch('/api/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const childData = await resChild.json();
      if (childData.success) {
        setChildren(childData.data);
        if (childData.data.length > 0 && childId === 'ALL') {
          // Keep ALL as default or default to first child
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    load();
  }, [token]);

  const handleCreateFence = async (e) => {
    e.preventDefault();
    if (!name || !lat || !lng || !radius) return;

    try {
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius: parseFloat(radius),
          childId
        })
      });
      const data = await res.json();
      if (data.success) {
        // Reset form
        setName('');
        setRadius('150');
        fetchData();
        refreshAlerts();
      } else {
        alert(data.message || 'Error creating fence');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFence = async (id) => {
    if (!window.confirm('Delete this geofence? Children entering/leaving this zone will no longer trigger alerts.')) return;
    try {
      const res = await fetch(`/api/geofences/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        refreshAlerts();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickLocate = (preset) => {
    if (preset === 'home') {
      setLat('37.7794');
      setLng('-122.4194');
    } else if (preset === 'school') {
      setLat('37.7858');
      setLng('-122.4008');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 font-sans">Safe Zones (Geofencing)</h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Establish boundaries (Home, School, Parks) and generate notifications on breaches</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Visual Map Overview - 2/3 cols */}
        <div className="lg:col-span-2 h-[450px] bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col">
          <h2 className="text-xs font-bold text-slate-700 mb-3 px-1">Geofence Boundaries Map</h2>
          <div className="flex-1 overflow-hidden relative rounded-xl border border-slate-200">
            <MapTracker childrenList={children} geofences={geofences} />
          </div>
        </div>

        {/* Configuration Column - 1/3 col */}
        <div className="space-y-6">
          
          {/* Create Form */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Establish Safe Zone</h2>
            
            <form onSubmit={handleCreateFence} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Grandparents Residence"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="37.7794"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="-122.4194"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Coordinates Quick Presets */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleQuickLocate('home')}
                  className="bg-slate-100 text-[10px] font-bold text-slate-600 px-2 py-1 rounded hover:bg-slate-200"
                >
                  📍 Use Home Center
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLocate('school')}
                  className="bg-slate-100 text-[10px] font-bold text-slate-600 px-2 py-1 rounded hover:bg-slate-200"
                >
                  📍 Use School Center
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Radius (Meters)</label>
                  <input
                    type="number"
                    required
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    placeholder="150"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Association</label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="ALL">All Children (School Wide)</option>
                    {children.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none transition-all active:scale-[0.99]"
              >
                Establish Safe Zone
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Geofence boundaries active listings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Active Boundaries</h2>

        <div className="overflow-x-auto text-xs">
          {loading ? (
            <div className="text-center py-6">Checking zone configuration...</div>
          ) : geofences.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No boundaries active. Register one above.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left font-bold text-slate-400">
                  <th className="pb-3 uppercase tracking-wide text-[10px]">Zone Name</th>
                  <th className="pb-3 uppercase tracking-wide text-[10px]">Coordinates</th>
                  <th className="pb-3 uppercase tracking-wide text-[10px]">Radius</th>
                  <th className="pb-3 uppercase tracking-wide text-[10px]">Assigned Child</th>
                  <th className="pb-3 uppercase tracking-wide text-[10px]">Security Status</th>
                  <th className="pb-3 uppercase tracking-wide text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {geofences.map((fence) => {
                  const targetChild = fence.childId === 'ALL' 
                    ? 'Global School Safe Zone' 
                    : children.find(c => c._id === fence.childId)?.name || 'Unknown Child';

                  return (
                    <tr key={fence._id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-800 flex items-center space-x-2">
                        <span className="text-base">🛡️</span>
                        <span>{fence.name}</span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-500">
                        {fence.center.lat.toFixed(4)}, {fence.center.lng.toFixed(4)}
                      </td>
                      <td className="py-3">{fence.radius} meters</td>
                      <td className="py-3 font-semibold text-slate-500">{targetChild}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Monitoring Active
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteFence(fence._id)}
                          className="text-danger-500 hover:text-danger-700 hover:scale-105 transition-transform"
                          title="Remove boundary"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Geofencing;
