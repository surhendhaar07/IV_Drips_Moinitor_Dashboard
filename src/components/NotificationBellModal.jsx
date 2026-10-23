import React from 'react';
import { 
  AlertTriangle, 
  X, 
  CheckCheck, 
  Bell, 
  Volume2, 
  ShieldCheck, 
  Clock,
  Trash2 
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function NotificationBellModal({ onClose }) {
  const { 
    visibleAlerts,
    alerts, 
    acknowledgeAlert, 
    acknowledgeAllAlerts, 
    clearAllAlerts,
    setSelectedDeviceId,
    currentUser 
  } = useIV();

  const currentAlerts = visibleAlerts || alerts;
  const isNurse = currentUser?.role === 'Nurse';

  const handleDeviceClick = (deviceId) => {
    setSelectedDeviceId(deviceId);
    onClose();
  };

  return (
    <div className="notification-dropdown-card">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-title-group">
          <Bell size={18} className="text-primary" />
          <div>
            <h4 className="notif-heading">Clinical Alerts</h4>
            {isNurse && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Roster: {currentUser.name}
              </span>
            )}
          </div>
        </div>
        <div className="notif-header-actions">
          {currentAlerts.length > 0 && (
            <button 
              className="notif-clear-text-btn"
              onClick={() => clearAllAlerts()}
              title="Clear all notifications"
            >
              Clear All
            </button>
          )}
          <button className="btn-icon notif-close-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="notif-body">
        {currentAlerts.length === 0 ? (
          <div className="empty-notif">
            <ShieldCheck size={32} className="text-success" />
            <p>{isNurse ? 'No active alarms for your assigned patients.' : 'All IV lines operating normally. No active alarms.'}</p>
          </div>
        ) : (
          <div className="notif-list">
            {currentAlerts.slice(0, 8).map((alert) => {
              const isCrit = alert.severity === 'critical' || alert.type === 'empty';
              return (
                <div 
                  key={alert.id}
                  className={`notif-item ${isCrit ? 'critical' : ''} ${alert.acknowledged ? 'acknowledged' : ''}`}
                  onClick={() => alert.deviceId && handleDeviceClick(alert.deviceId)}
                >
                  <div className="notif-item-icon">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="notif-item-info">
                    <div className="notif-item-title">
                      {alert.title || "LINE Empty Line"}
                    </div>
                    <div className="notif-item-desc">
                      {alert.message || "Empty empty line alerts"}
                    </div>
                    <div className="notif-item-meta mono">
                      {alert.deviceId} • Room {alert.room || '301'}
                    </div>
                  </div>
                  <button 
                    className="notif-dismiss-btn"
                    title="Acknowledge this alert"
                    onClick={(e) => {
                      e.stopPropagation();
                      acknowledgeAlert(alert.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with "Clear All" & "Acknowledge All" Buttons */}
      <div className="notif-footer">
        <button 
          className="btn btn-secondary clear-all-btn"
          onClick={() => clearAllAlerts()}
          disabled={currentAlerts.length === 0}
          title="Clear and remove all notifications"
        >
          <Trash2 size={15} />
          <span>Clear All</span>
        </button>
        <button 
          className="btn btn-danger-outline acknowledge-btn"
          onClick={() => {
            acknowledgeAllAlerts();
            onClose();
          }}
          disabled={currentAlerts.length === 0}
          title="Silence all active alarms"
        >
          <CheckCheck size={16} />
          <span>Acknowledge All</span>
        </button>
      </div>

      <style>{`
        .notification-dropdown-card {
          position: absolute;
          right: 28px;
          top: 72px;
          width: 360px;
          background-color: var(--bg-modal);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-modal);
          z-index: 500;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .notif-header {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
        }

        .notif-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notif-heading {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .notif-close-btn {
          color: var(--text-muted);
          padding: 4px;
        }

        .notif-body {
          max-height: 380px;
          overflow-y: auto;
          padding: 12px;
        }

        .empty-notif {
          padding: 30px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.8125rem;
        }

        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .notif-item:hover {
          background-color: var(--bg-surface-hover);
          border-color: var(--border-medium);
        }

        .notif-item.critical {
          background-color: var(--status-empty-bg);
          border-color: var(--status-empty-border);
        }

        .notif-item.acknowledged {
          opacity: 0.55;
        }

        .notif-item-icon {
          color: var(--status-empty);
          margin-top: 2px;
        }

        .notif-item-info {
          flex: 1;
          min-width: 0;
        }

        .notif-item-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .notif-item-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .notif-item-meta {
          font-size: 0.6875rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .notif-dismiss-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
        }

        .notif-dismiss-btn:hover {
          color: var(--text-primary);
        }

        .notif-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .notif-clear-text-btn {
          background: transparent;
          border: none;
          color: var(--status-empty);
          font-size: 0.775rem;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .notif-clear-text-btn:hover {
          background-color: var(--status-empty-bg);
          text-decoration: underline;
        }

        .notif-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-subtle);
          background-color: var(--bg-secondary);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clear-all-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .acknowledge-btn {
          flex: 1.2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px;
          font-size: 0.8125rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
