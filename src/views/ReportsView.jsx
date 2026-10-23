import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  BatteryMedium,
  Users,
  Activity
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function ReportsView() {
  const { devices, alerts, exportData, addToast } = useIV();
  const [activeReportTab, setActiveReportTab] = useState('daily');

  const reportCategories = [
    { id: 'daily', title: 'Daily Report', subtitle: '24-hour ward infusion and alert audit', period: 'Today' },
    { id: 'weekly', title: 'Weekly Report', subtitle: '7-day compliance and occlusion statistics', period: 'Past 7 Days' },
    { id: 'monthly', title: 'Monthly Report', subtitle: 'Clinical equipment utilization and fluid audits', period: 'June 2026' },
    { id: 'patient', title: 'Patient Report', subtitle: 'Individual prescribed medications and volume infused', period: 'Active Patients' },
    { id: 'alert', title: 'Alert Report', subtitle: 'Empty line detections and alarm acknowledgement latency', period: 'Incident Logs' },
    { id: 'device', title: 'Device Report', subtitle: 'ESP8266 uptime, WiFi RSSI and hardware health', period: 'Telemetry Status' },
    { id: 'battery', title: 'Battery Report', subtitle: 'TP4056 charge cycles and low-power logs', period: 'Power Diagnostics' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (reportTitle) => {
    exportData('csv');
    addToast('Report Downloaded', `${reportTitle} exported successfully to CSV.`, 'success');
  };

  return (
    <div className="reports-view">
      <div className="reports-header no-print">
        <div>
          <h1 className="reports-title">Hospital Reports & Clinical Audits</h1>
          <p className="reports-sub">
            Generate, download, and print official regulatory reports for IV administration
          </p>
        </div>

        <div className="reports-header-actions">
          <button className="btn btn-secondary" onClick={() => exportData('json')}>
            <Download size={16} /> Export JSON Data
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Official Report
          </button>
        </div>
      </div>

      {/* Reports Grid matching the mockup card list */}
      <div className="reports-layout-grid">
        <div className="reports-list-column no-print">
          <h3 className="column-title">Available Automated Reports</h3>
          <div className="reports-cards-container">
            {reportCategories.map(cat => (
              <div 
                key={cat.id} 
                className={`report-download-card ${activeReportTab === cat.id ? 'active' : ''}`}
                onClick={() => setActiveReportTab(cat.id)}
              >
                <div className="report-icon-box">
                  <FileText size={20} className="text-primary" />
                </div>
                <div className="report-details">
                  <div className="report-name-row">
                    <span className="report-card-name">{cat.title}</span>
                    <span className="report-period-tag mono">{cat.period}</span>
                  </div>
                  <span className="report-card-sub">{cat.subtitle}</span>
                </div>
                <div className="report-action-icons" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="btn-icon" 
                    title={`Download ${cat.title}`}
                    onClick={() => handleDownload(cat.title)}
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    className="btn-icon" 
                    title={`Print ${cat.title}`}
                    onClick={handlePrint}
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Analytics Capsule from Mobile View in Mockup */}
          <div className="ai-stats-capsule">
            <div className="ai-capsule-head">
              <Sparkles size={16} className="text-primary" />
              <span className="ai-capsule-title">AI Analytics Overview</span>
            </div>
            <div className="ai-capsule-row">
              <span className="ai-capsule-label">Monitored Telemetry</span>
              <span className="ai-capsule-val mono">13.21 metrics/s</span>
            </div>
            <div className="ai-capsule-row">
              <span className="ai-capsule-label">Active Period</span>
              <span className="ai-capsule-val mono">69 hours online</span>
            </div>
            <div className="ai-capsule-row">
              <span className="ai-capsule-label">Alert Silence Latency</span>
              <span className="ai-capsule-val mono">38 seconds avg</span>
            </div>
          </div>
        </div>

        {/* Printable Preview Document Column */}
        <div className="report-preview-column">
          <div className="clinical-report-document">
            {/* Header with Hospital Information */}
            <div className="document-header">
              <div className="doc-hospital-info">
                <div className="doc-logo-title">
                  <Activity size={24} className="text-primary" />
                  <h2>ST. JUDE MEMORIAL HOSPITAL</h2>
                </div>
                <p className="doc-subtitle">Department of Inpatient Infusion & Critical Care Telemetry</p>
                <p className="doc-meta-line mono">
                  Report Generated: {new Date().toLocaleString()} • Report Type: {activeReportTab.toUpperCase()}
                </p>
              </div>
              <div className="doc-status-stamp">
                <span className="stamp-text">VERIFIED</span>
              </div>
            </div>

            <div className="doc-divider"></div>

            {/* Ward Summary Metrics */}
            <div className="doc-stats-bar">
              <div className="doc-stat-unit">
                <span className="unit-label">Active IV Units</span>
                <span className="unit-val mono bold">{devices.length}</span>
              </div>
              <div className="doc-stat-unit">
                <span className="unit-label">Normal Infusions</span>
                <span className="unit-val mono bold text-success">
                  {devices.filter(d => d.status === 'normal').length}
                </span>
              </div>
              <div className="doc-stat-unit">
                <span className="unit-label">Line Empty Alerts</span>
                <span className="unit-val mono bold text-danger">
                  {devices.filter(d => d.status === 'empty').length}
                </span>
              </div>
              <div className="doc-stat-unit">
                <span className="unit-label">Servo Clamp Latches</span>
                <span className="unit-val mono bold text-clamped">
                  {devices.filter(d => d.flowStatus === 'clamped').length}
                </span>
              </div>
            </div>

            {/* Detailed Table */}
            <h4 className="doc-section-heading">Detailed Device Audit Log</h4>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Patient</th>
                  <th>Location</th>
                  <th>Fluid Prescribed</th>
                  <th>Battery</th>
                  <th>Flow</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td className="mono bold">{d.id}</td>
                    <td>{d.patient?.name || 'Unassigned'}</td>
                    <td className="mono">Room {d.room}, Bed {d.bed}</td>
                    <td>{d.patient?.fluidType || 'Normal Saline'}</td>
                    <td className="mono">{d.battery}%</td>
                    <td className="mono">{d.flowStatus.toUpperCase()}</td>
                    <td>
                      <span className={`badge ${d.status === 'empty' ? 'badge-empty' : 'badge-normal'}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="doc-signature-row">
              <div className="sig-block">
                <div className="sig-line"></div>
                <span className="sig-label">Supervising Physician / Doctor</span>
              </div>
              <div className="sig-block">
                <div className="sig-line"></div>
                <span className="sig-label">Hospital Quality & Safety Officer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .reports-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn 0.25s ease-out;
        }

        .reports-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .reports-title {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .reports-sub {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .reports-header-actions {
          display: flex;
          gap: 10px;
        }

        .reports-layout-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
        }

        .column-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .reports-cards-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .report-download-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .report-download-card:hover {
          border-color: var(--border-focus);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .report-download-card.active {
          border-color: var(--primary);
          background-color: var(--bg-surface);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }

        .report-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background-color: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .report-details {
          flex: 1;
          min-width: 0;
        }

        .report-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .report-card-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .report-period-tag {
          font-size: 0.6875rem;
          background-color: var(--bg-secondary);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-muted);
        }

        .report-card-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
          display: block;
        }

        .report-action-icons {
          display: flex;
          gap: 4px;
        }

        .ai-stats-capsule {
          margin-top: 20px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ai-capsule-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-capsule-title {
          font-size: 0.8125rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .ai-capsule-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          padding: 4px 0;
          border-bottom: 1px dashed var(--border-subtle);
        }

        .ai-capsule-row:last-child {
          border-bottom: none;
        }

        .ai-capsule-label {
          color: var(--text-muted);
        }

        .ai-capsule-val {
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Printable Document Sheet */
        .clinical-report-document {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 36px 40px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .doc-logo-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .doc-logo-title h2 {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .doc-subtitle {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .doc-meta-line {
          font-size: 0.72rem;
          color: var(--text-secondary);
          margin-top: 6px;
        }

        .doc-status-stamp {
          border: 2px solid var(--status-normal);
          color: var(--status-normal);
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.875rem;
          transform: rotate(-3deg);
        }

        .doc-divider {
          height: 2px;
          background-color: var(--border-subtle);
        }

        .doc-stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background-color: var(--bg-secondary);
          padding: 14px;
          border-radius: var(--radius-md);
        }

        .doc-stat-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .unit-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .unit-val {
          font-size: 1.25rem;
        }

        .doc-section-heading {
          font-size: 1rem;
          font-weight: 700;
          margin-top: 8px;
        }

        .doc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }

        .doc-table th {
          border-bottom: 2px solid var(--border-medium);
          padding: 10px 8px;
          text-align: left;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .doc-table td {
          border-bottom: 1px solid var(--border-subtle);
          padding: 10px 8px;
        }

        .doc-signature-row {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }

        .sig-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 220px;
        }

        .sig-line {
          width: 100%;
          border-bottom: 1px solid var(--text-muted);
          margin-bottom: 8px;
        }

        .sig-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .reports-layout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
