import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Volume2, 
  Mail, 
  MessageSquare, 
  Globe, 
  Database, 
  Cpu, 
  Save, 
  Check, 
  RefreshCw,
  ShieldCheck 
} from 'lucide-react';
import { useIV } from '../context/IVContext';
import { soundService } from '../services/soundService';

export default function SettingsView() {
  const { 
    notificationsConfig, 
    setNotificationsConfig, 
    firebaseConnected, 
    addToast 
  } = useIV();

  const [emailEnabled, setEmailEnabled] = useState(notificationsConfig.email || false);
  const [smsEnabled, setSmsEnabled] = useState(notificationsConfig.sms || false);
  const [soundEnabled, setSoundEnabled] = useState(notificationsConfig.sound !== false);
  const [toastEnabled, setToastEnabled] = useState(notificationsConfig.toast !== false);
  const [browserEnabled, setBrowserEnabled] = useState(notificationsConfig.browser || false);

  const [emailAddress, setEmailAddress] = useState('head.nurse@hospital.org');
  const [smsPhone, setSmsPhone] = useState('+1 (555) 349-2041');

  // Firebase Config
  const [firebaseDbUrl, setFirebaseDbUrl] = useState(() => {
    return localStorage.getItem('iv_custom_rtdb_url') || import.meta.env.VITE_FIREBASE_DATABASE_URL || '';
  });

  const handleTestSound = () => {
    soundService.startAlarm();
    setTimeout(() => soundService.stopAlarm(), 1600);
    addToast('Alarm Sound Test', 'Playing simulated hospital bedside beeper tone.', 'info');
  };

  const handleRequestBrowserPerms = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setBrowserEnabled(true);
        addToast('Notifications Enabled', 'Browser push notifications granted.', 'success');
      } else {
        setBrowserEnabled(false);
        addToast('Permission Denied', 'Browser notification permission was not granted.', 'warning');
      }
    } else {
      addToast('Not Supported', 'HTML5 Notifications not supported in this browser.', 'warning');
    }
  };

  const handleSaveSettings = () => {
    const updated = {
      ...notificationsConfig,
      sound: soundEnabled,
      toast: toastEnabled,
      browser: browserEnabled,
      email: emailEnabled,
      sms: smsEnabled
    };
    setNotificationsConfig(updated);
    localStorage.setItem('iv_notif_config', JSON.stringify(updated));
    localStorage.setItem('iv_custom_rtdb_url', firebaseDbUrl);
    addToast('Settings Saved', 'System preferences and notification channels updated.', 'success');
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">System Settings & Configuration</h1>
          <p className="settings-sub">
            Notification channels, telemetry alarm thresholds, and Firebase RTDB parameters
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSaveSettings}>
          <Save size={16} /> Save All Settings
        </button>
      </div>

      <div className="settings-grid">
        {/* Notification Channels */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Bell size={20} className="text-primary" />
            <h3 className="settings-card-title">Alert & Notification Channels</h3>
          </div>

          <div className="settings-items-list">
            {/* Alarm Sound */}
            <div className="setting-toggle-row">
              <div className="setting-info">
                <span className="setting-name">Audio Alarm Sound (Web Audio Synthesizer)</span>
                <span className="setting-desc">Audible medical alarm beep during Line Empty or Critical Battery alerts</span>
              </div>
              <div className="toggle-right">
                <button className="btn btn-secondary btn-sm" onClick={handleTestSound}>
                  <Volume2 size={14} /> Test Beep
                </button>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
              </div>
            </div>

            {/* In-app Toast */}
            <div className="setting-toggle-row">
              <div className="setting-info">
                <span className="setting-name">In-App Toast Alerts</span>
                <span className="setting-desc">Realtime floating alerts when sensor states transition</span>
              </div>
              <input 
                type="checkbox" 
                className="switch-checkbox"
                checked={toastEnabled}
                onChange={(e) => setToastEnabled(e.target.checked)}
              />
            </div>

            {/* Browser Push Notifications */}
            <div className="setting-toggle-row">
              <div className="setting-info">
                <span className="setting-name">Browser Native Notifications</span>
                <span className="setting-desc">Desktop background notifications when tab is minimized</span>
              </div>
              <div className="toggle-right">
                {!browserEnabled && (
                  <button className="btn btn-secondary btn-sm" onClick={handleRequestBrowserPerms}>
                    Grant Perms
                  </button>
                )}
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={browserEnabled}
                  onChange={(e) => setBrowserEnabled(e.target.checked)}
                />
              </div>
            </div>

            {/* Email Notifications */}
            <div className="setting-toggle-row">
              <div className="setting-info">
                <span className="setting-name">Email Notifications</span>
                <span className="setting-desc">Dispatch urgent email to attending physician when IV empty</span>
              </div>
              <input 
                type="checkbox" 
                className="switch-checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
            </div>
            {emailEnabled && (
              <div className="setting-sub-input">
                <label className="form-label">Destination Medical Staff Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
            )}

            {/* SMS Notifications */}
            <div className="setting-toggle-row">
              <div className="setting-info">
                <span className="setting-name">SMS Critical Alerts</span>
                <span className="setting-desc">Send immediate SMS message via Twilio / Hospital GSM gateway</span>
              </div>
              <input 
                type="checkbox" 
                className="switch-checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
              />
            </div>
            {smsEnabled && (
              <div className="setting-sub-input">
                <label className="form-label">On-Duty Nurse Phone Number</label>
                <input 
                  type="tel" 
                  className="form-input mono" 
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Firebase Realtime Database Integration */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Database size={20} className="text-primary" />
            <h3 className="settings-card-title">Firebase Realtime Database Endpoint</h3>
          </div>

          <div className="settings-items-list">
            <div className="form-group">
              <label className="form-label">Database URL (from ESP8266 Firmware)</label>
              <input 
                type="text" 
                className="form-input mono"
                value={firebaseDbUrl}
                onChange={(e) => setFirebaseDbUrl(e.target.value)}
              />
              <span className="setting-desc" style={{ marginTop: '4px', display: 'block' }}>
                Default: <code>https://iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com</code>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">API Key</label>
              <input 
                type="password" 
                readOnly
                className="form-input mono text-muted"
                value="AIzaSyB9dzuwu5hOC2taDzYZlNKKOmaOJGQkWFY"
              />
            </div>

            <div className="hardware-spec-summary">
              <div className="spec-title">
                <Cpu size={16} className="text-primary" />
                <span>Firmware Hardware Stack Reference</span>
              </div>
              <ul className="spec-bullets mono">
                <li>Microcontroller: ESP8266 NodeMCU v3</li>
                <li>Sensor: XKC-Y25 Non-contact Optical Liquid Sensor (Pin D5)</li>
                <li>Actuator: SG90 Micro Servo (Pin D4: 90° Clamped / 120° Open)</li>
                <li>Audio: Active 5V Buzzer (Pin D6: Ticker Interrupt 200ms pulse / 250ms constant gap)</li>
                <li>Display: SSD1306 0.96" I2C OLED (SDA D1 / SCL D2)</li>
                <li>Power: 18650 Li-ion + TP4056 Charger + MT3608 Step-up to 5V</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .settings-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn 0.25s ease-out;
        }

        .settings-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .settings-title {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .settings-sub {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .settings-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 24px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .settings-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .settings-card-title {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .settings-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .setting-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .setting-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-width: 75%;
        }

        .setting-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .setting-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .toggle-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .switch-checkbox {
          width: 20px;
          height: 20px;
          accent-color: var(--primary);
          cursor: pointer;
        }

        .setting-sub-input {
          padding-left: 12px;
          margin-top: -6px;
        }

        .hardware-spec-summary {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 14px;
          margin-top: 10px;
        }

        .spec-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .spec-bullets {
          list-style: disc;
          padding-left: 20px;
          font-size: 0.72rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        @media (max-width: 950px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
