import React from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Users, 
  LineChart, 
  UserCheck, 
  FileText, 
  Settings, 
  Wifi, 
  Radio, 
  ShieldCheck, 
  LogOut,
  X
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { 
    currentView, 
    setCurrentView, 
    setSelectedDeviceId, 
    stats, 
    firebaseConnected, 
    currentUser, 
    setCurrentUser,
    logout
  } = useIV();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'patients', label: 'Patient', icon: Users, badge: stats.total },
    { id: 'vitals', label: 'Vitals & AI', icon: LineChart },
    { id: 'assigns', label: 'Assigns', icon: UserCheck },
    { id: 'reports', label: 'Report', icon: FileText },
    ...(currentUser.role === 'Administrator' ? [
      { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, badge: 'Gov' }
    ] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setSelectedDeviceId(null); // return to main view
    if (onCloseMobile) onCloseMobile();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.replace(/^(Dr\.|Nurse|Director|Mr\.|Ms\.|Mrs\.)\s*/i, '').trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return words[0].slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 40
          }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Logo */}
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="brand-icon-wrap">
              <Activity className="brand-pulse-icon" size={24} />
            </div>
            <div className="brand-text">
              <span className="brand-title">IV Drip Monitor</span>
              <span className="brand-subtitle">Smart Medical Telemetry</span>
            </div>
          </div>
          {mobileOpen && (
            <button className="btn-icon mobile-close-btn" onClick={onCloseMobile}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">MAIN MENU</div>
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <button 
                    className={`nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <Icon size={19} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Hardware & Firebase Status Footer */}
        <div className="sidebar-footer">
          <div className="system-status-card">
            <div className="status-row">
              <div className="status-label-group">
                <Radio size={14} className={firebaseConnected ? 'text-success' : 'text-danger'} />
                <span className="status-text">Firebase RTDB</span>
              </div>
              <span className={`status-pill ${firebaseConnected ? 'online' : 'reconnecting'}`}>
                {firebaseConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="status-row" style={{ marginTop: '8px' }}>
              <div className="status-label-group">
                <Wifi size={14} className="text-primary" />
                <span className="status-text">ESP8266 Sync</span>
              </div>
              <span className="status-subtext mono">115200 bps</span>
            </div>
          </div>

          {/* User profile initials snippet (no image) */}
          <div className="sidebar-user">
            <div className={`user-initials-badge ${currentUser.role ? currentUser.role.toLowerCase() : 'doctor'}`}>
              {getInitials(currentUser.name)}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser.name}</div>
              <div className="user-role">{currentUser.role}</div>
            </div>
            <button 
              className="btn-icon logout-btn" 
              title="Logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 250px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 50;
          transition: transform var(--transition-normal);
        }

        .sidebar-header {
          padding: 24px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
        }

        .brand-pulse-icon {
          animation: heartPulse 2.4s infinite ease-in-out;
        }

        @keyframes heartPulse {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.15); }
          30% { transform: scale(1); }
          45% { transform: scale(1.1); }
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-weight: 800;
          font-size: 1.05rem;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .brand-subtitle {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .sidebar-nav {
          flex: 1;
          padding: 24px 14px;
          overflow-y: auto;
        }

        .nav-section-title {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          padding: 0 12px 10px;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .nav-btn:hover {
          background-color: var(--bg-surface-hover);
          color: var(--text-primary);
        }

        .nav-btn.active {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
        }

        .nav-badge {
          background-color: var(--primary);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .system-status-card {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 12px;
          font-size: 0.775rem;
        }

        .status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .status-label-group {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .status-pill {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .status-pill.online {
          background-color: var(--status-normal-bg);
          color: var(--status-normal);
        }

        .status-pill.reconnecting {
          background-color: var(--status-empty-bg);
          color: var(--status-empty);
        }

        .status-subtext {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 4px;
        }

        .user-initials-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .user-initials-badge.doctor {
          background: #e0f2fe;
          color: #0369a1;
          border: 2px solid #bae6fd;
        }

        .user-initials-badge.nurse {
          background: #d1fae5;
          color: #047857;
          border: 2px solid #a7f3d0;
        }

        .user-initials-badge.administrator {
          background: #ede9fe;
          color: #7c3aed;
          border: 2px solid #ddd6fe;
        }

        [data-theme="dark"] .user-initials-badge.doctor {
          background: rgba(14, 165, 233, 0.2);
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.4);
        }

        [data-theme="dark"] .user-initials-badge.nurse {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border-color: rgba(52, 211, 153, 0.4);
        }

        [data-theme="dark"] .user-initials-badge.administrator {
          background: rgba(139, 92, 246, 0.2);
          color: #c4b5fd;
          border-color: rgba(167, 139, 250, 0.4);
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .logout-btn {
          color: var(--text-muted);
        }

        .logout-btn:hover {
          color: var(--status-empty);
        }

        .mobile-close-btn {
          display: none;
        }

        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
