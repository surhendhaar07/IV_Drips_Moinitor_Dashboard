import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  listenToFirebaseDevices, 
  listenToFirebaseAlerts, 
  pushDeviceUpdate, 
  pushAlert, 
  updateFirebaseAlert,
  setServoCommand,
  clearFirebaseAlerts,
  deleteFirebaseDevice
} from '../firebase';
import { soundService } from '../services/soundService';
import { sqliteService, DEFAULT_PATIENTS, DEFAULT_ROOMS, DEFAULT_HARDWARE } from '../services/sqliteService';
import { demoSimulationService, DEMO_DOCTOR_PROFILE } from '../services/demoSimulationService';

const IVContext = createContext(null);

export function IVProvider({ children }) {
  // Theme state: defaults to light as requested
  const [theme, setTheme] = useState(() => localStorage.getItem('iv_theme') || 'light');
  
  // Audio state
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('iv_muted') === 'true');
  
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('iv_user');
    const loggedIn = localStorage.getItem('iv_logged_in') === 'true';
    if (!loggedIn) return null;
    return saved ? JSON.parse(saved) : null;
  });

  // Doctor Demo Simulation State (completely isolated from Firebase)
  const [isDemoMode, setIsDemoMode] = useState(() => demoSimulationService.isDemoModeActive());
  const [demoDevices, setDemoDevices] = useState(() => demoSimulationService.getDemoDevices());
  const [demoAlerts, setDemoAlerts] = useState([]);

  const logout = () => {
    if (isDemoMode) {
      demoSimulationService.stopDemo();
      setIsDemoMode(false);
      setDemoDevices([]);
      setDemoAlerts([]);
    }
    localStorage.removeItem('iv_logged_in');
    localStorage.removeItem('iv_user');
    localStorage.removeItem('iv_demo_simulation_active');
    setCurrentUser(null);
  };

  const startDemoMode = useCallback(() => {
    demoSimulationService.startDemo();
    setIsDemoMode(true);
    setCurrentUser(DEMO_DOCTOR_PROFILE);
    localStorage.setItem('iv_user', JSON.stringify(DEMO_DOCTOR_PROFILE));
    localStorage.setItem('iv_logged_in', 'true');
  }, []);

  const exitDemoMode = useCallback(() => {
    demoSimulationService.stopDemo();
    setIsDemoMode(false);
    setDemoDevices([]);
    setDemoAlerts([]);
    soundService.stopAlarm();
    logout();
  }, []);

  // Devices state: strictly populated directly from Firebase Realtime Database
  const [devices, setDevices] = useState(() => {
    try {
      localStorage.removeItem('iv_devices');
    } catch (e) {}
    return [];
  });

  const [alerts, setAlerts] = useState(() => {
    try {
      localStorage.removeItem('iv_alerts');
    } catch (e) {}
    return [];
  });

  const [acknowledgedDeviceIds, setAcknowledgedDeviceIds] = useState(new Set());

  // UI state
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'patients', 'vitals', 'assigns', 'reports', 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'normal', 'low', 'empty', 'clamped', 'offline'
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [assigningDevice, setAssigningDevice] = useState(null);
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [sqliteMetadata, setSqliteMetadata] = useState({});

  // Initialize SQLite metadata for patients, rooms, doctors, and nurses
  useEffect(() => {
    let active = true;
    sqliteService.getAllDeviceMetadata().then(meta => {
      if (active && meta) {
        setSqliteMetadata(meta);
      }
    }).catch(err => console.warn('SQLite metadata init error:', err));
    return () => { active = false; };
  }, []);

  const [notificationsConfig, setNotificationsConfig] = useState(() => {
    const saved = localStorage.getItem('iv_notif_config');
    return saved ? JSON.parse(saved) : {
      sound: true,
      toast: true,
      popup: true,
      browser: false,
      email: false,
      sms: false
    };
  });

  // Sync theme to root HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('iv_theme', theme);
  }, [theme]);

  // Sync mute state to sound service
  useEffect(() => {
    soundService.setMuted(isMuted || !notificationsConfig.sound);
    localStorage.setItem('iv_muted', isMuted);
  }, [isMuted, notificationsConfig.sound]);

  // Toast notification helper
  const addToast = useCallback((title, message, type = 'info') => {
    if (!notificationsConfig.toast) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev.slice(-4), { id, title, message, type }]);
    soundService.playChime();
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, [notificationsConfig.toast]);

  // Subscribe to isolated demo simulation stream when demo mode is active
  useEffect(() => {
    if (!isDemoMode) {
      setDemoDevices([]);
      return;
    }

    const unsubDev = demoSimulationService.subscribe((devs) => {
      setDemoDevices([...devs]);
    });

    const unsubNotif = demoSimulationService.onNotification((title, message, type) => {
      addToast(title, message, type);
      if (type === 'critical') {
        soundService.startAlarm();
        setTimeout(() => soundService.stopAlarm(), 3200);
      }
    });

    const unsubAlert = demoSimulationService.onAlert((alertObj) => {
      setDemoAlerts(prev => [alertObj, ...prev]);
    });

    return () => {
      unsubDev();
      unsubNotif();
      unsubAlert();
    };
  }, [isDemoMode, addToast]);

  // Combine real devices with simulated devices when in Demo Mode
  const allDevices = useMemo(() => {
    if (isDemoMode && demoDevices.length > 0) {
      return [...demoDevices, ...devices];
    }
    return devices;
  }, [devices, demoDevices, isDemoMode]);

  const allAlerts = useMemo(() => {
    if (isDemoMode && demoAlerts.length > 0) {
      return [...demoAlerts, ...alerts];
    }
    return alerts;
  }, [alerts, demoAlerts, isDemoMode]);

  // Visible devices based on logged in user's role:
  // Nurses only see devices where the patient is assigned to them!
  // Doctors and Admins see all hospital devices.
  const visibleDevices = useMemo(() => {
    if (currentUser?.role === 'Nurse') {
      const uname = (currentUser.username || '').trim().toLowerCase();
      const name = (currentUser.name || '').trim().toLowerCase();
      const uid = (currentUser.id || '').trim().toLowerCase();
      return allDevices.filter(d => {
        const assigned = (d.assignedNurse || d.patient?.assignedNurse || '').trim().toLowerCase().replace(/^@/, '');
        const assignedName = (d.assignedNurseName || d.patient?.assignedNurseName || '').trim().toLowerCase();
        return (
          (uname && assigned === uname) || 
          (name && assigned === name) || 
          (name && assignedName === name) ||
          (uid && assigned === uid)
        );
      });
    }
    return allDevices;
  }, [allDevices, currentUser]);

  // Visible alerts based on role:
  // Nurses only see and receive alerts for their assigned devices/patients!
  const visibleAlerts = useMemo(() => {
    if (currentUser?.role === 'Nurse') {
      const visibleDeviceIds = new Set(visibleDevices.map(d => d.id));
      const uname = (currentUser.username || '').trim().toLowerCase();
      const name = (currentUser.name || '').trim().toLowerCase();
      return allAlerts.filter(a => {
        if (a.deviceId && visibleDeviceIds.has(a.deviceId)) return true;
        if (a.assignedNurse) {
          const assigned = a.assignedNurse.trim().toLowerCase().replace(/^@/, '');
          return (uname && assigned === uname) || (name && assigned === name);
        }
        if (a.assignedNurseName) {
          const assignedName = a.assignedNurseName.trim().toLowerCase();
          return name && assignedName === name;
        }
        return false;
      });
    }
    return allAlerts;
  }, [allAlerts, visibleDevices, currentUser]);

  // Check for critical unacknowledged alerts to sound alarm:
  // For nurses, alarm sounds ONLY for their assigned patients!
  // Sounds when any unacknowledged critical alert exists OR when any assigned patient's line is empty/clamped
  const unacknowledgedCritical = useMemo(() => {
    const hasUnackAlert = visibleAlerts.some(
      a => !a.acknowledged && (a.severity === 'critical' || a.type === 'empty')
    );
    const hasEmptyBed = visibleDevices.some(
      d => d.status !== 'offline' && 
           (d.status === 'empty' || d.level === 0 || !d.liquidPresent) &&
           !acknowledgedDeviceIds.has(d.id)
    );
    return hasUnackAlert || hasEmptyBed;
  }, [visibleAlerts, visibleDevices, acknowledgedDeviceIds]);

  useEffect(() => {
    if (unacknowledgedCritical && !isMuted && notificationsConfig.sound) {
      soundService.startAlarm();
    } else {
      soundService.stopAlarm();
    }
  }, [unacknowledgedCritical, isMuted, notificationsConfig.sound]);

  // Firebase Realtime Database Listener integration: Single Source of Truth
  useEffect(() => {
    let unsubscribeDevices = () => {};
    let unsubscribeAlerts = () => {};

    try {
      unsubscribeDevices = listenToFirebaseDevices(
        (data) => {
          if (data && typeof data === 'object') {
            setFirebaseConnected(true);
            setDevices(prevDevices => {
              const deviceIds = Object.keys(data);
              return deviceIds.map(id => {
                const fbDev = data[id] || {};
                const existing = prevDevices.find(d => d.id === id);

                const liquidPresent = fbDev.liquidPresent !== undefined 
                  ? Boolean(fbDev.liquidPresent) 
                  : (fbDev.level !== undefined ? (Number(fbDev.level) > 0) : true);

                const battery = typeof fbDev.battery === 'number' ? fbDev.battery : 0;
                const fbLastSeen = fbDev.lastSeen ?? fbDev.lastseen ?? fbDev.last_seen;
                
                // Strictly use details stored in Firebase RTDB as single source of truth
                const hasTelemetry = fbDev.battery !== undefined || fbDev.level !== undefined || fbDev.status !== undefined;
                const isHardware = Boolean(fbDev.wifiDbm !== undefined || fbDev.lastSeen || id === 'IV-DEVICE-001');

                // Read status & flowStatus directly from Firebase - OFFLINE by default!
                let effectiveLastSeen = existing?.lastSeen || 0;
                if (fbLastSeen !== undefined && fbLastSeen !== null) {
                  const numLastSeen = Number(fbLastSeen);
                  if (!isNaN(numLastSeen) && numLastSeen > 0) {
                    if (numLastSeen > 100000000000) {
                      effectiveLastSeen = numLastSeen;
                    } else if (numLastSeen > 1000000000) {
                      effectiveLastSeen = numLastSeen * 1000;
                    } else {
                      // ESP8266 relative uptime in millis()
                      if (existing && existing.rawFbLastSeen !== fbLastSeen) {
                        effectiveLastSeen = Date.now();
                      }
                    }
                  }
                }

                // Device is recently active only if a heartbeat was received within the last 20 seconds
                const isRecentlyActive = effectiveLastSeen > 0 && (Date.now() - effectiveLastSeen) <= 20000;

                // OFFLINE by default unless actively transmitting or explicitly set in Firebase with recent heartbeat
                let resolvedStatus = 'offline';
                let resolvedFlowStatus = 'offline';

                if (fbDev.status === 'offline') {
                  resolvedStatus = 'offline';
                  resolvedFlowStatus = 'offline';
                } else if (isRecentlyActive && fbDev.status && fbDev.status !== 'offline') {
                  resolvedStatus = fbDev.status;
                  resolvedFlowStatus = fbDev.flowStatus || (fbDev.servoCommand === 'CLAMP' ? 'clamped' : 'open');
                } else if (isRecentlyActive) {
                  resolvedStatus = liquidPresent ? (battery < 20 ? 'low' : 'normal') : 'empty';
                  resolvedFlowStatus = fbDev.flowStatus || (fbDev.servoCommand === 'CLAMP' ? 'clamped' : 'open');
                } else {
                  resolvedStatus = 'offline';
                  resolvedFlowStatus = 'offline';
                }

                // Periodically snapshot live telemetry into SQLite telemetry_history table
                sqliteService.recordTelemetrySnapshot(id, {
                  level: typeof fbDev.level === 'number' ? fbDev.level : (liquidPresent ? 100 : 0),
                  battery,
                  status: resolvedStatus,
                  flowStatus: resolvedFlowStatus
                });

                // Retrieve rich clinical metadata stored in SQLite (fallback to registered defaults)
                const defaultPat = DEFAULT_PATIENTS.find(pat => pat.device_id === id) || DEFAULT_PATIENTS[0];
                const defaultRoom = DEFAULT_ROOMS.find(rm => rm.device_id === id) || DEFAULT_ROOMS[0];
                const defaultHw = DEFAULT_HARDWARE.find(hw => hw.device_id === id) || DEFAULT_HARDWARE[0];

                const meta = sqliteMetadata[id] || {};
                const p = meta.patient || {};
                const assignedNurse = meta.assignedNurse || p.assignedNurse || defaultPat.assigned_nurse;
                const assignedNurseName = meta.assignedNurseName || p.assignedNurseName || defaultPat.assigned_nurse_name;
                const room = meta.room || defaultRoom.room_number;
                const bed = meta.bed || defaultRoom.bed_number;
                const ward = meta.ward || defaultRoom.ward;
                const doctor = meta.attending_doctor || p.attending_doctor || defaultPat.attending_doctor;

                return {
                  id,
                  isHardware,
                  rawFbLastSeen: fbLastSeen,
                  level: typeof fbDev.level === 'number' ? fbDev.level : (liquidPresent ? 100 : 0),
                  battery,
                  status: resolvedStatus,
                  flowStatus: resolvedFlowStatus,
                  servoAngle: fbDev.servoAngle || (resolvedFlowStatus === 'clamped' || fbDev.servoCommand === 'CLAMP' ? 90 : 120),
                  servoCommand: fbDev.servoCommand || (resolvedFlowStatus === 'clamped' ? 'CLAMP' : 'OPEN'),
                  liquidPresent,
                  lastSeen: effectiveLastSeen,
                  room,
                  bed,
                  ward,
                  signal: fbDev.signal || 4,
                  wifiDbm: fbDev.wifiDbm || -65,
                  attending_doctor: doctor,
                  assignedNurse,
                  assignedNurseName,
                  patient: {
                    name: p.name || defaultPat.name,
                    age: p.age ?? defaultPat.age,
                    gender: p.gender || defaultPat.gender,
                    diagnosis: p.diagnosis || defaultPat.diagnosis,
                    fluidType: p.fluidType || p.fluid_type || defaultPat.fluid_type,
                    medicineName: p.medicineName || p.medicine_name || defaultPat.medicine_name,
                    flowRate: p.flowRate ?? p.flow_rate ?? defaultPat.flow_rate,
                    startTime: p.startTime || p.start_time || defaultPat.start_time,
                    totalVolume: p.totalVolume ?? p.total_volume ?? defaultPat.total_volume,
                    remainingVolume: p.remainingVolume ?? p.remaining_volume ?? defaultPat.remaining_volume,
                    notes: p.notes || defaultPat.notes,
                    attending_doctor: doctor,
                    assignedNurse,
                    assignedNurseName
                  },
                  hardware: meta.hardware || {
                    stepUp: defaultHw.step_up || "MT3608 5.0V Active",
                    charger: defaultHw.charger || "TP4056 Normal",
                    sensor: defaultHw.sensor || "XKC-Y25 Non-contact Liquid Sensor",
                    servo: defaultHw.servo || "SG90 Micro Servo (90° / 120°)",
                    mcu: defaultHw.mcu || "ESP8266 NodeMCU v3"
                  }
                };
              });
            });
          }
        },
        (err) => {
          console.warn('Firebase devices sync note:', err.message);
          setFirebaseConnected(false);
        }
      );

      unsubscribeAlerts = listenToFirebaseAlerts(
        (data) => {
          if (data && typeof data === 'object') {
            const fbAlerts = Object.keys(data).map(key => {
              const a = data[key] || {};
              return {
                id: key,
                deviceId: a.deviceId,
                type: a.type || 'empty',
                severity: a.severity || (a.type === 'empty' ? 'critical' : 'warning'),
                title: a.title || (a.type === 'empty' ? `LINE EMPTY: ${a.deviceId}` : 'Alert'),
                message: a.message || `No liquid available! Drip empty alert triggered in Room ${a.room || ''}, Bed ${a.bed || ''}.`,
                room: a.room,
                bed: a.bed,
                level: a.level,
                battery: a.battery,
                timestamp: a.timestamp || Number(key),
                acknowledged: Boolean(a.acknowledged)
              };
            }).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
            setAlerts(fbAlerts);
          } else {
            setAlerts([]);
          }
        },
        (err) => {
          console.warn('Firebase alerts sync note:', err.message);
        }
      );
    } catch (e) {
      console.warn('Firebase subscribe catch:', e);
    }

    return () => {
      unsubscribeDevices();
      unsubscribeAlerts();
    };
  }, []);

  // Keep devices synchronized when SQLite clinical metadata loads or changes
  useEffect(() => {
    if (!sqliteMetadata || Object.keys(sqliteMetadata).length === 0) return;
    setDevices(prevDevices => prevDevices.map(d => {
      const meta = sqliteMetadata[d.id];
      if (!meta) return d;
      const p = meta.patient || {};
      const assignedNurse = meta.assignedNurse || p.assignedNurse || d.assignedNurse;
      const assignedNurseName = meta.assignedNurseName || p.assignedNurseName || d.assignedNurseName;
      return {
        ...d,
        room: meta.room || d.room,
        bed: meta.bed || d.bed,
        ward: meta.ward || d.ward,
        attending_doctor: meta.attending_doctor || d.attending_doctor,
        assignedNurse,
        assignedNurseName,
        patient: {
          ...d.patient,
          name: p.name || d.patient?.name,
          age: p.age ?? d.patient?.age,
          gender: p.gender || d.patient?.gender,
          diagnosis: p.diagnosis || d.patient?.diagnosis,
          fluidType: p.fluidType || p.fluid_type || d.patient?.fluidType,
          medicineName: p.medicineName || p.medicine_name || d.patient?.medicineName,
          flowRate: p.flowRate ?? p.flow_rate ?? d.patient?.flowRate,
          startTime: p.startTime || p.start_time || d.patient?.startTime,
          totalVolume: p.totalVolume ?? p.total_volume ?? d.patient?.totalVolume,
          remainingVolume: p.remainingVolume ?? p.remaining_volume ?? d.patient?.remainingVolume,
          notes: p.notes || d.patient?.notes,
          attending_doctor: meta.attending_doctor || d.attending_doctor,
          assignedNurse,
          assignedNurseName
        },
        hardware: meta.hardware || d.hardware
      };
    }));
  }, [sqliteMetadata]);

  // Periodic heartbeat checker: mark devices as OFFLINE if lastSeen does not update for > 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(d => {
        if (d.status === 'offline') return d;

        const lastSeenTime = d.lastSeen || 0;
        const diffSecs = (Date.now() - lastSeenTime) / 1000;
        if (diffSecs > 20) {
          return { 
            ...d, 
            status: 'offline',
            flowStatus: 'offline'
          };
        }
        return d;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const acknowledgeAlert = async (alertId) => {
    const targetAlert = allAlerts.find(a => a.id === alertId);
    if (targetAlert?.deviceId) {
      setAcknowledgedDeviceIds(prev => new Set([...prev, targetAlert.deviceId]));
    }
    if (isDemoMode && demoAlerts.some(a => a.id === alertId)) {
      setDemoAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      soundService.stopAlarm();
      return;
    }
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    await updateFirebaseAlert(alertId, { acknowledged: true });
    addToast('Alarm Acknowledged', 'Alert has been silenced and marked resolved.', 'info');
  };

  const acknowledgeAllAlerts = async () => {
    setAcknowledgedDeviceIds(new Set(visibleDevices.map(d => d.id)));
    if (isDemoMode) {
      setDemoAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    }
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    soundService.stopAlarm();
    for (const a of alerts) {
      if (!a.acknowledged) {
        await updateFirebaseAlert(a.id, { acknowledged: true });
      }
    }
    addToast('All Alarms Acknowledged', 'All active alarm notifications silenced.', 'info');
  };

  const clearAllAlerts = async () => {
    if (isDemoMode) {
      setDemoAlerts([]);
    }
    setAlerts([]);
    localStorage.removeItem('iv_alerts');
    soundService.stopAlarm();
    await clearFirebaseAlerts();
    addToast('Notifications Cleared', 'All clinical alert notifications have been cleared.', 'info');
  };

  const toggleClamp = async (deviceId) => {
    // If it's an isolated simulated demo device, route to demo simulation service
    if (isDemoMode && demoDevices.some(d => d.id === deviceId)) {
      const dev = demoDevices.find(d => d.id === deviceId);
      const newCmd = dev.flowStatus === 'clamped' ? 'OPEN' : 'CLAMP';
      demoSimulationService.handleServoCommand(deviceId, newCmd);
      return;
    }

    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;

    if (dev.status === 'offline') {
      addToast(
        'Device Offline',
        `Device ${deviceId} is offline. Hardware servo clamp cannot be controlled while disconnected.`,
        'warning'
      );
      return;
    }

    const newFlowStatus = dev.flowStatus === 'clamped' ? 'open' : 'clamped';
    const newServoAngle = newFlowStatus === 'clamped' ? 90 : 120;

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          flowStatus: newFlowStatus,
          servoAngle: newServoAngle
        };
      }
      return d;
    }));

    // Push command to Firebase for ESP8266
    await setServoCommand(deviceId, newFlowStatus === 'clamped' ? 'CLAMP' : 'OPEN');
    await pushDeviceUpdate(deviceId, { flowStatus: newFlowStatus });

    addToast(
      'Flow Status Changed', 
      `${deviceId} servo valve set to ${newFlowStatus.toUpperCase()} (${newServoAngle}°).`, 
      'info'
    );
  };

  const addDevice = async (deviceData) => {
    const newDevice = {
      id: deviceData.id || `IV-DEVICE-00${devices.length + 1}`,
      level: 100,
      battery: 100,
      status: 'offline',
      flowStatus: 'offline',
      liquidPresent: true,
      lastSeen: 0,
      room: deviceData.room || '301',
      bed: deviceData.bed || '01',
      ward: deviceData.ward || 'General Medical',
      signal: 4,
      wifiDbm: -60,
      sensorActive: true,
      servoAngle: 120,
      patient: {
        name: deviceData.patientName || 'Unassigned',
        age: Number(deviceData.patientAge) || 30,
        gender: deviceData.patientGender || 'Other',
        diagnosis: deviceData.diagnosis || 'Observation',
        fluidType: deviceData.fluidType || 'Normal Saline 0.9%',
        medicineName: deviceData.medicineName || 'None',
        flowRate: Number(deviceData.flowRate) || 75,
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalVolume: Number(deviceData.totalVolume) || 500,
        remainingVolume: Number(deviceData.totalVolume) || 500,
        notes: deviceData.notes || ''
      },
      hardware: {
        stepUp: 'MT3608 5.0V Active',
        charger: 'TP4056 Normal',
        sensor: 'XKC-Y25 Non-contact Liquid Sensor'
      }
    };

    // Save clinical & room metadata in SQLite
    await sqliteService.saveDeviceMetadata(newDevice.id, {
      patient: newDevice.patient,
      room: newDevice.room,
      bed: newDevice.bed,
      ward: newDevice.ward,
      attending_doctor: newDevice.patient.attending_doctor || 'Dr. Sarah Jenkins',
      assignedNurse: newDevice.patient.assignedNurse || 'nurse',
      assignedNurseName: newDevice.patient.assignedNurseName || 'Nurse Elena Rostova',
      hardware: newDevice.hardware
    }, currentUser?.name || 'Medical Staff');

    setSqliteMetadata(prev => ({
      ...prev,
      [newDevice.id]: {
        room: newDevice.room,
        bed: newDevice.bed,
        ward: newDevice.ward,
        attending_doctor: newDevice.patient.attending_doctor || 'Dr. Sarah Jenkins',
        assignedNurse: newDevice.patient.assignedNurse || 'nurse',
        assignedNurseName: newDevice.patient.assignedNurseName || 'Nurse Elena Rostova',
        patient: newDevice.patient,
        hardware: newDevice.hardware
      }
    }));

    setDevices(prev => [newDevice, ...prev]);

    // Push ONLY the 8 essential IoT variables to Firebase RTDB (offline by default until hardware connects)
    await pushDeviceUpdate(newDevice.id, {
      battery: newDevice.battery,
      flowStatus: 'offline',
      lastSeen: 0,
      level: newDevice.level,
      liquidPresent: false,
      servoAngle: 120,
      servoCommand: 'OPEN',
      status: 'offline'
    });

    addToast('Device Added', `${newDevice.id} registered (clinical details in SQLite, IoT telemetry in Firebase).`, 'success');
  };

  const updateDevice = async (deviceId, updatedData) => {
    // Save metadata in SQLite
    await sqliteService.saveDeviceMetadata(deviceId, updatedData, currentUser?.name || 'Medical Staff');
    setSqliteMetadata(prev => ({
      ...prev,
      [deviceId]: {
        ...(prev[deviceId] || {}),
        ...updatedData
      }
    }));

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        const assignedNurse = updatedData.assignedNurse || updatedData.patient?.assignedNurse || d.assignedNurse;
        const assignedNurseName = updatedData.assignedNurseName || updatedData.patient?.assignedNurseName || d.assignedNurseName;
        return {
          ...d,
          ...updatedData,
          assignedNurse,
          assignedNurseName,
          patient: {
            ...d.patient,
            ...(updatedData.patient || {}),
            assignedNurse,
            assignedNurseName
          }
        };
      }
      return d;
    }));

    addToast('SQLite Updated', `${deviceId} clinical details saved to SQLite database.`, 'info');
  };

  const deleteDevice = async (deviceId) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    if (selectedDeviceId === deviceId) {
      setSelectedDeviceId(null);
    }
    await deleteFirebaseDevice(deviceId);
    addToast('Device Removed', `${deviceId} has been decommissioned.`, 'warning');
  };

  const assignPatient = async (deviceId, patientData) => {
    const assignedNurse = patientData.assignedNurse || 'nurse';
    const assignedNurseName = patientData.assignedNurseName || 'Nurse Elena Rostova';
    const updatedPatient = {
      ...patientData,
      assignedNurse,
      assignedNurseName
    };

    // Save metadata directly to SQLite
    await sqliteService.saveDeviceMetadata(deviceId, {
      patient: updatedPatient,
      assignedNurse,
      assignedNurseName,
      room: patientData.room,
      bed: patientData.bed,
      ward: patientData.ward
    }, currentUser?.name || 'Physician');

    setSqliteMetadata(prev => ({
      ...prev,
      [deviceId]: {
        ...(prev[deviceId] || {}),
        patient: updatedPatient,
        assignedNurse,
        assignedNurseName
      }
    }));

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          assignedNurse,
          assignedNurseName,
          patient: {
            ...d.patient,
            ...updatedPatient
          }
        };
      }
      return d;
    }));

    addToast(
      'Patient Assigned', 
      `Patient ${patientData.name} saved to SQLite and assigned to ${deviceId} (Nurse: ${assignedNurseName}).`, 
      'success'
    );
  };

  const transferPatient = async (fromDeviceId, toDeviceId) => {
    const sourceDev = devices.find(d => d.id === fromDeviceId);
    if (!sourceDev) return;

    const emptyPatient = {
      name: "Unassigned",
      age: 0,
      gender: "--",
      diagnosis: "--",
      fluidType: "--",
      medicineName: "None",
      flowRate: 0,
      startTime: "--",
      totalVolume: 500,
      remainingVolume: 0,
      notes: "Patient transferred."
    };

    // Update SQLite for both devices
    await sqliteService.saveDeviceMetadata(toDeviceId, {
      patient: sourceDev.patient,
      assignedNurse: sourceDev.assignedNurse,
      assignedNurseName: sourceDev.assignedNurseName
    }, currentUser?.name || 'Medical Staff');

    await sqliteService.saveDeviceMetadata(fromDeviceId, {
      patient: emptyPatient
    }, currentUser?.name || 'Medical Staff');

    setDevices(prev => prev.map(d => {
      if (d.id === toDeviceId) {
        return {
          ...d,
          patient: { ...sourceDev.patient }
        };
      }
      if (d.id === fromDeviceId) {
        return {
          ...d,
          patient: emptyPatient
        };
      }
      return d;
    }));

    addToast('Patient Transferred', `Transferred patient from ${fromDeviceId} to ${toDeviceId} via SQLite.`, 'success');
  };

  // Live Hardware Simulation (simulates ESP8266 events like liquid empty, battery drop, clamp latch)
  const simulateHardwareTelemetry = async (deviceId, { liquidPresent, battery, servoClamped }) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;

    const level = liquidPresent ? 100 : 0;
    const finalBattery = typeof battery === 'number' ? battery : dev.battery;
    let computedStatus = liquidPresent ? (finalBattery < 20 ? 'low' : 'normal') : 'empty';
    const isClamped = servoClamped || !liquidPresent;
    const flowStatus = isClamped ? 'clamped' : 'open';

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          level,
          battery: finalBattery,
          status: computedStatus,
          liquidPresent,
          flowStatus,
          servoAngle: isClamped ? 90 : 120,
          lastSeen: Date.now()
        };
      }
      return d;
    }));

    // Create alert if liquid became empty
    if (!liquidPresent) {
      const assignedNurse = dev.patient?.assignedNurse || dev.assignedNurse;
      const assignedNurseName = dev.patient?.assignedNurseName || dev.assignedNurseName;
      const newAlert = {
        id: `alert-${Date.now()}`,
        deviceId,
        assignedNurse,
        assignedNurseName,
        patientName: dev.patient?.name || 'Inpatient',
        room: dev.room,
        bed: dev.bed,
        type: 'empty',
        severity: 'critical',
        title: `LINE EMPTY: ${deviceId}`,
        message: `No liquid available! Drip empty alert triggered in Room ${dev.room}, Bed ${dev.bed}. Check immediately.`,
        level: 0,
        battery: finalBattery,
        timestamp: Date.now(),
        acknowledged: false
      };

      setAlerts(prev => [newAlert, ...prev]);

      // Only give toast and browser alert to the assigned nurse, or to Doctor/Admin
      const isNurse = currentUser?.role === 'Nurse';
      const isAssignedToThisNurse = !isNurse || (
        assignedNurse === currentUser.username ||
        assignedNurse === currentUser.name ||
        assignedNurseName === currentUser.name ||
        (currentUser.username && assignedNurse?.toLowerCase() === currentUser.username.toLowerCase())
      );

      if (isAssignedToThisNurse) {
        addToast('CRITICAL: IV Bag EMPTY!', `${deviceId} in Room ${dev.room} has run dry!`, 'critical');
        triggerBrowserNotification(`CRITICAL: ${deviceId} IV Line Empty`, `Room ${dev.room}, Bed ${dev.bed}`);
      }
      
      // Push to Firebase RTDB path matching ESP8266 firmware
      await pushAlert({
        type: "empty",
        deviceId,
        level: 0,
        battery: finalBattery,
        room: dev.room,
        bed: dev.bed
      });
    }

    // Push device telemetry update to Firebase (strictly essential 8 variables matching hardware & RTDB)
    await pushDeviceUpdate(deviceId, {
      level,
      battery: finalBattery,
      status: computedStatus,
      flowStatus,
      liquidPresent,
      servoAngle: isClamped ? 90 : 120,
      servoCommand: servoClamped ? 'CLAMP' : 'OPEN',
      lastSeen: Date.now()
    });
  };

  // Export Data as JSON or CSV
  const exportData = (format = 'json') => {
    const exportPayload = {
      exportTime: new Date().toISOString(),
      hospital: "St. Jude Memorial Hospital - IV Monitoring System",
      totalDevices: devices.length,
      devices,
      alerts
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IV_Drips_Data_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      const headers = ['Device ID', 'Room', 'Bed', 'Patient Name', 'Fluid Type', 'Battery %', 'Liquid Present', 'Flow Status', 'Status', 'Last Seen'];
      const rows = devices.map(d => [
        d.id,
        d.room,
        d.bed,
        `"${d.patient?.name || ''}"`,
        `"${d.patient?.fluidType || ''}"`,
        d.battery,
        d.liquidPresent ? 'YES' : 'NO',
        d.flowStatus,
        d.status,
        new Date(d.lastSeen).toLocaleTimeString()
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IV_Devices_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    addToast('Data Exported', `Successfully generated ${format.toUpperCase()} export.`, 'success');
  };

  // Computed summary counts (filtered to visible devices for nurses)
  const stats = useMemo(() => {
    const total = visibleDevices.length;
    let normal = 0, low = 0, empty = 0, offline = 0, clamped = 0;
    visibleDevices.forEach(d => {
      if (d.status === 'offline') offline++;
      else if (d.status === 'empty') empty++;
      else if (d.status === 'low') low++;
      else normal++;

      if (d.flowStatus === 'clamped') clamped++;
    });
    const unreadAlerts = visibleAlerts.filter(a => !a.acknowledged).length;
    return { total, normal, low, empty, offline, clamped, unreadAlerts };
  }, [visibleDevices, visibleAlerts]);

  // Selected device object
  const selectedDevice = useMemo(() => {
    return allDevices.find(d => d.id === selectedDeviceId) || null;
  }, [allDevices, selectedDeviceId]);

  // Filtered devices (based on visibleDevices for role security)
  const filteredDevices = useMemo(() => {
    return visibleDevices.filter(dev => {
      // Filter by status chip
      if (statusFilter !== 'all') {
        if (statusFilter === 'clamped') {
          if (dev.flowStatus !== 'clamped') return false;
        } else if (dev.status !== statusFilter) {
          return false;
        }
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = dev.id.toLowerCase().includes(q);
        const matchesPatient = dev.patient?.name?.toLowerCase().includes(q);
        const matchesRoom = dev.room?.toLowerCase().includes(q);
        const matchesBed = dev.bed?.toLowerCase().includes(q);
        const matchesFluid = dev.patient?.fluidType?.toLowerCase().includes(q);
        const matchesNurse = (dev.assignedNurseName || dev.assignedNurse || '').toLowerCase().includes(q);
        if (!matchesId && !matchesPatient && !matchesRoom && !matchesBed && !matchesFluid && !matchesNurse) {
          return false;
        }
      }
      return true;
    });
  }, [visibleDevices, statusFilter, searchQuery]);

  return (
    <IVContext.Provider value={{
      theme,
      toggleTheme,
      isMuted,
      toggleMute,
      currentUser,
      setCurrentUser,
      devices,
      visibleDevices,
      filteredDevices,
      selectedDeviceId,
      setSelectedDeviceId,
      selectedDevice,
      alerts,
      visibleAlerts,
      stats,
      currentView,
      setCurrentView,
      searchQuery,
      setSearchQuery,
      statusFilter,
      setStatusFilter,
      isNotificationOpen,
      setIsNotificationOpen,
      isAddDeviceOpen,
      setIsAddDeviceOpen,
      editingDevice,
      setEditingDevice,
      assigningDevice,
      setAssigningDevice,
      firebaseConnected,
      setFirebaseConnected,
      toasts,
      addToast,
      notificationsConfig,
      setNotificationsConfig,
      // Demo Simulation controls
      isDemoMode,
      startDemoMode,
      exitDemoMode,
      // actions
      acknowledgeAlert,
      acknowledgeAllAlerts,
      clearAllAlerts,
      toggleClamp,
      addDevice,
      updateDevice,
      deleteDevice,
      assignPatient,
      transferPatient,
      simulateHardwareTelemetry,
      exportData,
      logout
    }}>
      {children}
    </IVContext.Provider>
  );
}

export function useIV() {
  const context = useContext(IVContext);
  if (!context) {
    throw new Error('useIV must be used within an IVProvider');
  }
  return context;
}
