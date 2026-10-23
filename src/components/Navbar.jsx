import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Menu, 
  Plus, 
  Sparkles, 
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  X
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function Navbar({ onOpenMobile }) {
  const { 
    searchQuery, 
    setSearchQuery, 
    stats, 
    isMuted, 
    toggleMute, 
    theme, 
    toggleTheme, 
    isNotificationOpen, 
    setIsNotificationOpen, 
    setIsAddDeviceOpen,
    currentUser,
    setCurrentUser,
    addToast,
    logout,
    currentView,
    setCurrentView,
    setSelectedDeviceId
  } = useIV();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });
  
  const formattedDate = currentTime.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.replace(/^(Dr\.|Nurse|Director|Mr\.|Ms\.|Mrs\.)\s*/i, '').trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return words[0].slice(0, 2).toUpperCase();
  };

  const toggleRole = () => {
    const nextRole = currentUser.role === 'Doctor' ? 'Administrator' : 'Doctor';
    const nextName = nextRole === 'Administrator' ? 'Director M. Vance' : 'Dr. Sarah Jenkins';
    setCurrentUser(prev => ({
      ...prev,
      role: nextRole,
      name: nextName,
      badge: nextRole === 'Administrator' ? 'Chief Admin' : 'Staff Cardiologist'
    }));
    setProfileDropdownOpen(false);
    addToast('Role Switched', `Active profile changed to ${nextRole}.`, 'info');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Mobile menu button */}
        <button className="btn-icon mobile-menu-btn" onClick={onOpenMobile} title="Open Menu">
          <Menu size={20} />
        </button>

        {/* Global Search Bar */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search Bar, Device ID/Patient Name/Room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {/* Live Clock & Date */}
        <div className="time-display mono">
          <span className="time-text">{formattedTime}</span>
          <span className="date-text">{formattedDate}</span>
        </div>

        {/* Audio Mute / Unmute */}
        <button 
          className={`btn-icon nav-tool-btn ${isMuted ? 'muted' : 'active'}`}
          onClick={toggleMute}
          title={isMuted ? "Alarm Sound Muted (Click to Unmute)" : "Alarm Sound Active (Click to Mute)"}
        >
          {isMuted ? <VolumeX size={18} className="text-muted" /> : <Volume2 size={18} className="text-primary" />}
        </button>

        {/* Theme Toggle: Light (default) vs Dark (Navy) */}
        <button 
          className="btn-icon nav-tool-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? "Switch to Deep Navy Medical Theme" : "Switch to Light Blue Medical Theme"}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-warning" />}
        </button>

        {/* Notification Bell */}
        <div className="notification-bell-container">
          <button 
            className={`btn-icon nav-tool-btn bell-btn ${stats.unreadAlerts > 0 ? 'has-alerts' : ''}`}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            title="System Alerts & Notifications"
          >
            <Bell size={19} />
            {stats.unreadAlerts > 0 && (
              <span className="bell-badge">
                {stats.unreadAlerts}
              </span>
            )}
          </button>
        </div>

        {/* Add Device Button */}
        <button 
          className="btn btn-primary nav-add-btn"
          onClick={() => setIsAddDeviceOpen(true)}
        >
          <Plus size={16} />
          <span>Add Device</span>
        </button>

        {/* User Profile Pill */}
        {/* User Profile Pill */}
        <div className="user-profile-menu" ref={dropdownRef}>
          <button 
            className="profile-pill-btn"
            onClick={() => setProfileDropdownOpen(prev => !prev)}
            aria-expanded={profileDropdownOpen}
            type="button"
          >
            <div className="initials-wrapper">
              <div className={`navbar-initials-badge ${currentUser.role ? currentUser.role.toLowerCase() : 'doctor'}`}>
                {getInitials(currentUser.name)}
              </div>
              <span className="profile-online-indicator"></span>
            </div>
            <div className="profile-text-group">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-role-tag">{currentUser.role}</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {profileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-user-name">{currentUser.name}</div>
                <div className="dropdown-user-email">{currentUser.email || `@${currentUser.username}`}</div>
                <div className="dropdown-user-dept mono" style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {currentUser.department || 'Hospital Staff'}
                </div>
                <div className={`badge ${currentUser.role === 'Doctor' ? 'badge-primary' : currentUser.role === 'Nurse' ? 'badge-normal' : 'badge-purple'}`} style={{ marginTop: '8px' }}>
                  <CheckCircle size={12} /> {currentUser.role}: {currentUser.role === 'Doctor' ? 'Clinical Control' : currentUser.role === 'Nurse' ? 'Monitor Only' : 'Master Admin'}
                </div>
              </div>
              <div className="dropdown-divider"></div>
              {currentUser.role === 'Administrator' && (
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    setCurrentView('admin');
                    setSelectedDeviceId(null);
                    setProfileDropdownOpen(false);
                  }}
                >
                  <ShieldCheck size={16} className="text-primary" />
                  <span>Admin Staff Governance</span>
                </button>
              )}
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item text-danger" 
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          height: 70px;
          background-color: var(--bg-navbar);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          max-width: 520px;
        }

        .mobile-menu-btn {
          display: none;
        }

        .search-box {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 9px 38px 9px 40px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-medium);
          background-color: var(--bg-surface);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
          background-color: var(--bg-card);
        }

        .search-clear-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .time-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 0 10px;
          border-right: 1px solid var(--border-subtle);
        }

        .time-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .date-text {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .nav-tool-btn {
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          background-color: var(--bg-surface);
          color: var(--text-secondary);
          position: relative;
          cursor: pointer;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-tool-btn:hover {
          background-color: var(--bg-surface-hover);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }

        .notification-bell-container {
          position: relative;
        }

        .bell-btn.has-alerts {
          color: var(--status-empty);
        }

        .bell-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background-color: var(--status-empty);
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 800;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 2px var(--bg-surface);
          animation: pulseDotAlert 1.5s infinite;
        }

        .nav-add-btn {
          padding: 8px 16px;
          font-size: 0.875rem;
        }

        .user-profile-menu {
          position: relative;
        }

        .profile-pill-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 10px 4px 4px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background-color: var(--bg-surface);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .profile-pill-btn:hover {
          border-color: var(--border-focus);
          background-color: var(--bg-surface-hover);
        }

        .initials-wrapper {
          position: relative;
        }

        .navbar-initials-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.775rem;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .navbar-initials-badge.doctor {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        .navbar-initials-badge.nurse {
          background: #d1fae5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .navbar-initials-badge.administrator {
          background: #ede9fe;
          color: #7c3aed;
          border: 1px solid #ddd6fe;
        }

        [data-theme="dark"] .navbar-initials-badge.doctor {
          background: rgba(14, 165, 233, 0.2);
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.4);
        }

        [data-theme="dark"] .navbar-initials-badge.nurse {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border-color: rgba(52, 211, 153, 0.4);
        }

        [data-theme="dark"] .navbar-initials-badge.administrator {
          background: rgba(139, 92, 246, 0.2);
          color: #c4b5fd;
          border-color: rgba(167, 139, 250, 0.4);
        }

        .profile-online-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 9px;
          height: 9px;
          background-color: var(--status-normal);
          border-radius: 50%;
          border: 2px solid var(--bg-surface);
        }

        .profile-text-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .profile-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .profile-role-tag {
          font-size: 0.6875rem;
          color: var(--primary);
          font-weight: 600;
        }

        .profile-chevron {
          color: var(--text-muted);
        }

        .profile-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 230px;
          background-color: var(--bg-modal);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 10px;
          z-index: 100;
          animation: modalSlideUp 0.2s ease-out;
        }

        .dropdown-header {
          padding: 8px 10px;
        }

        .dropdown-user-name {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .dropdown-user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .dropdown-divider {
          height: 1px;
          background-color: var(--border-subtle);
          margin: 6px 0;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color var(--transition-fast);
          text-align: left;
        }

        .dropdown-item:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .dropdown-item.text-danger:hover {
          background-color: var(--status-empty-bg);
          color: var(--status-empty);
        }

        @media (max-width: 900px) {
          .mobile-menu-btn {
            display: flex;
          }
          .time-display {
            display: none;
          }
          .profile-text-group, .profile-chevron {
            display: none;
          }
          .profile-pill-btn {
            padding: 2px;
          }
          .nav-add-btn span {
            display: none;
          }
          .nav-add-btn {
            padding: 8px;
          }
        }
      `}</style>
    </header>
  );
}
