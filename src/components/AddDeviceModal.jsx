import React, { useState } from 'react';
import { X, Plus, Cpu, User, Droplet } from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function AddDeviceModal({ onClose }) {
  const { addDevice, devices } = useIV();

  const [formData, setFormData] = useState({
    id: `IV-DEVICE-00${devices.length + 1}`,
    room: '306',
    bed: '01',
    ward: 'ICU Ward 3',
    patientName: '',
    patientAge: '45',
    patientGender: 'Female',
    diagnosis: 'Post-operative Recovery',
    fluidType: 'Normal Saline 0.9% (500ml)',
    medicineName: 'None',
    flowRate: '75',
    totalVolume: '500',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addDevice(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Cpu size={20} className="text-primary" />
            <h3 className="modal-title">Register New IV Drip Device</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="form-section-title">Hardware Telemetry Config</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Device ID (ESP8266 Identifier) *</label>
              <input 
                type="text" 
                name="id" 
                required 
                className="form-input mono"
                value={formData.id} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hospital Ward</label>
              <select name="ward" className="form-select" value={formData.ward} onChange={handleChange}>
                <option value="ICU Ward 3">ICU Ward 3</option>
                <option value="General Medical">General Medical</option>
                <option value="Surgical Recovery">Surgical Recovery</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Maternity">Maternity</option>
                <option value="Emergency Trauma">Emergency Trauma</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Room Number *</label>
              <input 
                type="text" 
                name="room" 
                required 
                className="form-input"
                placeholder="e.g. 301" 
                value={formData.room} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bed Number *</label>
              <input 
                type="text" 
                name="bed" 
                required 
                className="form-input"
                placeholder="e.g. 01" 
                value={formData.bed} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: '14px' }}>Patient & Prescription Data</div>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Patient Full Name</label>
              <input 
                type="text" 
                name="patientName" 
                className="form-input"
                placeholder="e.g. Samantha Wright" 
                value={formData.patientName} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input 
                type="number" 
                name="patientAge" 
                className="form-input"
                value={formData.patientAge} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="patientGender" className="form-select" value={formData.patientGender} onChange={handleChange}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">IV Fluid Solution *</label>
              <select name="fluidType" className="form-select" value={formData.fluidType} onChange={handleChange}>
                <option value="Normal Saline 0.9% (500ml)">Normal Saline 0.9% (500ml)</option>
                <option value="Normal Saline 0.9% (1000ml)">Normal Saline 0.9% (1000ml)</option>
                <option value="Ringer's Lactate (500ml)">Ringer's Lactate (500ml)</option>
                <option value="Ringer's Lactate (1000ml)">Ringer's Lactate (1000ml)</option>
                <option value="Dextrose 5% in Water (500ml)">Dextrose 5% in Water (500ml)</option>
                <option value="Dextrose Normal Saline (DNS)">Dextrose Normal Saline (DNS)</option>
                <option value="Total Parenteral Nutrition (TPN)">Total Parenteral Nutrition (TPN)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Medicine Additive</label>
              <input 
                type="text" 
                name="medicineName" 
                className="form-input"
                placeholder="e.g. Potassium Chloride, Antibiotics" 
                value={formData.medicineName} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Flow Rate (mL / hour)</label>
              <input 
                type="number" 
                name="flowRate" 
                className="form-input mono"
                value={formData.flowRate} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Volume (mL)</label>
              <input 
                type="number" 
                name="totalVolume" 
                className="form-input mono"
                value={formData.totalVolume} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Notes / Precautions</label>
            <textarea 
              name="notes" 
              rows={2} 
              className="form-textarea"
              placeholder="e.g. Infusion rate checked by staff nurse..." 
              value={formData.notes} 
              onChange={handleChange} 
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Register & Sync Device
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
        }

        .modal-body-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 16px;
        }

        .modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }

        @media (max-width: 600px) {
          .form-grid-2, .form-grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
