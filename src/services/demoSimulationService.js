// =========================================================================
// Standalone Doctor & Bedside Telemetry Simulation Service
// =========================================================================
// NOTE: This module is completely self-contained and isolated.
// It generates simulated doctor telemetry without touching or interrupting
// live Firebase Realtime Database connections or physical hardware nodes.
// If you wish to remove demo mode in the future, you can safely delete this file.
// =========================================================================

export const DEMO_DOCTOR_PROFILE = {
  id: 'user-doc-sim-alex',
  name: 'Dr. Alex Chen, MD',
  username: 'doctor',
  email: 'dr.alex.chen@hospital.org',
  role: 'Doctor',
  department: 'Critical Care & Cardiology',
  badge: 'Attending Physician (Simulation Mode)',
  status: 'active',
  isDemo: true
};

const INITIAL_DEMO_DEVICES = [
  {
    id: 'SIM-ICU-01',
    isHardware: false,
    isDemo: true,
    level: 25, // Will drop into low (<20%) within ~15s and empty (0%) within ~75s
    battery: 88,
    status: 'normal',
    flowStatus: 'open',
    servoAngle: 120,
    servoCommand: 'OPEN',
    liquidPresent: true,
    lastSeen: Date.now(),
    room: '301',
    bed: '01',
    ward: 'ICU Ward 3',
    signal: 4,
    wifiDbm: -56,
    attending_doctor: 'Dr. Alex Chen, MD',
    assignedNurse: 'nurse',
    assignedNurseName: 'Nurse Elena Rostova',
    patient: {
      name: 'Eleanor Vance',
      age: 54,
      gender: 'Female',
      diagnosis: 'Post-CABG Hemodynamic Stabilization',
      fluidType: 'Normal Saline 0.9% (500ml)',
      medicineName: 'Potassium Chloride 20mEq',
      flowRate: 80,
      startTime: '08:30 AM',
      totalVolume: 500,
      remainingVolume: 125,
      notes: 'Continuous hemodynamic monitoring under Doctor Simulation.'
    },
    hardware: {
      charger: 'TP4056 Normal',
      sensor: 'XKC-Y26-V Non-contact Sensor (Simulated)',
      stepUp: 'MT3608 5.0V Active'
    }
  },
  {
    id: 'SIM-ICU-02',
    isHardware: false,
    isDemo: true,
    level: 18, // Starts already in LOW fluid status (<20%) to immediately demonstrate alerts!
    battery: 74,
    status: 'low',
    flowStatus: 'open',
    servoAngle: 120,
    servoCommand: 'OPEN',
    liquidPresent: true,
    lastSeen: Date.now(),
    room: '302',
    bed: '02',
    ward: 'ICU Ward 3',
    signal: 4,
    wifiDbm: -62,
    attending_doctor: 'Dr. Alex Chen, MD',
    assignedNurse: 'nurse',
    assignedNurseName: 'Nurse Elena Rostova',
    patient: {
      name: 'Liam Gallagher',
      age: 41,
      gender: 'Male',
      diagnosis: 'Acute Trauma Fluid Resuscitation',
      fluidType: 'Ringer\'s Lactate (500ml)',
      medicineName: 'Tranexamic Acid 1g IV',
      flowRate: 95,
      startTime: '09:15 AM',
      totalVolume: 500,
      remainingVolume: 90,
      notes: 'Urgent replacement needed when fluid drops below 10%.'
    },
    hardware: {
      charger: 'TP4056 Normal',
      sensor: 'XKC-Y26-V Non-contact Sensor (Simulated)',
      stepUp: 'MT3608 5.0V Active'
    }
  },
  {
    id: 'SIM-GEN-05',
    isHardware: false,
    isDemo: true,
    level: 85, // Steady normal device for contrast
    battery: 96,
    status: 'normal',
    flowStatus: 'open',
    servoAngle: 120,
    servoCommand: 'OPEN',
    liquidPresent: true,
    lastSeen: Date.now(),
    room: '205',
    bed: '05',
    ward: 'General Ward',
    signal: 3,
    wifiDbm: -68,
    attending_doctor: 'Dr. Alex Chen, MD',
    assignedNurse: 'nurse2',
    assignedNurseName: 'Nurse Clara Higgins',
    patient: {
      name: 'Sophia Patel',
      age: 29,
      gender: 'Female',
      diagnosis: 'Mild Dehydration & Electrolyte Therapy',
      fluidType: 'Dextrose 5% in Water (500ml)',
      medicineName: 'Multivitamin Infusion',
      flowRate: 60,
      startTime: '07:45 AM',
      totalVolume: 500,
      remainingVolume: 425,
      notes: 'Patient stable, routine IV drip maintenance.'
    },
    hardware: {
      charger: 'TP4056 Normal',
      sensor: 'XKC-Y26-V Non-contact Sensor (Simulated)',
      stepUp: 'MT3608 5.0V Active'
    }
  }
];

