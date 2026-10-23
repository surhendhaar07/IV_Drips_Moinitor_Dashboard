// SQLite Database Service powered by WebAssembly (sql.js)
// Real SQL tables, real SQL queries, persistent storage via IndexedDB/localStorage.
// Stores Doctors, Nurses, Rooms, Beds, Patients, Prescriptions, Hardware Profiles, and Telemetry History.

import initSqlJs from 'sql.js';

const DB_STORAGE_KEY = 'iv_telemetry_sqlite_db';
const USERS_BACKUP_KEY = 'iv_telemetry_users_json';
const METADATA_BACKUP_KEY = 'iv_telemetry_metadata_json';

// Seed staff profiles - Doctors, Nurses, Admins
export const DEFAULT_STAFF = [
  {
    id: 'user-admin-001',
    username: 'admin',
    password: 'password123',
    name: 'Director M. Vance',
    role: 'Administrator',
    department: 'Hospital Administration & Safety',
    email: 'admin@hospital.org',
    phone: '+1 (555) 019-2834',
    badge: 'Chief Hospital Admin',
    status: 'active',
    created_at: Date.now() - 30 * 86400000,
    last_login: Date.now() - 3600000
  },
  {
    id: 'user-doc-001',
    username: 'doctor',
    password: 'password123',
    name: 'Dr. Sarah Jenkins',
    role: 'Doctor',
    department: 'Cardiology & Intensive Care',
    email: 'doctor@hospital.org',
    phone: '+1 (555) 349-2041',
    badge: 'Lead Attending Physician',
    status: 'active',
    created_at: Date.now() - 20 * 86400000,
    last_login: Date.now() - 7200000
  },
  {
    id: 'user-doc-002',
    username: 'doctor2',
    password: 'password123',
    name: 'Dr. Alexander Hayes',
    role: 'Doctor',
    department: 'Emergency & Critical Care',
    email: 'alexander.hayes@hospital.org',
    phone: '+1 (555) 672-9912',
    badge: 'Senior Consultant Physician',
    status: 'active',
    created_at: Date.now() - 15 * 86400000,
    last_login: Date.now() - 4000000
  },
  {
    id: 'user-nurse-001',
    username: 'nurse',
    password: 'password123',
    name: 'Nurse Elena Rostova',
    role: 'Nurse',
    department: 'ICU Ward 3 Bedside Care',
    email: 'nurse.elena@hospital.org',
    phone: '+1 (555) 882-9104',
    badge: 'Duty Monitoring Nurse (ICU)',
    status: 'active',
    created_at: Date.now() - 10 * 86400000,
    last_login: Date.now() - 1800000
  },
  {
    id: 'user-nurse-002',
    username: 'nurse2',
    password: 'password123',
    name: 'Nurse Clara Higgins',
    role: 'Nurse',
    department: 'Post-Op Recovery & Surgery',
    email: 'clara.higgins@hospital.org',
    phone: '+1 (555) 431-8920',
    badge: 'Staff Registered Nurse (Surgery)',
    status: 'active',
    created_at: Date.now() - 8 * 86400000,
    last_login: Date.now() - 3600000
  },
  {
    id: 'user-nurse-003',
    username: 'nurse3',
    password: 'password123',
    name: 'Nurse Marcus Chen',
    role: 'Nurse',
    department: 'Pediatric & Emergency Unit',
    email: 'marcus.chen@hospital.org',
    phone: '+1 (555) 762-3491',
    badge: 'Trauma Care Nurse (ER)',
    status: 'active',
    created_at: Date.now() - 5 * 86400000,
    last_login: Date.now() - 5400000
  }
];

// Seed Hospital Rooms & Beds
export const DEFAULT_ROOMS = [
  { room_number: '301', bed_number: '01', ward: 'ICU Ward 3', device_id: 'IV-DEVICE-001', status: 'occupied' },
  { room_number: '302', bed_number: '02', ward: 'General Ward A', device_id: 'IV-DEVICE-002', status: 'occupied' },
  { room_number: '205', bed_number: '01', ward: 'Maternity Ward', device_id: 'IV-DEVICE-003', status: 'occupied' },
  { room_number: '108', bed_number: '03', ward: 'Cardiac Care Unit', device_id: 'IV-DEVICE-004', status: 'occupied' },
  { room_number: '412', bed_number: '01', ward: 'Surgical Recovery', device_id: 'IV-DEVICE-005', status: 'occupied' },
  { room_number: '305', bed_number: '02', ward: 'Emergency Observation', device_id: 'IV-DEVICE-006', status: 'occupied' }
];

