import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Users, 
  Stethoscope, 
  HeartPulse, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Key, 
  CheckCircle, 
  XCircle, 
  Download, 
  Database, 
  Lock, 
  Unlock,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  X,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useIV } from '../context/IVContext';
import { sqliteService } from '../services/sqliteService';

export default function AdminPanelView() {
  const { currentUser, addToast } = useIV();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'Doctor',
    department: 'General Medical',
    email: '',
    phone: '',
    badge: ''
  });

  const [resetPassValue, setResetPassValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Helper to extract clean initials without prefixes
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.replace(/^(Dr\.|Nurse|Director|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Load staff profiles from SQLite database
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await sqliteService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading SQLite users:', err);
      addToast('SQLite Error', 'Failed to load user directory from database.', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Access check: Only Administrators can view this panel
  if (currentUser.role !== 'Administrator') {
    return (
      <div className="access-denied-container">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            <Lock size={36} className="text-danger" />
          </div>
          <h2 className="access-title">Administrator Privilege Required</h2>
          <p className="access-desc">
            You are currently logged in as <strong>{currentUser.name}</strong> ({currentUser.role}).
            Only hospital administrators have authorization to manage staff profiles, credentials, and access policies.
          </p>
          <div className="access-role-hint">
            <span>Your Access Level:</span>
            <span className="role-badge doctor">{currentUser.role} (Restricted)</span>
          </div>
        </div>
        <style>{`
          .access-denied-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 480px;
            padding: 24px;
          }
          .access-denied-card {
            max-width: 500px;
            text-align: center;
            background: var(--bg-surface);
            border: 1px solid var(--border-medium);
            border-radius: var(--radius-lg);
            padding: 40px 32px;
            box-shadow: var(--shadow-md);
          }
          .access-denied-icon {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          .access-title {
            font-size: 1.35rem;
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: 10px;
          }
          .access-desc {
            font-size: 0.875rem;
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .access-role-hint {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 0.8125rem;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  // Filtered staff list
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const doctorsCount = users.filter(u => u.role === 'Doctor').length;
  const nursesCount = users.filter(u => u.role === 'Nurse').length;
  const adminsCount = users.filter(u => u.role === 'Administrator').length;

  // Add new staff profile
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await sqliteService.createUser(formData, currentUser.name);
      addToast('Staff Profile Created', `${formData.role} profile for ${formData.name} was added to SQLite database.`, 'success');
      setIsAddModalOpen(false);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'Doctor',
        department: 'General Medical',
        email: '',
        phone: '',
        badge: ''
      });
      await loadUsers();
    } catch (err) {
      addToast('Creation Error', err.message, 'critical');
    }
  };

  // Update existing staff profile
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      await sqliteService.updateUser(editingUser.id, editingUser, currentUser.name);
      addToast('Profile Updated', `Updated credentials and role for ${editingUser.name}.`, 'success');
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      addToast('Update Error', err.message, 'critical');
    }
  };

  // Reset staff password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetPassValue) return;
    try {
      await sqliteService.updateUser(passwordResetUser.id, { password: resetPassValue }, currentUser.name);
      addToast('Password Reset', `Password updated for ${passwordResetUser.username}.`, 'success');
      setPasswordResetUser(null);
      setResetPassValue('');
      await loadUsers();
    } catch (err) {
      addToast('Error', err.message, 'critical');
    }
  };

  // Toggle staff account active/suspended
  const handleToggleStatus = async (user) => {
    if (user.id === currentUser.id) {
      addToast('Action Prohibited', 'You cannot suspend your own active administrator account.', 'warning');
      return;
    }
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await sqliteService.updateUser(user.id, { status: newStatus }, currentUser.name);
      addToast('Status Changed', `${user.name} is now ${newStatus}.`, 'info');
      await loadUsers();
    } catch (err) {
      addToast('Error', err.message, 'critical');
    }
  };

  // Delete staff profile
  const handleDeleteStaff = async () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser.id) {
      addToast('Action Prohibited', 'You cannot delete your own active administrator account.', 'critical');
      setDeletingUser(null);
      return;
    }
    try {
      await sqliteService.deleteUser(deletingUser.id, currentUser.name);
      addToast('Staff Deleted', `${deletingUser.name}'s profile was removed from SQLite.`, 'success');
      setDeletingUser(null);
      await loadUsers();
    } catch (err) {
      addToast('Error', err.message, 'critical');
    }
  };

  // Download raw .sqlite binary file
  const handleExportDatabase = () => {
    try {
      const blob = sqliteService.exportDatabaseBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital_telemetry_${Date.now()}.sqlite`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Database Exported', 'Raw SQLite database binary downloaded successfully.', 'success');
    } catch (err) {
      addToast('Export Error', err.message, 'critical');
    }
  };

  return (
    <div className="admin-panel-container">
      {/* Header */}
      <div className="admin-header-row">
        <div>
          <div className="admin-title-badge">
            <ShieldCheck size={18} className="text-primary" />
            <span>Administrative Governance</span>
          </div>
          <h1 className="admin-page-title">Hospital Staff Directory & Access Control</h1>
          <p className="admin-page-subtitle">
            Manage authenticated clinical personnel, assign Doctor / Nurse permissions, and audit SQLite credentials.
          </p>
        </div>

        <div className="admin-header-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleExportDatabase}
            title="Export raw SQLite file for audit/backup"
          >
            <Download size={16} />
            <span>Export SQLite DB</span>
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>Add Staff Profile</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-circle blue">
            <Users size={20} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Total Staff</span>
            <span className="stat-val mono bold">{users.length}</span>
            <span className="stat-sub">SQLite Stored Profiles</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-circle cyan">
            <Stethoscope size={20} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Doctors (Full Clinical Access)</span>
            <span className="stat-val mono bold">{doctorsCount}</span>
            <span className="stat-sub">Valve clamp, prescribe & transfer</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-circle green">
            <HeartPulse size={20} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Nurses (Monitor Only)</span>
            <span className="stat-val mono bold">{nursesCount}</span>
            <span className="stat-sub">Telemetry vitals & alert monitor</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-circle purple">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Administrators</span>
            <span className="stat-val mono bold">{adminsCount}</span>
            <span className="stat-sub">Full system governance</span>
          </div>
        </div>
      </div>

      {/* Role Access Matrix Banner */}
      <div className="role-matrix-banner">
        <div className="matrix-col">
          <div className="matrix-title">
            <span className="role-tag doctor">Doctor</span>
            <strong>Clinical & Control Access</strong>
          </div>
          <p className="matrix-desc">
            Can remotely trigger emergency clamp/release (90°/120°), modify prescribed flow rate, discharge/transfer patients, and acknowledge clinical alerts.
          </p>
        </div>
        <div className="matrix-divider"></div>
        <div className="matrix-col">
          <div className="matrix-title">
            <span className="role-tag nurse">Nurse</span>
            <strong>Monitor-Only Access</strong>
          </div>
          <p className="matrix-desc">
            Strict bedside surveillance. Can monitor real-time IV drip droplets, check battery telemetry, view patient charts, and acknowledge buzzer alarms. Prohibited from clamping valves or altering medication.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by staff name, username, department, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Filter Role:</span>
          <div className="filter-buttons">
            {['ALL', 'Doctor', 'Nurse', 'Administrator'].map(role => (
              <button
                key={role}
                className={`filter-btn ${roleFilter === role ? 'active' : ''}`}
                onClick={() => setRoleFilter(role)}
              >
                {role === 'ALL' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="admin-table-card">
        <div className="table-header-row">
          <h3 className="table-title">Authenticated Medical Staff ({filteredUsers.length})</h3>
          <button className="btn-icon" onClick={loadUsers} title="Refresh SQLite Users">
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>STAFF MEMBER</th>
                <th>ROLE & PERMISSION</th>
                <th>DEPARTMENT</th>
                <th>CONTACT DETAILS</th>
                <th>STATUS</th>
                <th>LAST LOGIN</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No staff profiles match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className={`user-initials-sm ${u.role ? u.role.toLowerCase() : 'doctor'}`}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div className="user-display-name">{u.name}</div>
                          <div className="user-username-tag mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase()}`}>
                        {u.role === 'Doctor' ? <Stethoscope size={13} /> : u.role === 'Nurse' ? <HeartPulse size={13} /> : <ShieldCheck size={13} />}
                        {u.role}
                      </span>
                      <div className="permission-sub">
                        {u.role === 'Doctor' ? 'Full Clinical Control' : u.role === 'Nurse' ? 'Monitor Only' : 'Master Admin'}
                      </div>
                    </td>
                    <td>
                      <div className="dept-text">{u.department}</div>
                      <div className="badge-sub">{u.badge}</div>
                    </td>
                    <td>
                      <div className="contact-item">
                        <Mail size={13} className="text-muted" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="contact-item">
                          <Phone size={13} className="text-muted" />
                          <span className="mono">{u.phone}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <button 
                        className={`status-btn ${u.status === 'active' ? 'active' : 'suspended'}`}
                        onClick={() => handleToggleStatus(u)}
                        title="Click to Toggle Active/Suspended"
                      >
                        {u.status === 'active' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        <span>{u.status === 'active' ? 'Active' : 'Suspended'}</span>
                      </button>
                    </td>
                    <td>
                      <span className="mono text-muted" style={{ fontSize: '0.75rem' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() + ' ' + new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never logged in'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btn-group">
                        <button 
                          className="btn-icon" 
                          title="Edit Profile"
                          onClick={() => setEditingUser({ ...u })}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Reset Password"
                          onClick={() => { setPasswordResetUser(u); setResetPassValue(''); }}
                        >
                          <Key size={15} />
                        </button>
                        {u.id !== currentUser.id && (
                          <button 
                            className="btn-icon text-danger" 
                            title="Delete Staff"
                            onClick={() => setDeletingUser(u)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD STAFF MODAL ================= */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <UserPlus size={20} className="text-primary" />
                <h3 className="modal-title">Add New Clinical Staff Profile</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Username (Unique) *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input mono"
                    placeholder="e.g. dr.patel or nurse.amy"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password *</label>
                  <div className="input-with-action">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      className="form-input"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button 
                      type="button" 
                      className="btn-pass-peek"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    placeholder="e.g. Dr. Rajesh Patel"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Role *</label>
                  <select 
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Doctor">Doctor (Clinical Control & Clamping)</option>
                    <option value="Nurse">Nurse (Monitor Only Access)</option>
                    <option value="Administrator">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Department / Unit *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    placeholder="e.g. Intensive Care Unit, Cardiology"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hospital Email</label>
                  <input 
                    type="email" 
                    className="form-input"
                    placeholder="staff@hospital.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input 
                    type="tel" 
                    className="form-input mono"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Badge Title</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Staff Cardiologist, Lead ICU Nurse"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to SQLite Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT STAFF MODAL ================= */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Edit3 size={20} className="text-primary" />
                <h3 className="modal-title">Edit Staff Profile: {editingUser.name}</h3>
              </div>
              <button className="btn-icon" onClick={() => setEditingUser(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select 
                    className="form-select"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value="Doctor">Doctor (Clinical Control & Clamping)</option>
                    <option value="Nurse">Nurse (Monitor Only Access)</option>
                    <option value="Administrator">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select"
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  >
                    <option value="active">Active (Login Permitted)</option>
                    <option value="suspended">Suspended (Access Blocked)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-input"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    type="tel" 
                    className="form-input mono"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Badge Title</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editingUser.badge || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, badge: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes to SQLite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RESET PASSWORD MODAL ================= */}
      {passwordResetUser && (
        <div className="modal-overlay" onClick={() => setPasswordResetUser(null)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Key size={18} className="text-primary" />
                <h3 className="modal-title">Reset Password for @{passwordResetUser.username}</h3>
              </div>
              <button className="btn-icon" onClick={() => setPasswordResetUser(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="modal-form">
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Set a new password for <strong>{passwordResetUser.name}</strong> ({passwordResetUser.role}).
              </p>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="text" 
                  required 
                  className="form-input mono"
                  placeholder="Enter new password"
                  value={resetPassValue}
                  onChange={(e) => setResetPassValue(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPasswordResetUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <AlertTriangle size={20} className="text-danger" />
                <h3 className="modal-title">Delete Staff Profile</h3>
              </div>
              <button className="btn-icon" onClick={() => setDeletingUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-form">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete the profile of <strong>{deletingUser.name}</strong> (@{deletingUser.username})?
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                This record will be deleted from the SQLite database. This action cannot be undone.
              </p>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeletingUser(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteStaff}>
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-panel-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .admin-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .admin-title-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(2, 132, 199, 0.1);
          color: var(--primary);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .admin-page-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .admin-page-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .admin-header-actions {
          display: flex;
          gap: 10px;
        }

        /* KPI Stats */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .admin-stat-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }

        .stat-icon-circle {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon-circle.blue {
          background: rgba(2, 132, 199, 0.12);
          color: #0284c7;
        }

        .stat-icon-circle.cyan {
          background: rgba(14, 165, 233, 0.12);
          color: #0ea5e9;
        }

        .stat-icon-circle.green {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .stat-icon-circle.purple {
          background: rgba(139, 92, 246, 0.12);
          color: #8b5cf6;
        }

        .stat-meta {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .stat-val {
          font-size: 1.4rem;
          color: var(--text-primary);
          line-height: 1.2;
          margin: 2px 0;
        }

        .stat-sub {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        /* Role Matrix Banner */
        .role-matrix-banner {
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .matrix-col {
          flex: 1;
        }

        .matrix-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          margin-bottom: 4px;
          color: var(--text-primary);
        }

        .matrix-desc {
          font-size: 0.775rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        .matrix-divider {
          width: 1px;
          height: 48px;
          background: var(--border-medium);
        }

        .role-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .role-tag.doctor {
          background: #e0f2fe;
          color: #0369a1;
        }

        .role-tag.nurse {
          background: #d1fae5;
          color: #047857;
        }

        [data-theme="dark"] .role-tag.doctor {
          background: rgba(14, 165, 233, 0.2);
          color: #38bdf8;
        }

        [data-theme="dark"] .role-tag.nurse {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        /* Toolbar */
        .admin-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 260px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-medium);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-label {
          font-size: 0.8125rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .filter-buttons {
          display: flex;
          background: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          padding: 3px;
        }

        .filter-btn {
          padding: 6px 12px;
          border: none;
          background: transparent;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: 4px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-btn.active {
          background: var(--primary);
          color: #ffffff;
        }

        /* Table Card */
        .admin-table-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .table-header-row {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .table-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .admin-table th {
          text-align: left;
          padding: 12px 18px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
        }

        .admin-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
          vertical-align: middle;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-initials-sm {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
          border: 2px solid var(--border-subtle);
        }

        .user-initials-sm.administrator {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
          border-color: rgba(168, 85, 247, 0.35);
        }

        .user-initials-sm.doctor {
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
          border-color: rgba(6, 182, 212, 0.35);
        }

        .user-initials-sm.nurse {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.35);
        }

        .user-display-name {
          font-weight: 700;
          color: var(--text-primary);
        }

        .user-username-tag {
          font-size: 0.725rem;
          color: var(--text-muted);
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 999px;
        }

        .role-badge.doctor {
          background: #e0f2fe;
          color: #0284c7;
        }

        .role-badge.nurse {
          background: #d1fae5;
          color: #059669;
        }

        .role-badge.administrator {
          background: #ede9fe;
          color: #7c3aed;
        }

        [data-theme="dark"] .role-badge.doctor {
          background: rgba(14, 165, 233, 0.2);
          color: #38bdf8;
        }

        [data-theme="dark"] .role-badge.nurse {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        [data-theme="dark"] .role-badge.administrator {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
        }

        .permission-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 3px;
        }

        .dept-text {
          font-weight: 600;
          color: var(--text-primary);
        }

        .badge-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.775rem;
          color: var(--text-secondary);
        }

        .status-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          font-size: 0.725rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .status-btn.active {
          background: var(--status-normal-bg);
          color: var(--status-normal);
        }

        .status-btn.suspended {
          background: var(--status-empty-bg);
          color: var(--status-empty);
        }

        .action-btn-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-card {
          width: 100%;
          max-width: 620px;
          background: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: modalSlideUp 0.25s ease-out;
        }

        .modal-card.modal-sm {
          max-width: 440px;
        }

        .modal-header {
          padding: 18px 22px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .modal-form {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .form-input, .form-select {
          padding: 9px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-medium);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
          font-family: inherit;
        }

        .form-input:focus, .form-select:focus {
          border-color: var(--primary);
          background: var(--bg-surface);
        }

        .input-with-action {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-action .form-input {
          width: 100%;
          padding-right: 36px;
        }

        .btn-pass-peek {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }

        @media (max-width: 768px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
          .role-matrix-banner {
            flex-direction: column;
            gap: 14px;
          }
          .matrix-divider {
            width: 100%;
            height: 1px;
          }
        }
      `}</style>
    </div>
  );
}