class DemoSimulationService {
  constructor() {
    this.isActive = localStorage.getItem('iv_demo_simulation_active') === 'true';
    this.devices = JSON.parse(JSON.stringify(INITIAL_DEMO_DEVICES));
    this.intervalId = null;
    this.subscribers = new Set();
    this.alertListeners = new Set();
    this.notificationListeners = new Set();
    this.notifiedLow = new Set();
    this.notifiedEmpty = new Set();

    if (this.isActive) {
      this.startSimulationLoop();
    }
  }

  isDemoModeActive() {
    return this.isActive;
  }

  getDemoDevices() {
    return this.isActive ? this.devices : [];
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getDemoDevices());
    return () => this.subscribers.delete(callback);
  }

  onAlert(callback) {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  onNotification(callback) {
    this.notificationListeners.add(callback);
    return () => this.notificationListeners.delete(callback);
  }

  notifySubscribers() {
    const list = this.getDemoDevices();
    this.subscribers.forEach(cb => {
      try {
        cb(list);
      } catch (err) {
        console.warn('Demo device subscriber error:', err);
      }
    });
  }

  dispatchNotification(title, message, type = 'info') {
    this.notificationListeners.forEach(cb => {
      try {
        cb(title, message, type);
      } catch (err) {
        console.warn('Demo notification dispatch error:', err);
      }
    });
  }

  dispatchAlert(alertObj) {
    this.alertListeners.forEach(cb => {
      try {
        cb(alertObj);
      } catch (err) {
        console.warn('Demo alert dispatch error:', err);
      }
    });
  }

  startDemo() {
    this.isActive = true;
    localStorage.setItem('iv_demo_simulation_active', 'true');
    this.devices = JSON.parse(JSON.stringify(INITIAL_DEMO_DEVICES));
    this.notifiedLow.clear();
    this.notifiedEmpty.clear();

    // Trigger initial notification for SIM-ICU-02 which starts at 18% (Low fluid)
    setTimeout(() => {
      this.dispatchNotification(
        '⚠️ Low Fluid Level Warning',
        'Bed 02 (Liam Gallagher) IV fluid level is at 18%. Attending nurse alerted for bag replacement.',
        'warning'
      );
      this.dispatchAlert({
        id: `demo-alert-${Date.now()}-01`,
        type: 'low',
        deviceId: 'SIM-ICU-02',
        level: 18,
        battery: 74,
        timestamp: Date.now(),
        acknowledged: false,
        isDemo: true,
        message: 'Saline level critical (<20%). Bottle replacement required.'
      });
      this.notifiedLow.add('SIM-ICU-02');
    }, 1200);

    this.startSimulationLoop();
    this.notifySubscribers();
  }

  stopDemo() {
    this.isActive = false;
    localStorage.removeItem('iv_demo_simulation_active');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.devices = [];
    this.notifiedLow.clear();
    this.notifiedEmpty.clear();
    this.notifySubscribers();
  }

  startSimulationLoop() {
    if (this.intervalId) clearInterval(this.intervalId);

    // Every 3 seconds: advance fluid drip simulation
    this.intervalId = setInterval(() => {
      if (!this.isActive) return;

      let changed = false;

      this.devices = this.devices.map(dev => {
        // If clamped or empty, flow has halted
        if (dev.flowStatus === 'clamped') {
          return { ...dev, lastSeen: Date.now() };
        }

        // Calculate level decrease based on bed
        let drop = 0;
        if (dev.id === 'SIM-ICU-02') {
          drop = 1; // Faster drop to reach empty soon
        } else if (dev.id === 'SIM-ICU-01') {
          drop = 1; // Drops from 25% into low (<20%)
        } else {
          drop = Math.random() < 0.4 ? 1 : 0; // Gentle drop for General Ward
        }

        const newLevel = Math.max(0, dev.level - drop);
        const liquidPresent = newLevel > 0;
        let newStatus = dev.status;
        let newFlowStatus = dev.flowStatus;
        let newServoAngle = dev.servoAngle;

        // Calculate remaining volume in mL
        const remVol = Math.max(0, Math.round((newLevel / 100) * dev.patient.totalVolume));

        // Check Low Fluid Level (< 20%)
        if (newLevel <= 20 && newLevel > 0) {
          newStatus = 'low';
          if (!this.notifiedLow.has(dev.id)) {
            this.notifiedLow.add(dev.id);
            this.dispatchNotification(
              '⚠️ Low Fluid Level Warning',
              `Bed ${dev.bed} (${dev.patient.name}) fluid level has dropped to ${newLevel}%. Bag replacement required soon.`,
              'warning'
            );
            this.dispatchAlert({
              id: `demo-alert-${Date.now()}-${dev.id}`,
              type: 'low',
              deviceId: dev.id,
              level: newLevel,
              battery: dev.battery,
              timestamp: Date.now(),
              acknowledged: false,
              isDemo: true,
              message: `Saline level low (${newLevel}%). Replacement needed.`
            });
          }
        }

        // Check Empty Level (0%) -> Autonomous Auto-Clamping Trigger!
        if (newLevel === 0) {
          newStatus = 'empty';
          newFlowStatus = 'clamped';
          newServoAngle = 90; // Actuate micro-servo to clamped 90°

          if (!this.notifiedEmpty.has(dev.id)) {
            this.notifiedEmpty.add(dev.id);
            this.dispatchNotification(
              '🚨 CRITICAL: IV Line Depleted!',
              `Bed ${dev.bed} (${dev.patient.name}) IV fluid is empty! Automatic servo clamp engaged (90°) to prevent air embolism.`,
              'critical'
            );
            this.dispatchAlert({
              id: `demo-alert-${Date.now()}-empty-${dev.id}`,
              type: 'empty',
              deviceId: dev.id,
              level: 0,
              battery: dev.battery,
              timestamp: Date.now(),
              acknowledged: false,
              isDemo: true,
              message: `IV bottle empty on Bed ${dev.bed}. Auto-clamp engaged.`
            });
          }
        }

        if (newLevel !== dev.level || newFlowStatus !== dev.flowStatus) {
          changed = true;
        }

        return {
          ...dev,
          level: newLevel,
          liquidPresent,
          status: newStatus,
          flowStatus: newFlowStatus,
          servoAngle: newServoAngle,
          lastSeen: Date.now(),
          patient: {
            ...dev.patient,
            remainingVolume: remVol
          }
        };
      });

      if (changed) {
        this.notifySubscribers();
      }
    }, 3000);
  }

  // Handle Doctor's manual remote command for simulated devices
  handleServoCommand(deviceId, command) {
    this.devices = this.devices.map(dev => {
      if (dev.id !== deviceId) return dev;

      if (command === 'CLAMP') {
        this.dispatchNotification(
          '🔒 Remote Valve Clamped',
          `Doctor remotely commanded servo clamp on Bed ${dev.bed} (${dev.patient.name}). Infusion paused.`,
          'info'
        );
        return {
          ...dev,
          flowStatus: 'clamped',
          servoAngle: 90,
          servoCommand: 'CLAMP',
          lastSeen: Date.now()
        };
      }

      if (command === 'OPEN') {
        // If fluid was empty, opening it simulates nurse replacing bottle with fresh bag!
        const isReplacingBag = dev.level === 0;
        const restoredLevel = isReplacingBag ? 100 : dev.level;
        const restoredStatus = restoredLevel > 20 ? 'normal' : (restoredLevel > 0 ? 'low' : 'empty');

        if (isReplacingBag) {
          this.notifiedEmpty.delete(dev.id);
          this.notifiedLow.delete(dev.id);
          this.dispatchNotification(
            '💧 Fresh IV Bag Hung (Fluid Restored)',
            `New 500ml bag hung on Bed ${dev.bed} (${dev.patient.name}). Valve opened to 120° and infusion resumed.`,
            'success'
          );
        } else {
          this.dispatchNotification(
            '🔓 Valve Opened',
            `Doctor opened IV valve on Bed ${dev.bed}. Infusion flowing normally.`,
            'info'
          );
        }

        return {
          ...dev,
          level: restoredLevel,
          liquidPresent: true,
          status: restoredStatus,
          flowStatus: 'open',
          servoAngle: 120,
          servoCommand: 'OPEN',
          lastSeen: Date.now(),
          patient: {
            ...dev.patient,
            remainingVolume: isReplacingBag ? dev.patient.totalVolume : dev.patient.remainingVolume
          }
        };
      }

      return dev;
    });

    this.notifySubscribers();
  }
}

export const demoSimulationService = new DemoSimulationService();
