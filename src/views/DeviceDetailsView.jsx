import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Droplet, 
  Wifi, 
  Battery, 
  Activity, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  UserCheck, 
  UserMinus, 
  FileText, 
  Printer, 
  Settings, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Sparkles,
  Zap,
  HeartPulse,
  Info
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function DeviceDetailsView({ deviceId, onBack }) {
  const { 
    devices, 
    alerts, 
    acknowledgeAlert, 
    toggleClamp, 
    setAssigningDevice, 
    setEditingDevice,
    updateDevice,
    addToast,
    currentUser 
  } = useIV();

  const device = devices.find(d => d.id === deviceId);

  if (!device) {
    return (
      <div className="not-found-card">
        <h3>Device {deviceId} not found</h3>
        <button className="btn btn-primary" onClick={onBack}>
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    );
  }

  const isCritical = device.status === 'empty' || !device.liquidPresent;
  const isClamped = device.flowStatus === 'clamped';
  const isOffline = device.status === 'offline';

  // Battery gauge calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (device.battery / 100) * circumference;

  let batteryColor = 'var(--status-normal)';
  if (device.battery < 20) batteryColor = 'var(--status-empty)';
  else if (device.battery < 45) batteryColor = 'var(--status-low)';

  const flowRate = device.patient?.flowRate || 75;

  const handleAcknowledgeAlarm = () => {
    const unacked = alerts.filter(a => a.deviceId === device.id && !a.acknowledged);
    unacked.forEach(a => acknowledgeAlert(a.id));
    if (unacked.length === 0) {
      addToast('No Active Alarm', 'Device is operating without unacknowledged alerts.', 'info');
    }
  };

  const handleRemovePatient = () => {
    if (window.confirm(`Discharge / unassign patient ${device.patient?.name || ''} from ${device.id}?`)) {
      updateDevice(device.id, {
        patient: {
          name: "Unassigned",
          age: 0,
          gender: "--",
          diagnosis: "No active infusion",
          fluidType: "--",
          medicineName: "None",
          flowRate: 0,
          startTime: "--",
          totalVolume: 500,
          remainingVolume: 0,
          notes: "Bed currently vacant."
        }
      });
      addToast('Patient Discharged', `Device ${device.id} is now available for new assignment.`, 'info');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="device-details-page">
      {/* Top Header Navigation */}
      <div className="details-header-nav">
        <button className="btn btn-secondary back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div className="header-meta-group">
          <span className={`status-pill-large ${isOffline ? 'offline' : (isCritical ? 'critical' : 'online')}`}>
            <span className={`pulse-dot ${isOffline ? 'offline' : (isCritical ? 'empty' : 'normal')}`}></span>
            {isOffline ? 'Offline' : (isCritical ? 'Line Empty' : 'Online')}
          </span>

          <button 
            className="btn btn-secondary"
            onClick={handleRemovePatient}
          >
            <UserMinus size={15} />
            <span>Remove Patient</span>
          </button>

          <button 
            className="btn btn-primary"
            onClick={() => setAssigningDevice(device)}
          >
            <UserCheck size={15} />
            <span>Assign Patient</span>
          </button>
        </div>
      </div>

      {/* Main Title Row */}
      <div className="details-title-row">
        <div>
          <span className="details-subtitle">Device Details Page</span>
          <h1 className="details-device-id">{device.id}</h1>
          <p className="details-patient-sub">
            Patient: <strong>{device.patient?.name || 'Unassigned'}</strong> • Room {device.room}, Bed {device.bed}
          </p>
        </div>

        <div className="details-quick-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handlePrint}
            title="Print or Export Patient Telemetry Report"
          >
            <Printer size={16} /> Print Chart
          </button>
        </div>
      </div>

      {/* Two Column Layout Matching Mockup */}
      <div className="details-grid-layout">
        {/* Left Column: Patient Info & Alerts Timeline */}
        <div className="details-column-left">
          {/* Patient Info Card */}
          <div className="details-card patient-info-card">
            <div className="card-top-bar">
              <h3 className="section-card-title">Patient Info</h3>
              <span className="badge badge-normal">Active Infusion</span>
            </div>

            <div className="info-kv-grid">
              <div className="info-kv-item">
                <span className="info-key">Name</span>
                <span className="info-val bold">{device.patient?.name || 'Unassigned'}</span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">Age & Gender</span>
                <span className="info-val">{device.patient?.age ? `${device.patient.age} yrs, ${device.patient.gender}` : '--'}</span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">Bed / Room</span>
                <span className="info-val bold mono">Bed {device.bed} (Room {device.room})</span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">Flow Status</span>
                <span className={`info-val bold ${isOffline ? 'text-offline' : (isClamped ? 'text-clamped' : 'text-open')}`}>
                  {isOffline ? "Offline (Servo Can't Be Controlled)" : (isClamped ? 'Clamped (90°)' : 'Open (120°)')}
                </span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">Location</span>
                <span className="info-val">{device.ward || 'Hospital (Main Ward)'}</span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">IV Fluid Type</span>
                <span className="info-val bold text-primary">{device.patient?.fluidType || 'Normal Saline 0.9%'}</span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">Medicine Additive</span>
                <span className="info-val">{device.patient?.medicineName || 'None'}</span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">Duty Nurse</span>
                <span className="info-val bold text-success">
                  <HeartPulse size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {device.patient?.assignedNurseName || device.assignedNurseName || (device.patient?.assignedNurse ? `@${device.patient.assignedNurse}` : 'Unassigned')}
                </span>
              </div>
              <div className="info-kv-item">
                <span className="info-key">Prescribed Rate</span>
                <span className="info-val mono">{device.patient?.flowRate || 75} mL/hr</span>
              </div>
            </div>

            {/* Fluid Presence Status Box (Big Letters Centered with Color Indication) */}
            <div className={`fluid-status-display-box ${device.liquidPresent ? 'status-fluid-present' : 'status-fluid-empty'}`}>
              <div className="fluid-status-inner">
                {device.liquidPresent ? (
                  <Droplet size={34} className="fluid-status-icon" strokeWidth={2.5} />
                ) : (
                  <AlertTriangle size={34} className="fluid-status-icon" strokeWidth={2.5} />
                )}
                <span className="fluid-status-text">
                  {device.liquidPresent ? 'FLUID IS PRESENT' : 'FLUID IS NOT PRESENT'}
                </span>
              </div>
            </div>
          </div>

          {/* Maintenance & Controls Card (Moved to Left Column) */}
          <div className="details-card maintenance-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 className="section-card-title" style={{ margin: 0 }}>Maintenance & Controls</h3>
              {currentUser.role === 'Nurse' && (
                <span className="badge badge-normal" style={{ fontSize: '0.725rem' }}>
                  <Lock size={11} /> Nurse: Monitoring Access Only
                </span>
              )}
            </div>

            {currentUser.role === 'Nurse' && (
              <div style={{ 
                background: 'rgba(2, 132, 199, 0.08)', 
                border: '1px solid rgba(2, 132, 199, 0.2)', 
                borderRadius: '8px', 
                padding: '10px 14px', 
                fontSize: '0.8rem', 
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Info size={15} className="text-primary flex-shrink-0" />
                <span>You are in <strong>Bedside Nurse Monitoring Mode</strong>. Hardware actuator clamping, prescription changes, and calibration are restricted to Attending Physicians.</span>
              </div>
            )}
            
            {isOffline && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '8px', 
                padding: '10px 14px', 
                fontSize: '0.825rem', 
                color: 'var(--status-empty)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 600
              }}>
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span>Device is offline. Hardware is disconnected; servo valve cannot be controlled.</span>
              </div>
            )}
            
            <div className="action-buttons-grid">
              {isOffline ? (
                <button 
                  className="btn btn-secondary"
                  style={{ 
                    opacity: 0.65, 
                    cursor: 'not-allowed', 
                    background: 'var(--status-offline-bg)', 
                    borderColor: 'var(--status-offline-border)',
                    color: 'var(--status-offline)'
                  }}
                  onClick={() => addToast('Device Offline', "Device is offline. Servo clamp cannot be controlled while disconnected.", 'warning')}
                  title="Device is offline. Servo clamp cannot be controlled."
                >
                  <Lock size={16} />
                  <span>Device Offline: Servo Can't Be Controlled</span>
                </button>
              ) : currentUser.role === 'Nurse' ? (
                <button 
                  className="btn btn-secondary"
                  style={{ opacity: 0.65, cursor: 'not-allowed' }}
                  onClick={() => addToast('Permission Denied', 'Nurses have monitor-only access. Emergency valve clamping requires Attending Physician authorization.', 'warning')}
                  title="Restricted: Doctor authorization required to clamp valve"
                >
                  <Lock size={16} className="text-danger" />
                  <span>Valve Clamp (Doctor Only)</span>
                </button>
              ) : (
                <button 
                  className={`btn ${isClamped ? 'btn-primary' : 'btn-danger'}`}
                  onClick={() => toggleClamp(device.id)}
                >
                  {isClamped ? <Unlock size={16} /> : <Lock size={16} />}
                  <span>{isClamped ? 'Release Servo Valve (120°)' : 'Emergency Clamp Servo (90°)'}</span>
                </button>
              )}

              {currentUser.role === 'Nurse' ? (
                <button 
                  className="btn btn-secondary"
                  style={{ opacity: 0.65, cursor: 'not-allowed' }}
                  onClick={() => addToast('Permission Denied', 'Patient admission and prescription modifications require Physician authorization.', 'warning')}
                  title="Restricted to Physicians"
                >
                  <Lock size={16} className="text-muted" />
                  <span>Assign / Transfer (Doctor Only)</span>
                </button>
              ) : (
                <button 
                  className="btn btn-secondary"
                  onClick={() => setAssigningDevice(device)}
                >
                  <UserCheck size={16} />
                  <span>Assign / Transfer Patient</span>
                </button>
              )}

              {currentUser.role === 'Nurse' ? (
                <button 
                  className="btn btn-secondary"
                  style={{ opacity: 0.65, cursor: 'not-allowed' }}
                  onClick={() => addToast('Permission Denied', 'Telemetry sensor configuration requires Administrator authorization.', 'warning')}
                  title="Restricted to Administrators"
                >
                  <Lock size={16} className="text-muted" />
                  <span>Configure Device (Admin Only)</span>
                </button>
              ) : (
                <button 
                  className="btn btn-secondary"
                  onClick={() => setEditingDevice(device)}
                >
                  <Settings size={16} />
                  <span>Configure Device Parameters</span>
                </button>
              )}

              <button 
                className="btn btn-secondary"
                onClick={handlePrint}
              >
                <FileText size={16} />
                <span>Generate PDF Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Device Vitals & Alerts Timeline */}
        <div className="details-column-right">
          {/* Device Vitals Card */}
          <div className="details-card device-vitals-card">
            <div className="card-top-bar">
              <h3 className="section-card-title">Device Vitals</h3>
              <span className="vitals-updated-text mono">
                Last Seen: {new Date(device.lastSeen).toLocaleTimeString()}
              </span>
            </div>

            {/* Vitals Visual Row (matching mockup with 4 cards) */}
            <div className="vitals-visual-grid">
              {/* Animated Battery */}
              <div className="vital-mini-card">
                <span className="vital-label">Animated Battery</span>
                <div className="battery-gauge-wrapper">
                  <svg className="battery-svg" width="94" height="94" viewBox="0 0 94 94">
                    <circle
                      className="gauge-bg"
                      cx="47"
                      cy="47"
                      r={radius}
                      strokeWidth="8"
                    />
                    <circle
                      className="gauge-progress"
                      cx="47"
                      cy="47"
                      r={radius}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      stroke={batteryColor}
                      strokeLinecap="round"
                      transform="rotate(-90 47 47)"
                    />
                  </svg>
                  <div className="gauge-text-overlay">
                    <span className="gauge-value mono">{device.battery}%</span>
                  </div>
                </div>
                <span className="vital-desc mono">TP4056 Normal</span>
              </div>

              {/* Animated Signal (WiFi) */}
              <div className="vital-mini-card">
                <span className="vital-label">WiFi Signal</span>
                <div className="vital-icon-center">
                  <div className="signal-bars-large">
                    <div className={`bar-lg b1 ${device.signal >= 1 ? 'active' : ''}`}></div>
                    <div className={`bar-lg b2 ${device.signal >= 2 ? 'active' : ''}`}></div>
                    <div className={`bar-lg b3 ${device.signal >= 3 ? 'active' : ''}`}></div>
                    <div className={`bar-lg b4 ${device.signal >= 4 ? 'active' : ''}`}></div>
                  </div>
                </div>
                <span className="vital-metric mono">{device.signal}/4</span>
                <span className="vital-desc mono">{device.wifiDbm || -62} dBm</span>
              </div>

              {/* Animated Signal (Liquid Sensor) */}
              <div className="vital-mini-card">
                <span className="vital-label">Liquid Sensor</span>
                <div className="vital-icon-center">
                  <div className={`sensor-visual-pill ${device.liquidPresent ? 'detected' : 'dry'}`}>
                    <Droplet size={26} className={device.liquidPresent ? 'text-primary' : 'text-danger'} />
                  </div>
                </div>
                <span className="vital-metric mono">
                  {device.liquidPresent ? 'Liquid OK' : 'Air / Empty'}
                </span>
                <span className="vital-desc mono">Pin D5 XKC-Y25</span>
              </div>

              {/* Animated Flow Status */}
              <div className="vital-mini-card">
                <span className="vital-label">Flow Status</span>
                <div className="vital-icon-center">
                  <div className="drip-chamber">
                    <div 
                      className="drip-fluid"
                      style={{ height: isOffline ? '0%' : (device.liquidPresent ? '50%' : '5%') }}
                    ></div>
                    {!isOffline && device.liquidPresent && !isClamped && <div className="drip-drop"></div>}
                  </div>
                </div>
                <span className={`vital-metric ${isOffline ? 'text-offline' : (isClamped ? 'text-clamped' : 'text-open')}`}>
                  {isOffline ? 'Offline' : (isClamped ? 'Clamped' : 'Open')}
                </span>
                <span className="vital-desc mono">
                  {isOffline ? "Servo: Can't be controlled" : `Servo: ${device.servoAngle || (isClamped ? 90 : 120)}°`}
                </span>
              </div>
            </div>
          </div>

          {/* Alerts Timeline Card (Moved to Right Column) */}
          <div className="details-card alerts-timeline-card">
            <div className="card-top-bar">
              <h3 className="section-card-title">Alerts Timeline</h3>
              <div className="timeline-actions">
                <button 
                  className="btn btn-danger-outline"
                  onClick={handleAcknowledgeAlarm}
                >
                  <AlertTriangle size={15} /> Acknowledge Alarm
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => addToast('Device Disabled', `${device.id} safety telemetry temporarily paused.`, 'warning')}
                >
                  Disable Device
                </button>
              </div>
            </div>

            {/* Feed list */}
            <div className="timeline-feed">
              <div className="timeline-item">
                <div className="timeline-icon red">
                  <AlertTriangle size={14} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-item-title">
                    {isCritical ? "CRITICAL: LINE EMPTY LINE Alarm" : "Acknowledge Alarm feed log"}
                  </div>
                  <div className="timeline-item-desc">
                    {isCritical 
                      ? "Non-contact liquid sensor D5 pin reading LOW (air detected in drip chamber). Buzzer pulsing."
                      : "Drip fluid level steady. Optical sensor detecting regular flow."}
                  </div>
                  <span className="timeline-time mono">Just now</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon amber">
                  <AlertTriangle size={14} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-item-title">
                    Acknowledge Alarm LINE EMPTY LINE Alarm
                  </div>
                  <div className="timeline-item-desc">
                    Immediate safety clamp engaged (servo locked at 90° upon fluid depletion).
                  </div>
                  <span className="timeline-time mono">15 mins ago</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon blue">
                  <Activity size={14} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-item-title">
                    Maintenance History
                  </div>
                  <div className="timeline-item-desc">
                    ESP8266 connected to WiFi 'Susn'. Blynk & Firebase RTDB synchronized.
                  </div>
                  <span className="timeline-time mono">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .device-details-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn 0.25s ease-out;
        }

        .details-header-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-meta-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-pill-large {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 0.8125rem;
        }

        .status-pill-large.online {
          background-color: var(--status-normal-bg);
          color: var(--status-normal);
          border: 1px solid var(--status-normal-border);
        }

        .status-pill-large.critical {
          background-color: var(--status-empty-bg);
          color: var(--status-empty);
          border: 1px solid var(--status-empty-border);
          animation: pulseCritical 1.5s infinite;
        }

        .status-pill-large.offline {
          background-color: var(--status-offline-bg);
          color: var(--status-offline);
          border: 1px solid var(--status-offline-border);
        }

        .details-title-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 20px;
        }

        .details-subtitle {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .details-device-id {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
          margin: 4px 0;
        }

        .details-patient-sub {
          font-size: 0.9375rem;
          color: var(--text-secondary);
        }

        .details-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .details-column-left, .details-column-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .details-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 24px;
          box-shadow: var(--shadow-card);
        }

        .card-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .section-card-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .info-kv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 24px;
        }

        .info-kv-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-key {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .info-val {
          font-size: 0.9375rem;
          color: var(--text-primary);
        }

        .info-val.bold {
          font-weight: 700;
        }

        .fluid-status-display-box {
          margin: 20px 0 16px;
          padding: 20px 24px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all var(--transition-normal);
        }

        .fluid-status-display-box.status-fluid-present {
          background-color: rgba(16, 185, 129, 0.12);
          border: 2px solid #10b981;
          box-shadow: 0 4px 18px rgba(16, 185, 129, 0.18);
        }

        .fluid-status-display-box.status-fluid-empty {
          background-color: rgba(239, 68, 68, 0.12);
          border: 2px solid #ef4444;
          box-shadow: 0 4px 22px rgba(239, 68, 68, 0.22);
          animation: fluidAlertPulse 1.8s infinite ease-in-out;
        }

        @keyframes fluidAlertPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
            border-color: #ef4444;
          }
          50% {
            box-shadow: 0 0 0 7px rgba(239, 68, 68, 0.15);
            border-color: #dc2626;
          }
        }

        .fluid-status-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }

        .status-fluid-present .fluid-status-icon {
          color: #10b981;
          flex-shrink: 0;
        }

        .status-fluid-empty .fluid-status-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .fluid-status-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1.2;
        }

        .status-fluid-present .fluid-status-text {
          color: #059669;
        }

        .status-fluid-empty .fluid-status-text {
          color: #dc2626;
        }

        @media (max-width: 600px) {
          .fluid-status-text {
            font-size: 1.2rem;
          }
          .fluid-status-display-box {
            padding: 16px 14px;
          }
        }

        .patient-notes-box {
          margin-top: 16px;
          background-color: var(--bg-secondary);
          padding: 12px 16px;
          border-radius: var(--radius-md);
        }

        .notes-heading {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }

        .notes-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .timeline-actions {
          display: flex;
          gap: 8px;
        }

        .timeline-feed {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .timeline-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .timeline-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .timeline-icon.red {
          background-color: var(--status-empty-bg);
          color: var(--status-empty);
        }

        .timeline-icon.amber {
          background-color: var(--status-low-bg);
          color: var(--status-low);
        }

        .timeline-icon.blue {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .timeline-content {
          flex: 1;
        }

        .timeline-item-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .timeline-item-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .timeline-time {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 4px;
          display: block;
        }

        /* Vitals Visual Grid (4 items) */
        .vitals-visual-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .vital-mini-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }

        .vital-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .vital-icon-center {
          height: 94px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signal-bars-large {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          height: 38px;
        }

        .bar-lg {
          width: 7px;
          background-color: var(--border-medium);
          border-radius: 3px;
        }

        .bar-lg.b1 { height: 10px; }
        .bar-lg.b2 { height: 18px; }
        .bar-lg.b3 { height: 26px; }
        .bar-lg.b4 { height: 36px; }

        .bar-lg.active {
          background-color: var(--primary);
        }

        .vital-metric {
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .vital-desc {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .sensor-visual-pill {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sensor-visual-pill.detected {
          background-color: var(--primary-light);
        }

        .sensor-visual-pill.dry {
          background-color: var(--status-empty-bg);
        }

        .ai-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .ai-metric-item {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ai-metric-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .ai-metric-val {
          font-size: 0.9375rem;
        }

        .ai-metric-sub {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .action-buttons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        @media (max-width: 1050px) {
          .details-grid-layout {
            grid-template-columns: 1fr;
          }
          .vitals-visual-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .ai-metrics-grid {
            grid-template-columns: 1fr;
          }
          .action-buttons-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
