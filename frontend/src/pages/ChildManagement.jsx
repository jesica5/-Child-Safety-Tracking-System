import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Plus, Edit2, Trash2, Search, X, Heart, ShieldAlert, Phone } from 'lucide-react';

const ChildManagement = () => {
  const { token, user } = useAuth();
  const { refreshAlerts } = useNotifications();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // Modal configurations
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [classField, setClassField] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [parentId, setParentId] = useState(''); // for admin registrations
  const [parentsList, setParentsList] = useState([]); // populated for admin roles
  const [emergencyContacts, setEmergencyContacts] = useState([{ name: '', phone: '', relationship: '' }]);

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChildren(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParents = async () => {
    // If user is Admin, fetch parents so we can assign children to them
    if (user?.role !== 'Admin') return;
    try {
      // In our seed setup, we can fetch from reports/query or mock parents
      // For simplicity, we search for users with role === 'Parent'
      // We can query user register API or generic endpoint. Let's make a mock parent picker or type parent ID
      // To make it easy, we can search parents by listing them
      // Let's seed a simple selection block. For our demo, the seeded Sarah Green parent has parentId 'parent_id_holder'
      // Let's do a request to check if we can query report user listings or just input parent details.
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchChildren();
      setLoading(false);
    };
    loadData();
  }, [token]);

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setName('');
    setAge('');
    setClassField('');
    setMedicalInfo('');
    setParentId('');
    setEmergencyContacts([{ name: '', phone: '', relationship: 'Mother' }]);
    setSelectedChildId(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (child) => {
    setEditMode(true);
    setSelectedChildId(child._id);
    setName(child.name);
    setAge(child.age);
    setClassField(child.class);
    setMedicalInfo(child.medicalInfo || 'None');
    setParentId(child.parentId);
    setEmergencyContacts(child.emergencyContacts && child.emergencyContacts.length > 0 
      ? child.emergencyContacts 
      : [{ name: '', phone: '', relationship: 'Mother' }]
    );
    setModalOpen(true);
  };

  const handleAddContactField = () => {
    setEmergencyContacts([...emergencyContacts, { name: '', phone: '', relationship: 'Mother' }]);
  };

  const handleRemoveContactField = (index) => {
    const list = [...emergencyContacts];
    list.splice(index, 1);
    setEmergencyContacts(list);
  };

  const handleContactChange = (index, field, value) => {
    const list = [...emergencyContacts];
    list[index][field] = value;
    setEmergencyContacts(list);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !age || !classField) return;

    // Filter out blank contact fields
    const validContacts = emergencyContacts.filter(c => c.name && c.phone);

    const body = {
      name,
      age: parseInt(age, 10),
      class: classField,
      medicalInfo,
      emergencyContacts: validContacts,
      parentId: user.role === 'Admin' ? parentId || user._id : user._id
    };

    try {
      const url = editMode ? `/api/children/${selectedChildId}` : '/api/children';
      const method = editMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchChildren();
      } else {
        alert(data.message || 'Error occurred');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChild = async (id) => {
    if (!window.confirm('Are you sure you want to delete this child profile? All tracking data will be deleted.')) return;
    try {
      const res = await fetch(`/api/children/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchChildren();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter children based on search query and grade selection
  const filteredChildren = children.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.parentName.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter ? c.class === classFilter : true;
    return matchesSearch && matchesClass;
  });

  // Extract unique classes/grades for filtering options
  const classesList = [...new Set(children.map(c => c.class))];

  return (
    <div className="space-y-6">
      {/* Header and Create controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 font-sans">Child Management Directory</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage details, medical notes, and family access bounds</p>
        </div>
        {user?.role !== 'School Staff' && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4.5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 active:scale-95 transition-all w-fit"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Child Profile</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
        {/* Search */}
        <div className="flex-1 relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search children by name or parent name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs"
          />
        </div>
        
        {/* Class Filter */}
        <div className="w-full md:w-48">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="block w-full py-2 px-3.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs font-medium text-slate-500"
          >
            <option value="">All Classes/Grades</option>
            {classesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Child Profile Cards Grid */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="bg-white border border-slate-100 shadow-premium rounded-2xl p-16 text-center text-slate-400">
          No registered children matched the filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChildren.map((child) => (
            <div key={child._id} className="bg-white rounded-2xl border border-slate-100 shadow-premium flex flex-col hover:shadow-premium-hover transition-all duration-300">
              
              {/* Header profile badge */}
              <div className="p-5 border-b border-slate-50 flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center font-bold text-lg text-brand-600 uppercase">
                  {child.name.slice(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{child.name}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {child.class}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Age: {child.age}</span>
                  </div>
                </div>
              </div>

              {/* Profile Details Body */}
              <div className="p-5 flex-1 space-y-4 text-xs">
                
                {/* Parent Details */}
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Parent Information</h4>
                  <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">{child.parentName}</span>
                    <span className="text-[10px] text-slate-400 font-medium font-sans">ID: {child.parentId.slice(0, 8)}...</span>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1 flex items-center">
                    <Heart className="h-3 w-3 text-danger-500 fill-danger-500 mr-1 shrink-0" />
                    Medical Information
                  </h4>
                  <p className="text-slate-600 bg-red-50/30 p-2.5 rounded-xl border border-red-100/50 leading-relaxed italic">
                    {child.medicalInfo || 'No medical alerts reported.'}
                  </p>
                </div>

                {/* Emergency Contacts */}
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1.5 flex items-center">
                    <Phone className="h-3 w-3 text-slate-400 mr-1 shrink-0" />
                    Emergency Contacts ({child.emergencyContacts?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {child.emergencyContacts && child.emergencyContacts.length > 0 ? (
                      child.emergencyContacts.map((contact, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] text-slate-600 py-0.5">
                          <span className="font-semibold">{contact.name} <strong className="text-slate-400 font-normal">({contact.relationship})</strong></span>
                          <span className="font-mono text-slate-500">{contact.phone}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No emergency contacts listed</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Profile Card Footer Action Buttons */}
              {user?.role !== 'School Staff' && (
                <div className="px-5 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex justify-end space-x-2.5">
                  <button
                    onClick={() => handleOpenEditModal(child)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-600"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit Profile</span>
                  </button>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => handleDeleteChild(child._id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-danger-200 bg-danger-50 hover:bg-danger-100 text-[10px] font-bold text-danger-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-800 font-sans">
                {editMode ? `Edit Profile: ${name}` : 'Register New Child Profile'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Primary Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wide mb-1">
                    Child Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bobby Green"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wide mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="9"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Class/Grade */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wide mb-1">
                  Class / Grade Room
                </label>
                <input
                  type="text"
                  required
                  value={classField}
                  onChange={(e) => setClassField(e.target.value)}
                  placeholder="Grade 4A"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Parent Assign Selection (Admin Only) */}
              {user?.role === 'Admin' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wide mb-1">
                    Assign Parent (User ID)
                  </label>
                  <input
                    type="text"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    placeholder="Enter Parent User ID (Leave blank to assign to self)"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Medical notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wide mb-1 flex items-center">
                  <Heart className="h-3 w-3 text-red-500 mr-1" />
                  Medical Information & Allergies
                </label>
                <textarea
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                  placeholder="E.g. Peanut allergy, Asthma inhaler details..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none h-20 resize-none"
                />
              </div>

              {/* Emergency Contacts Multi-Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                    Emergency Contacts List
                  </label>
                  <button
                    type="button"
                    onClick={handleAddContactField}
                    className="text-[9px] font-bold text-brand-600 hover:text-brand-700"
                  >
                    + Add Contact
                  </button>
                </div>

                <div className="space-y-2.5">
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 relative">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          placeholder="Contact Name"
                          className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-[10px] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                          placeholder="Phone Number"
                          className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-[10px] focus:outline-none font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={contact.relationship}
                          onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                          className="block w-full py-1.5 px-2 border border-slate-200 bg-white rounded-lg text-[10px] focus:outline-none font-medium"
                        >
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Relative">Relative</option>
                          <option value="Doctor">Doctor</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        {emergencyContacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContactField(index)}
                            className="text-danger-500 hover:text-danger-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-slate-100 pt-4.5 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  {editMode ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChildManagement;
