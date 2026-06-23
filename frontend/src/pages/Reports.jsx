import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileDown, Printer, Search, Calendar, Filter, Database, FileSpreadsheet } from 'lucide-react';

const Reports = () => {
  const { token } = useAuth();
  
  // Query Filters State
  const [category, setCategory] = useState('attendance'); // 'children', 'attendance', 'alerts'
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState(''); // active/resolved (for alerts) or Check-In/Out (for attendance)
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams({
        category,
        search,
        classFilter,
        startDate,
        endDate,
        status
      });

      const res = await fetch(`/api/reports/query?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on mount to show default reports list
  useEffect(() => {
    handleGenerateReport();
  }, [category]);

  // Client-Side CSV file downloader
  const handleExportCSV = () => {
    if (results.length === 0) return alert('No report results to export.');
    
    // Define headers based on category
    let headers = [];
    if (category === 'children') {
      headers = ['ID', 'Name', 'Age', 'Class', 'Parent Name', 'Status', 'Registered Date'];
    } else if (category === 'attendance') {
      headers = ['ID', 'Student Name', 'Class', 'Type', 'Timestamp', 'Method', 'Logged By'];
    } else if (category === 'alerts') {
      headers = ['ID', 'Student Name', 'Alert Type', 'Message', 'Severity', 'Status', 'Created At'];
    }

    const rows = results.map(item => {
      if (category === 'children') {
        return [item.id, item.name, item.age, item.class, item.parentName, item.status, item.createdAt];
      } else if (category === 'attendance') {
        return [item.id, item.childName, item.class, item.type, item.timestamp, item.method, item.loggedByName];
      } else if (category === 'alerts') {
        return [item.id, item.childName, item.type, item.message.replace(/,/g, ';'), item.severity, item.status, item.createdAt];
      }
      return [];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GuardianShield_${category}_report_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print(); // Triggers native browser print dialog, which prints the tabular contents perfectly.
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 font-sans">Reports & Analytics Engine</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5 font-sans">Query historical logs, export CSV audit logs, or format printable PDFs</p>
        </div>
        
        <div className="flex space-x-2 w-fit">
          <button
            onClick={handleExportCSV}
            disabled={results.length === 0}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-premium disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel (CSV)</span>
          </button>
          
          <button
            onClick={handlePrintReport}
            disabled={results.length === 0}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-premium disabled:opacity-40"
          >
            <Printer className="h-4 w-4 text-brand-600" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Query filters sheet (Hidden when printing) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-premium print:hidden">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
          <Filter className="h-3.5 w-3.5 mr-1" />
          Filter Parameters
        </h2>

        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 text-xs font-sans">
          
          {/* Category selection */}
          <div>
            <label className="block font-bold text-slate-500 mb-1">Report Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setStatus(''); // reset status filter
              }}
              className="block w-full py-2 px-3 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-brand-500 outline-none"
            >
              <option value="attendance">🏫 School Attendance Logs</option>
              <option value="alerts">🚨 Security Alert Logs</option>
              <option value="children">👶 Registered Children Directory</option>
            </select>
          </div>

          {/* Search query */}
          <div>
            <label className="block font-bold text-slate-500 mb-1">Search Keywords</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Child or parent name..."
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Class selection */}
          <div>
            <label className="block font-bold text-slate-500 mb-1">Grade Room</label>
            <input
              type="text"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="E.g. Grade 4A"
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block font-bold text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block font-bold text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Status mapping */}
          <div>
            <label className="block font-bold text-slate-500 mb-1">Status Type</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full py-2 px-3 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-brand-500 outline-none"
            >
              <option value="">All Statuses</option>
              {category === 'attendance' && (
                <>
                  <option value="Check-In">Present (Checked-In)</option>
                  <option value="Check-Out">Departed (Checked-Out)</option>
                </>
              )}
              {category === 'alerts' && (
                <>
                  <option value="Active">Active Incident</option>
                  <option value="Resolved">Resolved Incident</option>
                </>
              )}
              {category === 'children' && (
                <>
                  <option value="Safe">Safe</option>
                  <option value="Outside Safe Zone">Outside Safe Zone</option>
                  <option value="SOS">SOS Active</option>
                </>
              )}
            </select>
          </div>

          {/* Search trigger button */}
          <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/10 active:scale-95 transition-all w-fit"
            >
              <Database className="h-4 w-4" />
              <span>Query Database Records</span>
            </button>
          </div>

        </form>
      </div>

      {/* Reports output tables */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-premium overflow-hidden">
        
        {/* Printable Header Profile (Hidden unless printing) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black font-sans uppercase">GuardianShield System Report</h1>
          <p className="text-xs text-slate-500 font-medium">Export Category: {category} | Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3.5 print:hidden">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Report Results ({results.length})</h2>
          <span className="text-[10px] text-slate-400 font-semibold font-mono">JSON DB snapshot mode</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs">Assembling data matrices...</div>
        ) : !hasSearched && results.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">Configure parameters above and click query.</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No records matched the filter query.</div>
        ) : (
          <div className="overflow-x-auto text-xs font-sans">
            
            {/* 1. CHILDREN CATEGORY TABLE */}
            {category === 'children' && (
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left font-bold text-slate-400 text-[10px] uppercase">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Age</th>
                    <th className="pb-3">Classroom</th>
                    <th className="pb-3">Primary Parent</th>
                    <th className="pb-3">Current Status</th>
                    <th className="pb-3">Enrollment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {results.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">{item.name}</td>
                      <td className="py-2.5">{item.age} years</td>
                      <td className="py-2.5 font-semibold text-slate-500">{item.class}</td>
                      <td className="py-2.5">{item.parentName}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${
                          item.status === 'Safe' ? 'bg-green-500' : item.status === 'SOS' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. ATTENDANCE CATEGORY TABLE */}
            {category === 'attendance' && (
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left font-bold text-slate-400 text-[10px] uppercase">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Classroom</th>
                    <th className="pb-3">Checkpoint Type</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Scan Method</th>
                    <th className="pb-3">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {results.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">{item.childName}</td>
                      <td className="py-2.5 font-semibold text-slate-500">{item.class}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.type === 'Check-In' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-400">{item.method}</td>
                      <td className="py-2.5">{item.loggedByName || 'RFID System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. ALERTS CATEGORY TABLE */}
            {category === 'alerts' && (
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left font-bold text-slate-400 text-[10px] uppercase">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Alert Type</th>
                    <th className="pb-3">Description Message</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Resolution</th>
                    <th className="pb-3">Incident Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {results.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">{item.childName}</td>
                      <td className="py-2.5 font-semibold text-slate-500">{item.type}</td>
                      <td className="py-2.5 text-slate-500 max-w-xs truncate" title={item.message}>
                        {item.message}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                          item.severity === 'Critical' ? 'bg-red-500' : item.severity === 'High' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.status === 'Active' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
