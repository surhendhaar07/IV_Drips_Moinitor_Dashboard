import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, HeartPulse } from 'lucide-react';
import { useIV } from '../context/IVContext';
import { sqliteService } from '../services/sqliteService';

export default function EditDeviceModal({ device, onClose }) {
  const { updateDevice } = useIV();
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

  const [formData, setFormData] = useState({
    room: device.room || '301',
    bed: device.bed || '01',
    ward: device.ward || 'General Medical',
    patientName: device.patient?.name || '',
    patientAge: device.patient?.age || '40',
    patientGender: device.patient?.gender || 'Female',
    fluidType: device.patient?.fluidType || 'Normal Saline 0.9%',
    medicineName: device.patient?.medicineName || '',
    flowRate: device.patient?.flowRate || '75',
    notes: device.patient?.notes || '',
    assignedNurse: device.patient?.assignedNurse || device.assignedNurse || 'nurse',
    assignedNurseName: device.patient?.assignedNurseName || device.assignedNurseName || 'Nurse Elena Rostova'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const matched = nurseList.find(n => n.username === formData.assignedNurse);
    const assignedNurseName = matched ? matched.name : (formData.assignedNurseName || 'Nurse');
    updateDevice(device.id, {
      room: formData.room,
      bed: formData.bed,
      ward: formData.ward,
      assignedNurse: formData.assignedNurse,
      assignedNurseName,
      patient: {
        ...device.patient,
        name: formData.patientName,
        age: Number(formData.patientAge) || 40,
        gender: formData.patientGender,
        fluidType: formData.fluidType,
        medicineName: formData.medicineName,
        flowRate: Number(formData.flowRate) || 75,
        notes: formData.notes,
        assignedNurse: formData.assignedNurse,
        assignedNurseName
      }
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Edit3 size={20} className="text-primary" />
            <h3 className="modal-title">Edit Device: {device.id}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input 
                type="text" 
                name="room" 
                required 
                className="form-input" 
                value={formData.room} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bed Number</label>
              <input 
                type="text" 
                name="bed" 
                required 
                className="form-input" 
                value={formData.bed} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Patient Name</label>
              <input 
                type="text" 
                name="patientName" 
                className="form-input" 
                value={formData.patientName} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Flow Rate (mL/hr)</label>
              <input 
                type="number" 
                name="flowRate" 
                className="form-input mono" 
                value={formData.flowRate} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">IV Fluid Solution</label>
            <input 
              type="text" 
              name="fluidType" 
              className="form-input" 
              value={formData.fluidType} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Medicine Additive</label>
            <input 
              type="text" 
              name="medicineName" 
              className="form-input" 
              value={formData.medicineName} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HeartPulse size={15} className="text-success" />
              <span>Assigned Duty Nurse (Patient Responsibility)</span>
            </label>
            <select 
              name="assignedNurse"
              className="form-select"
              value={formData.assignedNurse}
              onChange={(e) => {
                const uname = e.target.value;
                const matched = nurseList.find(n => n.username === uname);
                setFormData(prev => ({
                  ...prev,
                  assignedNurse: uname,
                  assignedNurseName: matched ? matched.name : uname
                }));
              }}
            >
              {nurseList.map(n => (
                <option key={n.username} value={n.username}>
                  {n.name} (@{n.username}) — {n.badge || n.department || 'Nurse'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea 
              name="notes" 
              rows={2} 
              className="form-textarea" 
              value={formData.notes} 
              onChange={handleChange} 
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Changes
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
        }
        .modal-body-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 14px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
