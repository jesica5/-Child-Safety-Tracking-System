import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { LogIn, LogOut, CheckCircle, Search, UserCheck, ArrowRightLeft, Radio } from 'lucide-react';

const Attendance = () => {
  const { token, user } = useAuth();
  const { refreshAlerts } = useNotifications();

  const [logs, setLogs] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [method, setMethod] = useState('Manual');

  const fetchData = async () => {
    try {
      // Fetch children
      const childRes = await fetch('/api/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const childData = await childRes.json();
      if (childData.success) setChildren(childData.data);

      // Fetch attendance logs
      const logRes = await fetch('/api/attendance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logData = await logRes.json();
      if (logData.success) setLogs(logData.data);
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

  const handleLogAttendance = async (childId, type) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childId,
          type,
          method
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        refreshAlerts();
        alert(`Successfully marked ${type} for the selected student.`);
      } else {
        alert(data.message || 'Error occurred logging attendance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Find most recent log type ('Check-In' or 'Check-Out') for a child on the current day
  const getChildStatusToday = (childId) => {
    const childLogs = logs.filter(l => l.childId === childId);
    if (childLogs.length === 0) return 'Not Checked';
    
    // Sort logs (latest first)
    const latest = childLogs[0];
    return latest.type; // 'Check-In' or 'Check-Out'
  };

  const filteredChildren = children.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 font-sans">School Entry & Exit console</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Record attendance logs, entry milestones, and bus transport departure stamps</p>
        </div>

        {/* Attendance method config (School Staff only) */}
        {['Admin', 'School Staff'].includes(user?.role) && (
          <div className="flex items-center space-x-2 bg-white rounded-xl border border-slate-100 p-1.5 shadow-premium">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2">Method:</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
            >
              <option value="Manual">📝 Manual Entry</option>
              <option value="RFID">🏷️ RFID Card Scan</option>
              <option value="NFC">📱 NFC Phone Tap</option>
              <option value="QR Code">📷 QR Code Scan</option>
            </select>
          </div>
        )}
      </div>

      {/* Main split viewport */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Child Attendance Toggler Console - 2/3 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-premium flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Classroom Roster Control</h2>
            
            <div className="relative w-48 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="text-center py-10 text-xs">Loading children records...</div>
            ) : filteredChildren.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No children found matching the query.</div>
            ) : (
              filteredChildren.map(student => {
                const todayStatus = getChildStatusToday(student._id);

                return (
                  <div key={student._id} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center space-x-3.5 overflow-hidden">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
                        {student.name.slice(0,2)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-xs font-bold text-slate-800 truncate">{student.name}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">{student.class} • Parent: {student.parentName}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {/* Current Status Badge */}
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                        todayStatus === 'Check-In' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : todayStatus === 'Check-Out'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {todayStatus === 'Check-In' ? 'Present' : todayStatus === 'Check-Out' ? 'Departed' : 'Absent'}
                      </span>

                      {/* Logging triggers (Disabled for Parent role) */}
                      {['Admin', 'School Staff'].includes(user?.role) ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleLogAttendance(student._id, 'Check-In')}
                            disabled={todayStatus === 'Check-In'}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              todayStatus === 'Check-In'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md shadow-green-600/10'
                            }`}
                          >
                            <LogIn className="h-3 w-3" />
                            <span>Check-In</span>
                          </button>
                          
                          <button
                            onClick={() => handleLogAttendance(student._id, 'Check-Out')}
                            disabled={todayStatus === 'Check-Out' || todayStatus === 'Not Checked'}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              todayStatus === 'Check-Out' || todayStatus === 'Not Checked'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-md shadow-amber-600/10'
                            }`}
                          >
                            <LogOut className="h-3 w-3" />
                            <span>Check-Out</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Logs View Only</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity logs Feed timeline - 1/3 col */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium flex flex-col h-[400px]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Recent Attendance Logs</h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {logs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-10">
                <ArrowRightLeft className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No Check logs</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Logs appear when children are checked in.</p>
              </div>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div key={log._id} className="flex space-x-3 text-xs leading-normal">
                  <div className="flex flex-col items-center">
                    <div className={`p-1.5 rounded-full shrink-0 ${
                      log.type === 'Check-In' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {log.type === 'Check-In' ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
                    </div>
                    <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.childName}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Marked <strong className="text-slate-700">{log.type}</strong> at school.
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 flex items-center">
                      <Radio className="h-2.5 w-2.5 mr-1" />
                      Logged by {log.loggedByName || 'Staff'} via {log.method}
                    </p>
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

export default Attendance;