// Seed Patients in SQLite
export const DEFAULT_PATIENTS = [
  {
    id: 'pat-001',
    device_id: 'IV-DEVICE-001',
    name: 'Jane Doe',
    age: 42,
    gender: 'Female',
    diagnosis: 'Post-operative Hydration',
    fluid_type: 'Normal Saline 0.9% (500ml)',
    medicine_name: 'Potassium Chloride 20mEq',
    flow_rate: 75,
    start_time: '08:30 AM',
    total_volume: 500,
    remaining_volume: 360,
    notes: 'Infusion running on schedule. Attached to NodeMCU ESP8266 live hardware unit.',
    attending_doctor: 'Dr. Sarah Jenkins',
    assigned_nurse: 'nurse',
    assigned_nurse_name: 'Nurse Elena Rostova',
    room: '301',
    bed: '01',
    ward: 'ICU Ward 3'
  },
  {
    id: 'pat-002',
    device_id: 'IV-DEVICE-002',
    name: 'Robert Chen',
    age: 58,
    gender: 'Male',
    diagnosis: 'Diabetic Ketoacidosis Rehydration',
    fluid_type: "Ringer's Lactate (1000ml)",
    medicine_name: 'Regular Insulin Infusion',
    flow_rate: 125,
    start_time: '09:00 AM',
    total_volume: 1000,
    remaining_volume: 720,
    notes: 'Hourly blood glucose monitoring required.',
    attending_doctor: 'Dr. Alexander Hayes',
    assigned_nurse: 'nurse',
    assigned_nurse_name: 'Nurse Elena Rostova',
    room: '302',
    bed: '02',
    ward: 'General Ward A'
  },
  {
    id: 'pat-003',
    device_id: 'IV-DEVICE-003',
    name: 'Eleanor Vance',
    age: 31,
    gender: 'Female',
    diagnosis: 'Hyperemesis Gravidarum',
    fluid_type: 'Dextrose 5% in 0.45% NaCl (1000ml)',
    medicine_name: 'Ondansetron 8mg',
    flow_rate: 100,
    start_time: '07:45 AM',
    total_volume: 1000,
    remaining_volume: 450,
    notes: 'Patient resting comfortably. Electrolytes normalized.',
    attending_doctor: 'Dr. Sarah Jenkins',
    assigned_nurse: 'nurse2',
    assigned_nurse_name: 'Nurse Clara Higgins',
    room: '205',
    bed: '01',
    ward: 'Maternity Ward'
  },
  {
    id: 'pat-004',
    device_id: 'IV-DEVICE-004',
    name: 'David Miller',
    age: 67,
    gender: 'Male',
    diagnosis: 'Congestive Heart Failure Exacerbation',
    fluid_type: 'Dextrose 5% in Water (250ml)',
    medicine_name: 'Furosemide Continuous Infusion',
    flow_rate: 20,
    start_time: '06:15 AM',
    total_volume: 250,
    remaining_volume: 140,
    notes: 'Strict fluid balance monitoring. Daily weight record.',
    attending_doctor: 'Dr. Alexander Hayes',
    assigned_nurse: 'nurse2',
    assigned_nurse_name: 'Nurse Clara Higgins',
    room: '108',
    bed: '03',
    ward: 'Cardiac Care Unit'
  },
  {
    id: 'pat-005',
    device_id: 'IV-DEVICE-005',
    name: 'Amina Al-Sayed',
    age: 24,
    gender: 'Female',
    diagnosis: 'Post-Appendectomy Antibiotic Therapy',
    fluid_type: 'Metronidazole 500mg IV (100ml)',
    medicine_name: 'Ceftriaxone 1g',
    flow_rate: 150,
    start_time: '10:15 AM',
    total_volume: 100,
    remaining_volume: 65,
    notes: 'IV course 2 of 3 today. Site clean without erythema.',
    attending_doctor: 'Dr. Sarah Jenkins',
    assigned_nurse: 'nurse3',
    assigned_nurse_name: 'Nurse Marcus Chen',
    room: '412',
    bed: '01',
    ward: 'Surgical Recovery'
  },
  {
    id: 'pat-006',
    device_id: 'IV-DEVICE-006',
    name: 'Marcus Aurelius',
    age: 49,
    gender: 'Male',
    diagnosis: 'Acute Gastroenteritis Rehydration',
    fluid_type: 'Plasma-Lyte A (1000ml)',
    medicine_name: 'Pantoprazole 40mg IV',
    flow_rate: 120,
    start_time: '11:00 AM',
    total_volume: 1000,
    remaining_volume: 20,
    notes: 'Drip nearing completion. Prepare replacement bag or transition to oral intake.',
    attending_doctor: 'Dr. Alexander Hayes',
    assigned_nurse: 'nurse3',
    assigned_nurse_name: 'Nurse Marcus Chen',
    room: '305',
    bed: '02',
    ward: 'Emergency Observation'
  }
];

