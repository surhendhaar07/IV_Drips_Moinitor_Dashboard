import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Droplet, 
  Activity, 
  ArrowRight, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  HeartPulse
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function PatientsView() {
  const { devices, setSelectedDeviceId, setAssigningDevice, currentUser } = useIV();
  const [searchTerm, setSearchTerm] = useState('');

  const isNurse = currentUser?.role === 'Nurse';
  const uname = (currentUser?.username || '').trim().toLowerCase();
  const name = (currentUser?.name || '').trim().toLowerCase();
  const uid = (currentUser?.id || '').trim().toLowerCase();

  const assignedDevices = devices.filter(d => {
    if (!d.patient || !d.patient.name || d.patient.name === 'Unassigned') return false;
    if (isNurse) {
      const assigned = (d.assignedNurse || d.patient?.assignedNurse || '').trim().toLowerCase().replace(/^@/, '');
      const assignedName = (d.assignedNurseName || d.patient?.assignedNurseName || '').trim().toLowerCase();
      return (
        (uname && assigned === uname) || 
        (name && assigned === name) || 
        (name && assignedName === name) ||
        (uid && assigned === uid)
      );
    }
    return true;
  });

  const filtered = assignedDevices.filter(d => {
    const q = searchTerm.toLowerCase();
    return (
      d.patient.name.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.room.toLowerCase().includes(q) ||
      d.bed.toLowerCase().includes(q) ||
      d.patient.fluidType.toLowerCase().includes(q) ||
      (d.assignedNurseName && d.assignedNurseName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="patients-view">
      <div className="patients-header">
        <div>
          <h1 className="patients-title">Active Inpatient Infusions</h1>
          <p className="patients-sub">
            Realtime bedside monitoring directory and infusion treatment tracking
          </p>
        </div>

        <div className="patients-search-box">
          <Search size={16} className="text-muted" />
          <input 
            type="text" 
            placeholder="Filter by patient name, room, or fluid..."
            className="patients-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isNurse && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8125rem',
          color: '#10b981'
        }}>
          <HeartPulse size={16} />
          <span>
            <strong>Nurse Duty Roster:</strong> Showing your {filtered.length} assigned inpatients ({currentUser.name}).
          </span>
        </div>
      )}

      <div className="patients-table-card">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Duty Nurse</th>
              <th>Location</th>
              <th>Assigned Device</th>
              <th>IV Fluid & Medicine</th>
              <th>Flow Rate</th>
              <th>Fluid Status</th>
              <th>State</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {isNurse 
                    ? `No patients currently assigned to you (${currentUser.name}). Attending physicians will assign patients to your roster.`
                    : 'No patients found matching your search.'}
                </td>
              </tr>
            ) : (
              filtered.map(device => {
                const isCrit = device.status === 'empty' || !device.liquidPresent;

                return (
                  <tr key={device.id} className={isCrit ? 'row-critical' : ''}>
                    <td>
                      <div className="patient-cell-name">
                        <div className="patient-name-bold">{device.patient.name}</div>
                        <div className="patient-meta-sub">
                          {device.patient.age} yrs • {device.patient.gender}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                        <HeartPulse size={13} />
                        <span>{device.patient.assignedNurseName || device.assignedNurseName || 'Assigned Nurse'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="location-cell mono">
                        <strong>Room {device.room}</strong>
                        <span className="bed-sub">Bed {device.bed} • {device.ward}</span>
                      </div>
                    </td>
                    <td>
                      <span className="device-id-badge mono">{device.id}</span>
                    </td>
                    <td>
                      <div className="fluid-cell">
                        <span className="fluid-name">{device.patient.fluidType}</span>
                        {device.patient.medicineName && device.patient.medicineName !== 'None' && (
                          <span className="medicine-tag">+{device.patient.medicineName}</span>
                        )}
                      </div>
                    </td>
                    <td className="mono bold">
                      {device.status === 'offline' ? (
                        <span className="text-offline">Offline (Servo Inactive)</span>
                      ) : device.flowStatus === 'clamped' ? (
                        <span className="text-clamped">0 mL/hr (Clamped)</span>
                      ) : (
                        `${device.patient.flowRate || 75} mL/hr`
                      )}
                    </td>
                    <td>
                      <div className="fluid-presence-cell">
                        <span className={`status-pill ${device.status === 'offline' ? 'offline' : (device.liquidPresent ? 'online' : 'reconnecting')}`} style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                          <span className={`pulse-dot ${device.status === 'offline' ? 'offline' : (device.liquidPresent ? 'normal' : 'empty')}`}></span>
                          {device.status === 'offline' ? 'Device Offline' : (device.liquidPresent ? 'Fluid Present' : 'No Fluid (Empty)')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${device.status === 'offline' ? 'badge-reconnecting' : (isCrit ? 'badge-empty' : 'badge-normal')}`}>
                        {device.status === 'offline' ? 'OFFLINE' : (isCrit ? 'LINE EMPTY' : 'INFUSING')}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedDeviceId(device.id)}
                      >
                        <span>Vitals</span>
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .patients-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeIn 0.25s ease-out;
        }

        .patients-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .patients-title {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .patients-sub {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .patients-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-full);
          width: 320px;
        }

        .patients-search-input {
          border: none;
          background: transparent;
          outline: none;
          font-family: inherit;
          font-size: 0.875rem;
          color: var(--text-primary);
          width: 100%;
        }

        .patients-table-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .patients-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .patients-table th {
          background-color: var(--bg-secondary);
          padding: 14px 18px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-subtle);
        }

        .patients-table td {
          padding: 16px 18px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.875rem;
          vertical-align: middle;
        }

        .patients-table tr:last-child td {
          border-bottom: none;
        }

        .patients-table tr:hover td {
          background-color: var(--bg-surface-hover);
        }

        .patients-table tr.row-critical td {
          background-color: var(--status-empty-bg);
        }

        .patient-name-bold {
          font-weight: 700;
          color: var(--text-primary);
        }

        .patient-meta-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .location-cell {
          display: flex;
          flex-direction: column;
        }

        .bed-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .device-id-badge {
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .fluid-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .fluid-name {
          font-weight: 600;
        }

        .medicine-tag {
          font-size: 0.72rem;
          color: var(--primary);
          font-weight: 700;
        }

        .vol-bar-cell {
          width: 140px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .vol-numbers {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .vol-track {
          height: 6px;
          background-color: var(--border-subtle);
          border-radius: 999px;
          overflow: hidden;
        }

        .vol-fill {
          height: 100%;
          background-color: var(--primary);
          border-radius: 999px;
        }

        .vol-fill.crit {
          background-color: var(--status-empty);
        }

        @media (max-width: 900px) {
          .patients-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .patients-search-box {
            width: 100%;
          }
          .patients-table-card {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
