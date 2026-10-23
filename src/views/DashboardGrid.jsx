import React, { useState } from 'react';
import { 
  Plus, 
  Cpu, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Radio, 
  Sparkles,
  Download
} from 'lucide-react';
import { useIV } from '../context/IVContext';
import DeviceCard from '../components/DeviceCard';
import HardwareSimulatorPanel from '../components/HardwareSimulatorPanel';

export default function DashboardGrid() {
  const { 
    filteredDevices, 
    stats, 
    statusFilter, 
    setStatusFilter, 
    setIsAddDeviceOpen,
    searchQuery,
    setSearchQuery,
    exportData,
    currentUser 
  } = useIV();

  const [showSimulator, setShowSimulator] = useState(false);

  const filterTabs = [
    { id: 'all', label: 'All Devices', count: stats.total },
    { id: 'normal', label: 'Normal', count: stats.normal, dot: 'normal' },
    { id: 'low', label: 'Low', count: stats.low, dot: 'low' },
    { id: 'empty', label: 'Line Empty', count: stats.empty, dot: 'empty' },
    { id: 'clamped', label: 'Clamped', count: stats.clamped },
    { id: 'offline', label: 'Offline', count: stats.offline, dot: 'offline' },
  ];

  return (
    <div className="dashboard-grid-view">
      {/* View Header */}
      <div className="grid-header-row">
        <div>
          <h1 className="grid-main-heading">
            {currentUser.role === 'Nurse' ? `Duty Nurse Bedside Dashboard` : `Dashboard Device Grid`}
          </h1>
          <p className="grid-subheading">
            {currentUser.role === 'Nurse' 
              ? `Monitoring active infusions assigned exclusively to ${currentUser.name}`
              : `Live telemetry feed synchronized with ESP8266 optical sensors & Firebase Realtime Database`}
          </p>
        </div>

        <div className="grid-header-actions">
          {/* Hardware simulator toggle - Doctor & Admin only */}
          {(currentUser.role === 'Doctor' || currentUser.role === 'Administrator') && (
            <button 
              className={`btn ${showSimulator ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowSimulator(!showSimulator)}
              title="Simulate ESP8266 Sensor Pins & Servo Telemetry"
            >
              <Cpu size={16} />
              <span>ESP8266 Hardware Simulator</span>
            </button>
          )}

          {/* Export Data */}
          <button 
            className="btn btn-secondary"
            onClick={() => exportData('csv')}
            title="Export CSV summary"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {/* Add Device - Doctor / Admin only */}
          {currentUser.role !== 'Nurse' && (
            <button 
              className="btn btn-primary"
              onClick={() => setIsAddDeviceOpen(true)}
            >
              <Plus size={16} />
              <span>Add Device</span>
            </button>
          )}
        </div>
      </div>


      {/* Hardware Simulator Panel (Expandable) - Doctor & Admin only */}
      {(currentUser.role === 'Doctor' || currentUser.role === 'Administrator') && showSimulator && (
        <div className="simulator-drawer-wrap">
          <HardwareSimulatorPanel onClose={() => setShowSimulator(false)} />
        </div>
      )}

      {/* Filter Tabs & Quick Stats Bar */}
      <div className="filter-tabs-bar">
        <div className="tabs-container">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                className={`filter-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.dot && <span className={`pulse-dot ${tab.dot}`}></span>}
                <span className="tab-label">{tab.label}</span>
                <span className="tab-badge mono">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Real-time sync badge */}
        <div className="sync-badge-capsule">
          <Radio size={14} className="text-success animate-pulse" />
          <span className="sync-text mono">Realtime Stream Active</span>
        </div>
      </div>

      {/* Main Devices Grid */}
      {filteredDevices.length === 0 ? (
        <div className="empty-search-state">
          <AlertTriangle size={36} className="text-muted" />
          <h3>No IV Devices found</h3>
          <p>No devices match filter "{statusFilter}" or search "{searchQuery}".</p>
          <button 
            className="btn btn-secondary" 
            onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="devices-grid">
          {filteredDevices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}

      <style>{`
        .dashboard-grid-view {
          display: flex;
          flex-direction: column;
          gap: 22px;
          animation: fadeIn 0.25s ease-out;
        }

        .grid-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .grid-main-heading {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .grid-subheading {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .grid-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .simulator-drawer-wrap {
          animation: modalSlideUp 0.25s ease-out;
        }

        .filter-tabs-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .tabs-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-tab-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background-color: var(--bg-surface);
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .filter-tab-pill:hover {
          background-color: var(--bg-surface-hover);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }

        .filter-tab-pill.active {
          background-color: var(--primary);
          border-color: var(--primary);
          color: #ffffff;
          box-shadow: 0 2px 8px var(--primary-glow);
        }

        .tab-badge {
          background-color: rgba(0, 0, 0, 0.08);
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .filter-tab-pill.active .tab-badge {
          background-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        .sync-badge-capsule {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background-color: var(--bg-secondary);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
          white-space: nowrap;
        }

        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .empty-search-state {
          background-color: var(--bg-surface);
          border: 2px dashed var(--border-medium);
          border-radius: var(--radius-xl);
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }

        @media (max-width: 900px) {
          .grid-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .grid-header-actions {
            width: 100%;
            flex-wrap: wrap;
          }
          .devices-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