// Seed Hardware Profiles in SQLite
export const DEFAULT_HARDWARE = [
  { device_id: 'IV-DEVICE-001', sensor: 'XKC-Y25 Non-contact Liquid Sensor', charger: 'TP4056 Normal', step_up: 'MT3608 5.0V Active', servo: 'SG90 Micro Servo (90° / 120°)', mcu: 'ESP8266 NodeMCU v3' },
  { device_id: 'IV-DEVICE-002', sensor: 'XKC-Y25 Non-contact Liquid Sensor', charger: 'TP4056 Normal', step_up: 'MT3608 5.0V Active', servo: 'SG90 Micro Servo (90° / 120°)', mcu: 'ESP8266 NodeMCU v3' },
  { device_id: 'IV-DEVICE-003', sensor: 'XKC-Y25 Non-contact Liquid Sensor', charger: 'TP4056 Normal', step_up: 'MT3608 5.0V Active', servo: 'SG90 Micro Servo (90° / 120°)', mcu: 'ESP8266 NodeMCU v3' },
  { device_id: 'IV-DEVICE-004', sensor: 'XKC-Y25 Non-contact Liquid Sensor', charger: 'TP4056 Normal', step_up: 'MT3608 5.0V Active', servo: 'SG90 Micro Servo (90° / 120°)', mcu: 'ESP8266 NodeMCU v3' },
  { device_id: 'IV-DEVICE-005', sensor: 'XKC-Y25 Non-contact Liquid Sensor', charger: 'TP4056 Normal', step_up: 'MT3608 5.0V Active', servo: 'SG90 Micro Servo (90° / 120°)', mcu: 'ESP8266 NodeMCU v3' },
  { device_id: 'IV-DEVICE-006', sensor: 'XKC-Y25 Non-contact Liquid Sensor', charger: 'TP4056 Normal', step_up: 'MT3608 5.0V Active', servo: 'SG90 Micro Servo (90° / 120°)', mcu: 'ESP8266 NodeMCU v3' }
];

class SQLiteService {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.initPromise = null;
    this.isUsingFallback = false;
    this.lastTelemetrySave = new Map(); // Throttling: deviceId -> timestamp
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const localWasm = `${baseUrl.replace(/\/$/, '')}/sql-wasm.wasm`;
        
        try {
          this.SQL = await initSqlJs({
            locateFile: () => localWasm
          });
        } catch {
          this.SQL = await initSqlJs({
            locateFile: () => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm'
          });
        }

        const savedBinary = localStorage.getItem(DB_STORAGE_KEY);
        if (savedBinary) {
          try {
            const u8 = this._base64ToUint8Array(savedBinary);
            this.db = new this.SQL.Database(u8);
          } catch (e) {
            console.warn('Could not restore saved SQLite binary, creating fresh DB:', e);
            this.db = new this.SQL.Database();
          }
        } else {
          this.db = new this.SQL.Database();
        }

