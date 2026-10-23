import React, { useState, useEffect } from 'react';
import { X, UserPlus, ArrowRightLeft, HeartPulse } from 'lucide-react';
import { useIV } from '../context/IVContext';
import { sqliteService } from '../services/sqliteService';

export default function AssignPatientModal({ device, onClose }) {
  const { devices, assignPatient, transferPatient } = useIV();

  const [mode, setMode] = useState('new'); // 'new' or 'transfer'
  const [targetDevice, setTargetDevice] = useState(devices.find(d => d.id !== device.id)?.id || '');
  const [nurses, setNurses] = useState([]);

  useEffect(() => {
    let active = true;
    sqliteService.getNurses().then(list => {
      if (active && list && list.length > 0) {
        setNurses(list);
      }
    }).catch(err => console.warn('Could not load nurses:', err));
    return () => { active = false; };
  }, []);

  const fallbackNurses = [
    { username: 'nurse', name: 'Nurse Elena Rostova', department: 'ICU Ward 3 Bedside Care', badge: 'Duty Monitoring Nurse (ICU)' },
    { username: 'nurse2', name: 'Nurse Clara Higgins', department: 'Post-Op Recovery & Surgery', badge: 'Staff Registered Nurse (Surgery)' },
    { username: 'nurse3', name: 'Nurse Marcus Chen', department: 'Pediatric & Emergency Unit', badge: 'Trauma Care Nurse (ER)' }
  ];
  const nurseList = nurses.length > 0 ? nurses : fallbackNurses;

  const [patientData, setPatientData] = useState({
    name: '',
    age: '35',
    gender: 'Female',
    diagnosis: 'Acute Gastroenteritis',
    fluidType: 'Normal Saline 0.9% (500ml)',
    medicineName: 'None',
    flowRate: 75,
    totalVolume: 500,
    assignedNurse: device.assignedNurse || device.patient?.assignedNurse || 'nurse',
    assignedNurseName: device.assignedNurseName || device.patient?.assignedNurseName || 'Nurse Elena Rostova',
    notes: 'Prescribed by attending physician.'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'new') {
      const matched = nurseList.find(n => n.username === patientData.assignedNurse);
      assignPatient(device.id, {
        ...patientData,
        assignedNurse: patientData.assignedNurse,
        assignedNurseName: matched ? matched.name : (patientData.assignedNurseName || 'Nurse')
      });
    } else {
      transferPatient(device.id, targetDevice);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <UserPlus size={20} className="text-primary" />
            <h3 className="modal-title">Patient Management: {device.id}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`modal-tab ${mode === 'new' ? 'active' : ''}`}
            onClick={() => setMode('new')}
          >
            Assign New Patient
          </button>
          <button 
            className={`modal-tab ${mode === 'transfer' ? 'active' : ''}`}
            onClick={() => setMode('transfer')}
          >
            Transfer to Another Device
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          {mode === 'new' ? (
            <>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Patient Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    placeholder="e.g. Johnathan Smith"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={patientData.age}
                    onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select"
                    value={patientData.gender}
                    onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Assigned Duty Nurse Selection */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HeartPulse size={15} className="text-success" />
                  <span>Assigned Duty Nurse (Patient Responsibility) *</span>
                </label>
                <select 
                  className="form-select"
                  value={patientData.assignedNurse}
                  onChange={(e) => {
                    const uname = e.target.value;
                    const matched = nurseList.find(n => n.username === uname);
                    setPatientData({
                      ...patientData,
                      assignedNurse: uname,
                      assignedNurseName: matched ? matched.name : uname
                    });
                  }}
                >
                  {nurseList.map(n => (
                    <option key={n.username} value={n.username}>
                      {n.name} (@{n.username}) — {n.badge || n.department || 'Nurse'}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Critical IV alarms and telemetry will be routed exclusively to this assigned nurse's dashboard.
                </p>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">IV Fluid Solution</label>
                  <select 
                    className="form-select"
                    value={patientData.fluidType}
                    onChange={(e) => setPatientData({ ...patientData, fluidType: e.target.value })}
                  >
                    <option value="Normal Saline 0.9% (500ml)">Normal Saline 0.9% (500ml)</option>
                    <option value="Normal Saline 0.9% (1000ml)">Normal Saline 0.9% (1000ml)</option>
                    <option value="Ringer's Lactate (500ml)">Ringer's Lactate (500ml)</option>
                    <option value="Dextrose 5% in Water (500ml)">Dextrose 5% in Water (500ml)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Flow Rate (mL/hr)</label>
                  <input 
                    type="number" 
                    className="form-input mono"
                    value={patientData.flowRate}
                    onChange={(e) => setPatientData({ ...patientData, flowRate: Number(e.target.value) })}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="transfer-box">
              <p className="transfer-info">
                Transfer patient <strong>{device.patient?.name || 'Current Patient'}</strong> from <strong>{device.id}</strong> to:
              </p>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Destination IV Device</label>
                <select 
                  className="form-select"
                  value={targetDevice}
                  onChange={(e) => setTargetDevice(e.target.value)}
                >
                  {devices.filter(d => d.id !== device.id).map(d => (
                    <option key={d.id} value={d.id}>
                      {d.id} - Room {d.room}, Bed {d.bed} ({d.patient?.name ? `Occupied: ${d.patient.name}` : 'Vacant'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'new' ? 'Confirm Assignment' : 'Execute Patient Transfer'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .modal-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-subtle);
          padding: 0 24px;
        }
        .modal-tab {
          padding: 12px 18px;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
        }
        .modal-tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .modal-body-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr;
          gap: 14px;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 14px;
        }
        .transfer-box {
          padding: 16px;
          background-color: var(--bg-secondary);
          border-radius: var(--radius-md);
        }
        .transfer-info {
          font-size: 0.9375rem;
          color: var(--text-primary);
        }
        .modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 14px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }
        @media (max-width: 600px) {
          .form-grid-3, .form-grid-2 {
            grid-template-columns: 1fr;
          }
          .modal-header, .modal-tabs, .modal-body-form {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>
    </div>
  );
}
