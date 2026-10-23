import React, { useState } from 'react';
import { 
  MoreVertical, 
  Wifi, 
  Droplet, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Edit3, 
  UserPlus, 
  Trash2, 
  Activity, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function DeviceCard({ device }) {
  const { 
    setSelectedDeviceId, 
    toggleClamp, 
    setEditingDevice, 
    setAssigningDevice, 
    deleteDevice, 
    currentUser,
    addToast 
  } = useIV();
  const [menuOpen, setMenuOpen] = useState(false);

  const isCritical = device.status === 'empty' || !device.liquidPresent;
  const isLow = device.status === 'low' || device.battery < 20;
  const isOffline = device.status === 'offline';
  const isClamped = device.flowStatus === 'clamped';

  // Battery circular arc calculation (80x80 SVG gauge)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (device.battery / 100) * circumference;

  let batteryColor = 'var(--status-normal)';
  if (device.battery < 20) batteryColor = 'var(--status-empty)';
  else if (device.battery < 45) batteryColor = 'var(--status-low)';

  const handleCardClick = (e) => {
    // If clicked on 3-dots menu or inside it, don't open details page
    if (e.target.closest('.card-menu-container') || e.target.closest('.card-btn-action')) {
      return;
    }
    setSelectedDeviceId(device.id);
  };

  const handleAction = (action, e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (action === 'details') {
      setSelectedDeviceId(device.id);
    } else if (action === 'clamp') {
      if (isOffline) {
        if (addToast) {
          addToast('Device Offline', "Device is offline. Servo clamp cannot be controlled while disconnected.", 'warning');
        }
        return;
      }
      if (currentUser.role === 'Nurse') {
        if (addToast) {
          addToast('Permission Denied', 'Nurses have monitor-only access. Emergency valve clamping requires Physician authorization.', 'warning');
        }
        return;
      }
      toggleClamp(device.id);
    } else if (action === 'assign') {
      if (currentUser.role === 'Nurse') {
        if (addToast) {
          addToast('Permission Denied', 'Patient assignment requires Physician authorization.', 'warning');
        }
        return;
      }
      setAssigningDevice(device);
    } else if (action === 'edit') {
      setEditingDevice(device);
    } else if (action === 'delete') {
      if (window.confirm(`Are you sure you want to decommission ${device.id}?`)) {
        deleteDevice(device.id);
      }
    }
  };

  return (
    <div 
      className={`device-card ${isCritical ? 'critical' : ''} ${isLow ? 'low-warn' : ''} ${isOffline ? 'offline' : ''}`}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="card-title-group">
          <div className={`device-icon-pill ${isCritical ? 'alert' : ''}`}>
            {isCritical ? (
              <AlertTriangle size={15} className="alert-icon-svg" />
            ) : (
              <Droplet size={15} className="droplet-icon-svg" />
            )}
          </div>
          <div className="device-id-text">
            <span className="card-label-sub">Device</span>
            <div className="device-id-row">
              <h3 className="device-id-heading">{device.id}</h3>
              {isCritical && (
                <span className="badge badge-empty card-empty-tag">
                  EMPTY
                </span>
              )}
            </div>
            {device.patient?.name && (
              <span className="patient-name-tag">
                {device.patient.name}
              </span>
            )}
            {(device.patient?.assignedNurseName || device.assignedNurseName) && (
              <span className="nurse-name-tag">
                👩‍⚕️ {device.patient?.assignedNurseName || device.assignedNurseName}
              </span>
            )}
          </div>
        </div>

        {/* 3-dots Context Menu */}
        <div className="card-menu-container" onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn-icon card-menu-btn" 
            onClick={() => setMenuOpen(!menuOpen)}
            title="Options"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="card-menu-dropdown">
              <button className="menu-item" onClick={(e) => handleAction('details', e)}>
                <Activity size={14} /> View Details
              </button>
              <button 
                className={`menu-item ${isOffline ? 'disabled' : ''}`} 
                onClick={(e) => handleAction('clamp', e)}
                style={isOffline ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {isClamped ? <Unlock size={14} /> : <Lock size={14} />}
                {isOffline ? "Servo Clamp (Offline)" : (isClamped ? 'Unclamp Valve' : 'Emergency Clamp')}
              </button>
              <button className="menu-item" onClick={(e) => handleAction('assign', e)}>
                <UserPlus size={14} /> Assign / Transfer
              </button>
              {currentUser.role === 'Administrator' && (
                <>
                  <button className="menu-item" onClick={(e) => handleAction('edit', e)}>
                    <Edit3 size={14} /> Edit Device
                  </button>
                  <button className="menu-item text-danger" onClick={(e) => handleAction('delete', e)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Vitals: Left = Fluid Availability, Right = Battery Percentage */}
      <div className="card-vitals-row">
        {/* Left: Fluid Availability (replaces old battery position) */}
        <div className="vital-col-widget">
          <div className={`fluid-sensor-circle ${device.liquidPresent ? 'detected' : 'dry'}`}>
            {device.liquidPresent ? (
              <Droplet size={28} className="fluid-pulse-svg text-primary" strokeWidth={2.4} />
            ) : (
              <AlertTriangle size={28} className="alert-pulse-svg text-danger" strokeWidth={2.4} />
            )}
            <span className={`fluid-avail-status-tag ${device.liquidPresent ? 'status-present' : 'status-empty'}`}>
              {device.liquidPresent ? 'PRESENT' : 'EMPTY'}
            </span>
          </div>
          <span className="vital-col-caption">Fluid Availability</span>
        </div>

        {/* Right: Battery Percentage (replaces WiFi signal range) */}
        <div className="vital-col-widget">
          <div className="battery-gauge-wrapper">
            <svg className="battery-svg" width="80" height="80" viewBox="0 0 80 80">
              <circle
                className="gauge-bg"
                cx="40"
                cy="40"
                r={radius}
                strokeWidth="6"
              />
              <circle
                className="gauge-progress"
                cx="40"
                cy="40"
                r={radius}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                stroke={batteryColor}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div className="gauge-text-overlay">
              <span className="gauge-value mono">{device.battery}%</span>
            </div>
          </div>
          <span className="vital-col-caption">Battery</span>
        </div>
      </div>

      {/* Card Bottom Meta: Room & Bed, Flow Status, Live */}
      <div className="card-footer-meta">
        <div className="footer-meta-item">
          <span className="meta-label">Room & Bed</span>
          <span className="meta-value bold mono">
            {device.room || '301'} <span className="meta-bed-sub">• Bed {device.bed || '01'}</span>
          </span>
        </div>

        <div className="footer-meta-item">
          <span className="meta-label">Flow Status</span>
          <div className="flow-status-pill">
            <Droplet size={13} className={`flow-drop-icon ${isOffline ? 'offline' : (isClamped ? 'clamped' : 'flowing')}`} />
            <span className={`flow-text ${isOffline ? 'text-offline' : (isClamped ? 'text-clamped' : 'text-open')}`}>
              {isOffline ? 'Offline' : (isClamped ? 'Clamped' : 'Open')}
            </span>
          </div>
        </div>

        <div className="footer-meta-item">
          <span className="meta-label">Connection</span>
          <div className="connection-pill">
            <span className={`pulse-dot ${isOffline ? 'offline' : (isCritical ? 'empty' : 'normal')}`}></span>
            <span className="connection-text mono">
              {isOffline ? 'Offline' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .device-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px 20px;
          cursor: pointer;
          transition: all var(--transition-normal);
          position: relative;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .device-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-card-hover);
          border-color: var(--border-focus);
        }

        /* Critical / Empty Line card styling matching the orange/red card in mockup */
        .device-card.critical {
          background-color: var(--bg-card-empty);
          border-color: var(--border-card-empty);
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .card-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .device-icon-pill {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .device-icon-pill.alert {
          background-color: #fee2e2;
          color: var(--status-empty);
          animation: pulseCritical 1.4s infinite;
        }

        .card-label-sub {
          font-size: 0.6875rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          display: block;
          line-height: 1;
        }

        .device-id-heading {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 2px;
          letter-spacing: -0.01em;
        }

        .patient-name-tag {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
          display: block;
        }

        .nurse-name-tag {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 500;
          display: block;
          margin-top: 1px;
        }

        .card-menu-container {
          position: relative;
        }

        .card-menu-btn {
          padding: 4px;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
        }

        .card-menu-btn:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .card-menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background-color: var(--bg-modal);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 6px;
          width: 170px;
          z-index: 20;
          animation: fadeIn 0.15s ease-out;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background var(--transition-fast);
          text-align: left;
        }

        .menu-item:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .device-id-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-empty-tag {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }

        .card-vitals-row {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 8px 0;
        }

        .vital-col-widget {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .fluid-sensor-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          transition: all var(--transition-fast);
        }

        .fluid-sensor-circle.detected {
          background-color: var(--status-normal-bg);
          border: 2.5px solid var(--status-normal);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
        }

        .fluid-sensor-circle.dry {
          background-color: var(--status-empty-bg);
          border: 2.5px solid var(--status-empty);
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);
          animation: pulseCritical 1.2s infinite ease-in-out;
        }

        .fluid-avail-status-tag {
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          line-height: 1;
        }

        .fluid-avail-status-tag.status-present {
          color: #059669;
        }

        .fluid-avail-status-tag.status-empty {
          color: #dc2626;
        }

        .vital-col-caption {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .battery-gauge-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .battery-svg {
          transform: rotate(0deg);
        }

        .gauge-bg {
          fill: none;
          stroke: var(--border-subtle);
        }

        .gauge-progress {
          fill: none;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease;
        }

        .gauge-text-overlay {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .gauge-value {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }

        .meta-bed-sub {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .card-footer-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-subtle);
          padding-top: 12px;
        }

        .footer-meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-label {
          font-size: 0.6875rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .meta-value.bold {
          font-weight: 800;
          font-size: 0.9375rem;
          color: var(--text-primary);
        }

        .flow-status-pill {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .flow-text {
          font-size: 0.8125rem;
          font-weight: 700;
        }

        .text-open {
          color: var(--status-normal);
        }

        .text-clamped {
          color: var(--clamped-badge);
        }

        .text-offline {
          color: var(--status-offline);
        }

        .flow-drop-icon.offline {
          color: var(--status-offline);
        }

        .connection-pill {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .connection-text {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