        this._createSchemaAndSeed();
        this._persist();
        return true;
      } catch (err) {
        console.warn('WASM SQLite initialization exception, falling back to local storage engine:', err);
        this.isUsingFallback = true;
        this._initFallback();
        return true;
      }
    })();

    return this.initPromise;
  }

  _createSchemaAndSeed() {
    if (!this.db) return;

    // 1. Staff Users (Doctors, Nurses, Administrators)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        badge TEXT,
        status TEXT DEFAULT 'active',
        created_at INTEGER NOT NULL,
        last_login INTEGER
      );
    `);

    // 2. Hospital Rooms & Beds
    this.db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        room_number TEXT NOT NULL,
        bed_number TEXT NOT NULL,
        ward TEXT NOT NULL,
        device_id TEXT,
        status TEXT DEFAULT 'available',
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (room_number, bed_number)
      );
    `);

    // 3. Patients & Prescriptions
    this.db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        device_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        diagnosis TEXT,
        fluid_type TEXT,
        medicine_name TEXT,
        flow_rate INTEGER,
        start_time TEXT,
        total_volume INTEGER,
        remaining_volume INTEGER,
        notes TEXT,
        attending_doctor TEXT,
        assigned_nurse TEXT,
        assigned_nurse_name TEXT,
        room TEXT,
        bed TEXT,
        ward TEXT,
        updated_at INTEGER NOT NULL
      );
    `);

    // 4. Hardware Profiles
    this.db.run(`
      CREATE TABLE IF NOT EXISTS hardware_profiles (
        device_id TEXT PRIMARY KEY,
        sensor TEXT,
        charger TEXT,
        step_up TEXT,
        servo TEXT,
        mcu TEXT,
        updated_at INTEGER NOT NULL
      );
    `);

    // 5. Telemetry History & Time-Series Snapshots
    this.db.run(`
      CREATE TABLE IF NOT EXISTS telemetry_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        level INTEGER,
        battery INTEGER,
        status TEXT,
        flow_status TEXT,
        timestamp INTEGER NOT NULL
      );
    `);

    // 6. Audit Logs
    this.db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        details TEXT,
        timestamp INTEGER NOT NULL
      );
    `);

    // Seed default staff
    const insertStaff = this.db.prepare(`
      INSERT OR IGNORE INTO users (
        id, username, password, name, role, department, 
        email, phone, badge, status, created_at, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of DEFAULT_STAFF) {
      insertStaff.run([
        u.id, u.username, u.password, u.name, u.role, u.department,
        u.email, u.phone, u.badge, u.status, u.created_at, u.last_login
      ]);
    }
    insertStaff.free();

    // Seed default rooms
    const insertRoom = this.db.prepare(`
      INSERT OR IGNORE INTO rooms (
        room_number, bed_number, ward, device_id, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    for (const r of DEFAULT_ROOMS) {
      insertRoom.run([r.room_number, r.bed_number, r.ward, r.device_id, r.status, now]);
    }
    insertRoom.free();

    // Seed default patient
    const insertPat = this.db.prepare(`
      INSERT OR IGNORE INTO patients (
        id, device_id, name, age, gender, diagnosis, fluid_type, 
        medicine_name, flow_rate, start_time, total_volume, 
        remaining_volume, notes, attending_doctor, assigned_nurse, 
        assigned_nurse_name, room, bed, ward, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of DEFAULT_PATIENTS) {
      insertPat.run([
        p.id, p.device_id, p.name, p.age, p.gender, p.diagnosis, p.fluid_type,
        p.medicine_name, p.flow_rate, p.start_time, p.total_volume,
        p.remaining_volume, p.notes, p.attending_doctor, p.assigned_nurse,
        p.assigned_nurse_name, p.room, p.bed, p.ward, now
      ]);
    }
    insertPat.free();

    // Seed default hardware
    const insertHw = this.db.prepare(`
      INSERT OR IGNORE INTO hardware_profiles (
        device_id, sensor, charger, step_up, servo, mcu, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const h of DEFAULT_HARDWARE) {
      insertHw.run([h.device_id, h.sensor, h.charger, h.step_up, h.servo, h.mcu, now]);
    }
    insertHw.free();
  }

  _persist() {
    if (this.db) {
      try {
        const binary = this.db.export();
        const base64 = this._uint8ArrayToBase64(binary);
        localStorage.setItem(DB_STORAGE_KEY, base64);
      } catch (err) {
        console.warn('Failed to persist SQLite binary to storage:', err);
      }
    }
  }

  _uint8ArrayToBase64(u8) {
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i += 8192) {
      const chunk = u8.subarray(i, Math.min(i + 8192, len));
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  _base64ToUint8Array(b64) {
    const binary = atob(b64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8[i] = binary.charCodeAt(i);
    }
    return u8;
  }

  // Fallback storage if WebAssembly fails
  _initFallback() {
    let currentUsers = [];
    try {
      currentUsers = JSON.parse(localStorage.getItem(USERS_BACKUP_KEY)) || [];
    } catch {
      currentUsers = [];
    }
    const map = new Map(currentUsers.map(u => [u.username, u]));
    DEFAULT_STAFF.forEach(u => {
      if (!map.has(u.username)) currentUsers.push(u);
    });
    localStorage.setItem(USERS_BACKUP_KEY, JSON.stringify(currentUsers));

    let meta = {};
    try {
      meta = JSON.parse(localStorage.getItem(METADATA_BACKUP_KEY)) || {};
    } catch {
      meta = {};
    }
    const patMap = new Map((meta.patients || []).map(p => [p.device_id, p]));
    DEFAULT_PATIENTS.forEach(p => {
      if (!patMap.has(p.device_id)) patMap.set(p.device_id, p);
    });
    const roomMap = new Map((meta.rooms || []).map(r => [`${r.room_number}-${r.bed_number}`, r]));
    DEFAULT_ROOMS.forEach(r => {
      const k = `${r.room_number}-${r.bed_number}`;
      if (!roomMap.has(k)) roomMap.set(k, r);
    });
    const hwMap = new Map((meta.hardware || []).map(h => [h.device_id, h]));
    DEFAULT_HARDWARE.forEach(h => {
      if (!hwMap.has(h.device_id)) hwMap.set(h.device_id, h);
    });
    localStorage.setItem(METADATA_BACKUP_KEY, JSON.stringify({
      rooms: Array.from(roomMap.values()),
      patients: Array.from(patMap.values()),
      hardware: Array.from(hwMap.values())
    }));
  }

  // ===================== Doctors & Nurses =====================

  async getAllUsers() {
    await this.init();
    if (this.isUsingFallback) {
      try {
        return JSON.parse(localStorage.getItem(USERS_BACKUP_KEY)) || DEFAULT_STAFF;
      } catch {
        return DEFAULT_STAFF;
      }
    }

    const stmt = this.db.prepare(`
      SELECT id, username, password, name, role, department, email, phone, badge, status, created_at, last_login 
      FROM users 
      ORDER BY role ASC, name ASC
    `);

    const users = [];
    while (stmt.step()) {
      users.push(stmt.getAsObject());
    }
    stmt.free();
    return users;
  }

  async getDoctors() {
    const users = await this.getAllUsers();
    return users.filter(u => u.role === 'Doctor' && u.status !== 'suspended');
  }

  async getNurses() {
    const users = await this.getAllUsers();
    return users.filter(u => u.role === 'Nurse' && u.status !== 'suspended');
  }

  async authenticate(usernameOrEmail, password) {
    await this.init();
    const cleanInput = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanInput || !cleanPass) {
      throw new Error('Please enter both your hospital username/email and password.');
    }

    if (this.isUsingFallback) {
      const users = await this.getAllUsers();
      const user = users.find(u => 
        (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) && 
        u.password === cleanPass
      );
      if (!user) throw new Error('Invalid credentials. Check your username and password.');
      if (user.status === 'suspended') throw new Error('Account suspended. Contact the Chief Administrator.');
      user.last_login = Date.now();
      localStorage.setItem(USERS_BACKUP_KEY, JSON.stringify(users));
      return { ...user };
    }

    const stmt = this.db.prepare(`
      SELECT * FROM users 
      WHERE (LOWER(username) = ? OR LOWER(email) = ?) 
      AND password = ?
    `);

    stmt.bind([cleanInput, cleanInput, cleanPass]);
    if (!stmt.step()) {
      stmt.free();
      throw new Error('Invalid credentials. Check your username and password.');
    }

    const user = stmt.getAsObject();
    stmt.free();

    if (user.status === 'suspended') {
      throw new Error('This account is suspended. Contact the Chief Administrator.');
    }

    const now = Date.now();
    this.db.run("UPDATE users SET last_login = ? WHERE id = ?", [now, user.id]);
    this._persist();

    return { ...user, last_login: now };
  }

  async createUser(userData, actorName = 'Admin') {
    await this.init();
    const {
      username,
      password,
      name,
      role = 'Nurse',
      department = 'General Ward',
      email,
      phone = '',
      badge = ''
    } = userData;

    if (!username || !password || !name) {
      throw new Error('Username, password, and full name are required.');
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = (email || `${cleanUser}@hospital.org`).trim().toLowerCase();
    const newId = `user-${Date.now()}`;
    const now = Date.now();
    const computedBadge = badge || (role === 'Doctor' ? 'Attending Physician' : role === 'Nurse' ? 'Staff Nurse' : 'Hospital Admin');

    if (this.isUsingFallback) {
      const users = await this.getAllUsers();
      if (users.some(u => u.username.toLowerCase() === cleanUser)) {
        throw new Error(`Username "${username}" already exists.`);
      }
      const newUser = {
        id: newId,
        username: cleanUser,
        password,
        name,
        role,
        department,
        email: cleanEmail,
        phone,
        badge: computedBadge,
        status: 'active',
        created_at: now,
        last_login: null
      };
      users.unshift(newUser);
      localStorage.setItem(USERS_BACKUP_KEY, JSON.stringify(users));
      return newUser;
    }

    const checkStmt = this.db.prepare("SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?");
    checkStmt.bind([cleanUser, cleanEmail]);
    if (checkStmt.step()) {
      checkStmt.free();
      throw new Error(`A user with username "${username}" or email "${cleanEmail}" already exists.`);
    }
    checkStmt.free();

    const insertStmt = this.db.prepare(`
      INSERT INTO users (
        id, username, password, name, role, department, 
        email, phone, badge, status, created_at, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NULL)
    `);

    insertStmt.run([
      newId, cleanUser, password, name, role, department,
      cleanEmail, phone, computedBadge, now
    ]);
    insertStmt.free();

    this.db.run(
      "INSERT INTO audit_logs (id, actor, action, target, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [`log-${now}`, actorName, 'CREATE_USER', cleanUser, `Created ${role} profile for ${name}`, now]
    );

    this._persist();

    return {
      id: newId,
      username: cleanUser,
      password,
      name,
      role,
      department,
      email: cleanEmail,
      phone,
      badge: computedBadge,
      status: 'active',
      created_at: now,
      last_login: null
    };
  }

  async updateUser(id, updates, actorName = 'Admin') {
    await this.init();
    if (this.isUsingFallback) {
      const users = await this.getAllUsers();
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('User not found.');
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(USERS_BACKUP_KEY, JSON.stringify(users));
      return users[idx];
    }

    const readStmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    readStmt.bind([id]);
    if (!readStmt.step()) {
      readStmt.free();
      throw new Error('User not found.');
    }
    const current = readStmt.getAsObject();
    readStmt.free();

    const merged = { ...current, ...updates };

    this.db.run(`
      UPDATE users SET 
        name = ?, 
        role = ?, 
        department = ?, 
        email = ?, 
        phone = ?, 
        badge = ?, 
        status = ?,
        password = ?
      WHERE id = ?
    `, [
      merged.name,
      merged.role,
      merged.department,
      merged.email,
      merged.phone || '',
      merged.badge || '',
      merged.status || 'active',
      merged.password,
      id
    ]);

    const now = Date.now();
    this.db.run(
      "INSERT INTO audit_logs (id, actor, action, target, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [`log-${now}`, actorName, 'UPDATE_USER', merged.username, `Updated ${merged.role} profile for ${merged.name}`, now]
    );

    this._persist();
    return merged;
  }

  async deleteUser(id, actorName = 'Admin') {
    await this.init();
    if (this.isUsingFallback) {
      let users = await this.getAllUsers();
      const target = users.find(u => u.id === id);
      users = users.filter(u => u.id !== id);
      localStorage.setItem(USERS_BACKUP_KEY, JSON.stringify(users));
      return target;
    }

    const readStmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    readStmt.bind([id]);
    if (!readStmt.step()) {
      readStmt.free();
      throw new Error('User not found.');
    }
    const target = readStmt.getAsObject();
    readStmt.free();

    this.db.run("DELETE FROM users WHERE id = ?", [id]);

    const now = Date.now();
    this.db.run(
      "INSERT INTO audit_logs (id, actor, action, target, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [`log-${now}`, actorName, 'DELETE_USER', target.username, `Deleted profile of ${target.name}`, now]
    );

    this._persist();
    return target;
  }

  // ===================== Hospital Rooms & Beds =====================

  async getRooms() {
    await this.init();
    if (this.isUsingFallback) {
      try {
        const meta = JSON.parse(localStorage.getItem(METADATA_BACKUP_KEY)) || {};
        return meta.rooms || DEFAULT_ROOMS;
      } catch {
        return DEFAULT_ROOMS;
      }
    }

    const stmt = this.db.prepare("SELECT * FROM rooms ORDER BY ward ASC, room_number ASC, bed_number ASC");
    const rooms = [];
    while (stmt.step()) {
      rooms.push(stmt.getAsObject());
    }
    stmt.free();
    return rooms;
  }

  async updateRoom(roomNumber, bedNumber, updates) {
    await this.init();
    const now = Date.now();

    if (this.isUsingFallback) {
      const meta = JSON.parse(localStorage.getItem(METADATA_BACKUP_KEY)) || { rooms: DEFAULT_ROOMS };
      const idx = meta.rooms.findIndex(r => r.room_number === roomNumber && r.bed_number === bedNumber);
      if (idx !== -1) {
        meta.rooms[idx] = { ...meta.rooms[idx], ...updates, updated_at: now };
      } else {
        meta.rooms.push({ room_number: roomNumber, bed_number: bedNumber, ward: 'General', ...updates, updated_at: now });
      }
      localStorage.setItem(METADATA_BACKUP_KEY, JSON.stringify(meta));
      return true;
    }

    this.db.run(`
      INSERT INTO rooms (room_number, bed_number, ward, device_id, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(room_number, bed_number) DO UPDATE SET
        ward = COALESCE(?, ward),
        device_id = COALESCE(?, device_id),
        status = COALESCE(?, status),
        updated_at = ?
    `, [
      roomNumber, bedNumber, updates.ward || 'General', updates.device_id || null, updates.status || 'available', now,
      updates.ward, updates.device_id, updates.status, now
    ]);

    this._persist();
    return true;
  }

  // ===================== Device Metadata (Patients, Rooms, Hardware) =====================

  async getAllDeviceMetadata() {
    await this.init();
    if (this.isUsingFallback) {
      try {
        const meta = JSON.parse(localStorage.getItem(METADATA_BACKUP_KEY)) || {};
        const map = {};
        (meta.patients || DEFAULT_PATIENTS).forEach(p => {
          map[p.device_id] = {
            room: p.room,
            bed: p.bed,
            ward: p.ward,
            attending_doctor: p.attending_doctor || 'Dr. Sarah Jenkins',
            assignedNurse: p.assigned_nurse || 'nurse',
            assignedNurseName: p.assigned_nurse_name || 'Nurse Elena Rostova',
            patient: { ...p },
            hardware: (meta.hardware || DEFAULT_HARDWARE).find(h => h.device_id === p.device_id) || DEFAULT_HARDWARE[0]
          };
        });
        return map;
      } catch {
        return {};
      }
    }

    const patStmt = this.db.prepare("SELECT * FROM patients");
    const patientsMap = {};
    while (patStmt.step()) {
      const p = patStmt.getAsObject();
      patientsMap[p.device_id] = p;
    }
    patStmt.free();

    const hwStmt = this.db.prepare("SELECT * FROM hardware_profiles");
    const hwMap = {};
    while (hwStmt.step()) {
      const h = hwStmt.getAsObject();
      hwMap[h.device_id] = h;
    }
    hwStmt.free();

    const deviceMap = {};
    Object.keys(patientsMap).forEach(devId => {
      const p = patientsMap[devId];
      deviceMap[devId] = {
        room: p.room || '301',
        bed: p.bed || '01',
        ward: p.ward || 'ICU Ward 3',
        attending_doctor: p.attending_doctor || 'Dr. Sarah Jenkins',
        assignedNurse: p.assigned_nurse || 'nurse',
        assignedNurseName: p.assigned_nurse_name || 'Nurse Elena Rostova',
        patient: {
          name: p.name,
          age: p.age,
          gender: p.gender,
          diagnosis: p.diagnosis,
          fluidType: p.fluid_type,
          medicineName: p.medicine_name,
          flowRate: p.flow_rate,
          startTime: p.start_time,
          totalVolume: p.total_volume,
          remainingVolume: p.remaining_volume,
          notes: p.notes,
          attending_doctor: p.attending_doctor,
          assignedNurse: p.assigned_nurse,
          assignedNurseName: p.assigned_nurse_name
        },
        hardware: hwMap[devId] || {
          sensor: 'XKC-Y25 Non-contact Liquid Sensor',
          charger: 'TP4056 Normal',
          step_up: 'MT3608 5.0V Active',
          servo: 'SG90 Micro Servo (90° / 120°)',
          mcu: 'ESP8266 NodeMCU v3'
        }
      };
    });

    return deviceMap;
  }

  async saveDeviceMetadata(deviceId, data, actorName = 'Medical Staff') {
    await this.init();
    const now = Date.now();

    const p = data.patient || {};
    const name = p.name || data.name || 'Jane Doe';
    const age = Number(p.age ?? data.age ?? 42);
    const gender = p.gender || data.gender || 'Female';
    const diagnosis = p.diagnosis || data.diagnosis || 'Post-operative Hydration';
    const fluidType = p.fluidType || data.fluidType || 'Normal Saline 0.9% (500ml)';
    const medicineName = p.medicineName || data.medicineName || 'Potassium Chloride 20mEq';
    const flowRate = Number(p.flowRate ?? data.flowRate ?? 75);
    const startTime = p.startTime || data.startTime || '08:30 AM';
    const totalVolume = Number(p.totalVolume ?? data.totalVolume ?? 500);
    const remainingVolume = Number(p.remainingVolume ?? data.remainingVolume ?? 360);
    const notes = p.notes || data.notes || '';
    const attendingDoctor = p.attending_doctor || data.attending_doctor || 'Dr. Sarah Jenkins';
    const assignedNurse = data.assignedNurse || p.assignedNurse || 'nurse';
    const assignedNurseName = data.assignedNurseName || p.assignedNurseName || 'Nurse Elena Rostova';
    const room = data.room || p.room || '301';
    const bed = data.bed || p.bed || '01';
    const ward = data.ward || p.ward || 'ICU Ward 3';

    if (this.isUsingFallback) {
      const meta = JSON.parse(localStorage.getItem(METADATA_BACKUP_KEY)) || { patients: [], rooms: [], hardware: [] };
      const idx = meta.patients.findIndex(pat => pat.device_id === deviceId);
      const record = {
        id: `pat-${deviceId}`,
        device_id: deviceId,
        name, age, gender, diagnosis, fluid_type: fluidType, medicine_name: medicineName,
        flow_rate: flowRate, start_time: startTime, total_volume: totalVolume,
        remaining_volume: remainingVolume, notes, attending_doctor: attendingDoctor,
        assigned_nurse: assignedNurse, assigned_nurse_name: assignedNurseName,
        room, bed, ward, updated_at: now
      };
      if (idx !== -1) meta.patients[idx] = record;
      else meta.patients.push(record);
      localStorage.setItem(METADATA_BACKUP_KEY, JSON.stringify(meta));
      return record;
    }

    // Insert or update patient in SQLite
    this.db.run(`
      INSERT INTO patients (
        id, device_id, name, age, gender, diagnosis, fluid_type, 
        medicine_name, flow_rate, start_time, total_volume, 
        remaining_volume, notes, attending_doctor, assigned_nurse, 
        assigned_nurse_name, room, bed, ward, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        name = excluded.name,
        age = excluded.age,
        gender = excluded.gender,
        diagnosis = excluded.diagnosis,
        fluid_type = excluded.fluid_type,
        medicine_name = excluded.medicine_name,
        flow_rate = excluded.flow_rate,
        start_time = excluded.start_time,
        total_volume = excluded.total_volume,
        remaining_volume = excluded.remaining_volume,
        notes = excluded.notes,
        attending_doctor = excluded.attending_doctor,
        assigned_nurse = excluded.assigned_nurse,
        assigned_nurse_name = excluded.assigned_nurse_name,
        room = excluded.room,
        bed = excluded.bed,
        ward = excluded.ward,
        updated_at = excluded.updated_at
    `, [
      `pat-${deviceId}`, deviceId, name, age, gender, diagnosis, fluidType,
      medicineName, flowRate, startTime, totalVolume, remainingVolume, notes,
      attendingDoctor, assignedNurse, assignedNurseName, room, bed, ward, now
    ]);

    // Update room occupancy in SQLite
    this.db.run(`
      INSERT INTO rooms (room_number, bed_number, ward, device_id, status, updated_at)
      VALUES (?, ?, ?, ?, 'occupied', ?)
      ON CONFLICT(room_number, bed_number) DO UPDATE SET
        ward = excluded.ward,
        device_id = excluded.device_id,
        status = 'occupied',
        updated_at = excluded.updated_at
    `, [room, bed, ward, deviceId, now]);

    // Audit log
    this.db.run(
      "INSERT INTO audit_logs (id, actor, action, target, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [`log-${now}`, actorName, 'UPDATE_PATIENT_METADATA', deviceId, `Assigned ${name} in Room ${room} Bed ${bed}`, now]
    );

    this._persist();
    return true;
  }

  // ===================== Telemetry History Snapshots (Regular Updates) =====================

  recordTelemetrySnapshot(deviceId, telemetry) {
    if (!this.db || !deviceId || !telemetry) return;

    // Throttle recording to once every 10 seconds per device to avoid memory bloat
    const now = Date.now();
    const last = this.lastTelemetrySave.get(deviceId) || 0;
    if (now - last < 10000) return;
    this.lastTelemetrySave.set(deviceId, now);

    try {
      this.db.run(`
        INSERT INTO telemetry_history (device_id, level, battery, status, flow_status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        deviceId,
        Number(telemetry.level ?? 100),
        Number(telemetry.battery ?? 85),
        String(telemetry.status || 'normal'),
        String(telemetry.flowStatus || 'open'),
        now
      ]);

      // Prune old telemetry to keep last 500 records
      this.db.run(`
        DELETE FROM telemetry_history WHERE id NOT IN (
          SELECT id FROM telemetry_history ORDER BY id DESC LIMIT 500
        )
      `);

      this._persist();
    } catch (err) {
      console.warn('Failed to record telemetry snapshot in SQLite:', err);
    }
  }

  async getTelemetryHistory(deviceId, limit = 50) {
    await this.init();
    if (this.isUsingFallback || !this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM telemetry_history 
      WHERE device_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    stmt.bind([deviceId, limit]);

    const history = [];
    while (stmt.step()) {
      history.push(stmt.getAsObject());
    }
    stmt.free();
    return history;
  }

  async getAuditLogs() {
    await this.init();
    if (this.isUsingFallback) return [];

    const stmt = this.db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50");
    const logs = [];
    while (stmt.step()) {
      logs.push(stmt.getAsObject());
    }
    stmt.free();
    return logs;
  }

  // Export raw SQLite .sqlite binary file for clinical audit/backup
  exportDatabaseBlob() {
    if (!this.db) {
      throw new Error('Database is not initialized.');
    }
    const binary = this.db.export();
    return new Blob([binary], { type: 'application/x-sqlite3' });
  }
}

export const sqliteService = new SQLiteService();
