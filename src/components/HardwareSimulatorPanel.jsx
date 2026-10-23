import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Droplet, 
  Battery, 
  Radio, 
  Send, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  X,
  Play,
  Pause,
  Sliders
} from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function HardwareSimulatorPanel({ onClose }) {
  const { devices, simulateHardwareTelemetry, addToast } = useIV();
  const [selectedSimDevice, setSelectedSimDevice] = useState('IV-DEVICE-001');

  const currentDev = devices.find(d => d.id === selectedSimDevice) || devices[0];
  const isDevOffline = currentDev?.status === 'offline';

  const [liquidPresent, setLiquidPresent] = useState(currentDev ? currentDev.liquidPresent : true);
  const [batteryLevel, setBatteryLevel] = useState(currentDev ? currentDev.battery : 85);
  const [servoAngle, setServoAngle] = useState(currentDev ? currentDev.servoAngle || 120 : 120);
  const [countdown, setCountdown] = useState(60);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Sync controls when selected device changes
  useEffect(() => {
    if (currentDev) {
      setLiquidPresent(currentDev.liquidPresent);
      setBatteryLevel(currentDev.battery);
      setServoAngle(currentDev.flowStatus === 'clamped' ? 90 : 120);
    }
  }, [selectedSimDevice]);

  // Simulate the 60s latch timer from ESP8266 code
  useEffect(() => {
    let timer;
    if (!liquidPresent && servoAngle !== 90) {
      setIsCountingDown(true);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setServoAngle(90); // Auto-clamp after 60s
            setIsCountingDown(false);
            simulateHardwareTelemetry(selectedSimDevice, {
              liquidPresent: false,
              battery: batteryLevel,
              servoClamped: true
            });
            addToast('ESP8266 Auto-Clamp Engaged', `60s timer expired for ${selectedSimDevice}. Servo locked at 90°.`, 'critical');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsCountingDown(false);
      setCountdown(60);
    }
    return () => clearInterval(timer);
  }, [liquidPresent, servoAngle, selectedSimDevice]);

  const handleToggleLiquid = (present) => {
    setLiquidPresent(present);
    if (present) {
      setServoAngle(120); // Servo returns to open
      simulateHardwareTelemetry(selectedSimDevice, {
        liquidPresent: true,
        battery: batteryLevel,
        servoClamped: false
      });
      addToast('Fluid Detected (SensePin HIGH)', `${selectedSimDevice} non-contact sensor detected liquid. Buzzer silenced.`, 'success');
    } else {
      simulateHardwareTelemetry(selectedSimDevice, {
        liquidPresent: false,
        battery: batteryLevel,
        servoClamped: false
      });
    }
  };

  const handleTriggerInstantClamp = () => {
    setServoAngle(90);
    setIsCountingDown(false);
    simulateHardwareTelemetry(selectedSimDevice, {
      liquidPresent: false,
      battery: batteryLevel,
      servoClamped: true
    });
    addToast('Manual Clamp Latched', `${selectedSimDevice} servo commanded to 90°.`, 'warning');
  };

  const handleResetOpen = () => {
    setLiquidPresent(true);
    setServoAngle(120);
    setIsCountingDown(false);
    setCountdown(60);
    simulateHardwareTelemetry(selectedSimDevice, {
      liquidPresent: true,
      battery: batteryLevel,
      servoClamped: false
    });
    addToast('System Reset', `${selectedSimDevice} reset to normal flow (120°).`, 'info');
  };

  return (
    <div className="simulator-card">
      <div className="sim-header">
        <div className="sim-title-group">
          <Cpu size={19} className="text-primary" />
          <div>
            <h4 className="sim-title">ESP8266 + Sensors Live Telemetry Simulator</h4>
            <span className="sim-sub">Firmware logic testing & Firebase sync mirror</span>
          </div>
        </div>
        <button className="btn-icon sim-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="sim-grid">
        {/* Left Column: Device selection & Sensor controls */}
        <div className="sim-column">
          <div className="sim-field">
            <label className="sim-label">Target Hardware Device</label>
            <select 
              className="form-select sim-select"
              value={selectedSimDevice}
              onChange={(e) => setSelectedSimDevice(e.target.value)}
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.id} ({d.patient?.name || 'Unassigned'} - Room {d.room})
                </option>
              ))}
            </select>
          </div>

          {/* Liquid Level Sensor (D5 SensePin) */}
          <div className="sim-field">
            <label className="sim-label">Optical Non-contact Sensor (SensePin D5)</label>
            <div className="sim-btn-group">
              <button 
                className={`btn ${liquidPresent ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleToggleLiquid(true)}
              >
                <Droplet size={15} /> Liquid Present (HIGH)
              </button>
              <button 
                className={`btn ${!liquidPresent ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => handleToggleLiquid(false)}
              >
                <AlertTriangle size={15} /> Air / Empty (LOW)
              </button>
            </div>
          </div>

          {/* Battery ADC Slider (A0 analogRead) */}
          <div className="sim-field">
            <div className="sim-slider-label">
              <span className="sim-label">Battery Level (A0 ADC: 600-1023)</span>
              <span className="sim-val mono bold">{batteryLevel}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={batteryLevel}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBatteryLevel(val);
                simulateHardwareTelemetry(selectedSimDevice, {
                  liquidPresent,
                  battery: val,
                  servoClamped: servoAngle === 90
                });
              }}
              className="sim-range-slider"
            />
          </div>
        </div>

        {/* Middle Column: 60-Second Clamp Timer & Servo Angle */}
        <div className="sim-column">
          <div className="sim-status-box">
            <span className="sim-box-title">ESP8266 Auto-Clamp Protocol</span>
            <div className="timer-display mono">
              {isDevOffline ? (
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>OFFLINE: SERVO CANNOT BE CONTROLLED</span>
              ) : isCountingDown ? (
                <span className="text-danger">CLAMP DELAY: {countdown}s</span>
              ) : servoAngle === 90 ? (
                <span className="text-danger">CLAMP LATCHED (90°)</span>
              ) : (
                <span className="text-success">FLOW OPEN (120°)</span>
              )}
            </div>

            <div className="sim-sub-buttons">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={isDevOffline ? () => addToast('Device Offline', 'Target device is offline. Servo cannot be controlled.', 'warning') : handleTriggerInstantClamp}
                style={isDevOffline ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Trigger Instant Clamp (90°)
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={isDevOffline ? () => addToast('Device Offline', 'Target device is offline. Servo cannot be controlled.', 'warning') : handleResetOpen}
                style={isDevOffline ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <RotateCcw size={14} /> Reset Flow (120°)
              </button>
            </div>
          </div>

          {/* Firmware Pin States Indicator */}
          <div className="pins-grid mono">
            <div className="pin-item">
              <span className="pin-name">SensePin (D5):</span>
              <span className={`pin-state ${liquidPresent ? 'high' : 'low'}`}>
                {liquidPresent ? 'HIGH (1)' : 'LOW (0)'}
              </span>
            </div>
            <div className="pin-item">
              <span className="pin-name">BuzzerPin (D6):</span>
              <span className={`pin-state ${!liquidPresent && servoAngle !== 90 ? 'pulsing' : 'low'}`}>
                {!liquidPresent && servoAngle !== 90 ? 'BEEPING' : 'OFF'}
              </span>
            </div>
            <div className="pin-item">
              <span className="pin-name">ServoPin (D4):</span>
              <span className="pin-state high">{isDevOffline ? "OFFLINE" : `${servoAngle}°`}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated OLED Display (SSD1306 128x64) */}
        <div className="sim-column">
          <span className="sim-label">Physical OLED Display Preview (SSD1306 0x3C)</span>
          <div className="oled-screen-bezel">
            <div className="oled-display mono">
              <div className="oled-top-row">
                <span>Battery: {batteryLevel}%</span>
                <span>
                  {isDevOffline ? "OFFLINE" : (servoAngle === 90 ? "CLAMPED" : (!liquidPresent ? "WAITING" : "OPEN"))}
                </span>
              </div>
              <div className="oled-body-text">
                {liquidPresent ? (
                  <>
                    <div className="oled-large">IV Fluid</div>
                    <div className="oled-large">Detected</div>
                  </>
                ) : (
                  <>
                    <div className="oled-large alert">No Liquid</div>
                    <div className="oled-large alert">Available</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .simulator-card {
          background-color: var(--bg-surface);
          border: 2px solid var(--primary);
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sim-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
        }

        .sim-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sim-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .sim-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .sim-close-btn {
          color: var(--text-muted);
        }

        .sim-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.1fr;
          gap: 20px;
        }

        .sim-column {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sim-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sim-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .sim-btn-group {
          display: flex;
          gap: 8px;
        }

        .sim-btn-group .btn {
          flex: 1;
          padding: 8px 10px;
          font-size: 0.78rem;
        }

        .sim-slider-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sim-range-slider {
          width: 100%;
          accent-color: var(--primary);
        }

        .sim-status-box {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .sim-box-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .timer-display {
          font-size: 1.05rem;
          font-weight: 800;
        }

        .sim-sub-buttons {
          display: flex;
          gap: 6px;
        }

        .btn-sm {
          padding: 6px 10px;
          font-size: 0.75rem;
        }

        .pins-grid {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.75rem;
        }

        .pin-item {
          display: flex;
          justify-content: space-between;
        }

        .pin-name {
          color: var(--text-muted);
        }

        .pin-state.high {
          color: var(--status-normal);
          font-weight: 700;
        }

        .pin-state.low {
          color: var(--text-muted);
          font-weight: 700;
        }

        .pin-state.pulsing {
          color: var(--status-empty);
          font-weight: 800;
          animation: pulseCritical 0.8s infinite;
        }

        /* Simulated Physical OLED Screen (SSD1306) */
        .oled-screen-bezel {
          background-color: #1e293b;
          padding: 10px;
          border-radius: 8px;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);
        }

        .oled-display {
          background-color: #030712;
          color: #38bdf8;
          border-radius: 4px;
          height: 120px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid #1e3a5f;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }

        .oled-top-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          border-bottom: 1px dashed rgba(56, 189, 248, 0.4);
          padding-bottom: 4px;
        }

        .oled-body-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2px;
          margin: auto 0;
        }

        .oled-large {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .oled-large.alert {
          color: #f87171;
          animation: pulseCritical 1s infinite;
        }

        @media (max-width: 950px) {
          .sim-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
