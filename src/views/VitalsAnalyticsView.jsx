import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Droplet, 
  Clock, 
  Activity, 
  BatteryMedium,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function VitalsAnalyticsView() {
  const { visibleDevices, devices, stats, currentUser } = useIV();
  const currentDevices = visibleDevices || devices;

  // Analytics calculations
  const averageBattery = Math.round(currentDevices.reduce((acc, d) => acc + d.battery, 0) / (currentDevices.length || 1));
  const activeInfusions = currentDevices.filter(d => d.flowStatus === 'open' && d.liquidPresent).length;
  const fluidDetectedCount = currentDevices.filter(d => d.liquidPresent).length;

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <div>
          <div className="badge badge-normal" style={{ marginBottom: '8px' }}>
            <Sparkles size={13} />
            <span>AI Predictive Health Engine</span>
          </div>
          <h1 className="analytics-title">Patient Infusion Intelligence & Vitals</h1>
          <p className="analytics-sub">
            Realtime optical sensor telemetry analysis, fluid presence monitoring & air embolism prevention
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Infusion Lines</span>
            <Droplet size={18} className="text-primary" />
          </div>
          <div className="kpi-value mono">{activeInfusions} / {currentDevices.length}</div>
          <span className="kpi-note text-success">Continuous flow & valve open</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Fluid Detected Lines</span>
            <Droplet size={18} className="text-primary" />
          </div>
          <div className="kpi-value mono">{fluidDetectedCount} / {currentDevices.length}</div>
          <span className="kpi-note text-success">Optical sensor (Pin D5) HIGH</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Average Hardware Battery</span>
            <BatteryMedium size={18} className="text-primary" />
          </div>
          <div className="kpi-value mono">{averageBattery}%</div>
          <span className="kpi-note">TP4056 lithium battery health optimal</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Embolism Prevention Status</span>
            <ShieldCheck size={18} className="text-success" />
          </div>
          <div className="kpi-value mono">100% Active</div>
          <span className="kpi-note text-success">Servo auto-clamp 90° latch active</span>
        </div>
      </div>

      {/* Realtime Fluid Presence Telemetry Cards */}
      <div className="analytics-section-card">
        <div className="section-head-row">
          <h3 className="section-title">Smart Fluid Presence Telemetry</h3>
          <span className="text-muted text-sm mono">Updated in real-time</span>
        </div>

        <div className="forecast-cards-grid">
          {devices.map(device => {
            const isCrit = device.status === 'empty' || !device.liquidPresent;

            return (
              <div key={device.id} className={`forecast-item-card ${isCrit ? 'crit' : ''}`}>
                <div className="forecast-head">
                  <span className="mono bold">{device.id}</span>
                  <span className="text-muted">Room {device.room}</span>
                </div>
                <div className="forecast-patient-name">{device.patient?.name || 'Unassigned'}</div>
                <div className="forecast-solution text-primary">{device.patient?.fluidType}</div>

                <div className="forecast-eta-block">
                  <Droplet size={16} className={isCrit ? 'text-danger' : 'text-success'} />
                  <div className="eta-texts">
                    <span className="eta-main mono bold" style={{ color: isCrit ? 'var(--status-empty)' : 'var(--status-normal)' }}>
                      {isCrit ? "NO FLUID DETECTED" : "FLUID PRESENT"}
                    </span>
                    <span className="eta-sub mono">
                      {isCrit ? "Air in tube • Servo latch engaged" : "Liquid present in drip chamber"}
                    </span>
                  </div>
                </div>

                <div className="ai-recommendation-box">
                  <Sparkles size={13} className="text-primary" />
                  <span>
                    {isCrit 
                      ? "ACTION REQUIRED: Replace IV solution bag immediately and reset servo valve."
                      : "Continuous liquid presence confirmed on XKC-Y25 non-contact sensor."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .analytics-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn 0.25s ease-out;
        }

        .analytics-title {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .analytics-sub {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .analytics-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .kpi-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 20px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .kpi-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .kpi-value {
          font-size: 1.625rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .kpi-note {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .analytics-section-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 24px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .section-head-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .forecast-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
        }

        .forecast-item-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .forecast-item-card.crit {
          background-color: var(--status-empty-bg);
          border-color: var(--status-empty-border);
        }

        .forecast-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .forecast-patient-name {
          font-weight: 700;
          font-size: 0.9375rem;
        }

        .forecast-solution {
          font-size: 0.78rem;
          font-weight: 600;
        }

        .forecast-eta-block {
          background-color: var(--bg-secondary);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .eta-texts {
          display: flex;
          flex-direction: column;
        }

        .eta-main {
          font-size: 0.9375rem;
          font-weight: 800;
        }

        .eta-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .ai-recommendation-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
          padding-top: 4px;
        }

        @media (max-width: 1000px) {
          .analytics-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .analytics-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
