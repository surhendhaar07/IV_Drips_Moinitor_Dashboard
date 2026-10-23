# 🩺 Smart IV Drip Telemetry & Monitoring Dashboard

> **Intelligent Bedside Telemetry Platform & IoT Auto-Clamping System**  
> *Developed for the Vishwakarma Awards*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-RTDB_&_Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WebAssembly-003B57?logo=sqlite&logoColor=white)](https://sql.js.org/)
[![ESP8266](https://img.shields.io/badge/Hardware-ESP8266_NodeMCU-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Hardware Specifications & Pinout](#-hardware-specifications--pinout)
5. [Tech Stack](#-tech-stack)
6. [Project Structure](#-project-structure)
7. [Getting Started](#-getting-started)
8. [Demo Credentials](#-demo-credentials)
9. [Firebase Realtime Database Schema](#-firebase-realtime-database-schema)
10. [Firmware Setup (ESP8266)](#-firmware-setup-esp8266)
11. [Hardware Simulator](#-hardware-simulator)
12. [License & Acknowledgements](#-license--acknowledgements)

---

## 🌟 Overview

The **Smart IV Drip Telemetry & Monitoring Dashboard** is an integrated medical IoT platform designed to automate intravenous (IV) infusion monitoring in clinical wards and ICUs. 

The system pairs non-invasive hardware sensors on the IV drip chamber with an ESP8266 microcontroller and a high-performance React dashboard. It continuously monitors fluid levels, prevents venous air embolisms through automatic mechanical servo clamping, detects abnormal flow rates, and alerts healthcare staff through real-time push events and synthesized auditory chimes.

---

## ✨ Key Features

- **💧 Real-Time Telemetry & Fluid Level Tracking**:
  - Continuous status sensing (`Normal`, `Low`, `Empty`) via non-contact optical/capacitive liquid sensor.
  - Live battery percentage (`0-100%`) and Wi-Fi signal strength (`RSSI dBm` and signal bars).
  - 15-second active heartbeat detector that marks disconnected nodes as `Offline` automatically.

- **🔒 Autonomous Emergency Auto-Clamping**:
  - Mechanical SG90 servo valve automatically latches to closed position (`90°`) after a 60-second empty countdown.
  - Prevents dangerous air embolism without requiring manual nurse intervention.

- **⚡ Two-Way Cloud Actuation**:
  - Doctors and nurses can remotely command the physical IV clamp (`OPEN` / `CLAMP`) directly from the dashboard via Firebase RTDB.

- **🔔 Multi-Tiered Auditory & Visual Alert System**:
  - Web Audio API tone synthesis generates prioritized clinical alarms.
  - Real-time toast notifications and interactive notification dropdown modal.
  - Active buzzer on the hardware pulses at 250ms cadence during critical empty alerts.

- **👥 Multi-Role Hospital Authentication (RBAC)**:
  - Role-specific access control for **Administrators**, **Doctors**, and **Nurses**.
  - Nurse bed assignment and ward filtering (e.g., ICU Ward 3, General Ward).

- **🗄️ In-Browser SQLite Database (WebAssembly)**:
  - Client-side SQLite database (`sql.js`) manages patient profiles, admission logs, audit trails, and clinical reports offline without latency.

- **📊 Vitals Analytics & History**:
  - Visual charts showing drip depletion rate, volume infused, remaining time estimation, and session histories.

- **🧪 Built-In Hardware Simulator Panel**:
  - Full-featured test bench in the UI to simulate sensor states, toggle clamps, trigger empty alarms, and test the dashboard without physical hardware connected.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Hardware Node ["ESP8266 NodeMCU Hardware"]
        Sensor["XKC-Y25 Liquid Sensor"] --> ESP["ESP8266 Microcontroller"]
        Batt["TP4056 Battery Charger (A0)"] --> ESP
        ESP --> OLED["SSD1306 0.96\" OLED Display"]
        ESP --> Buzzer["Active 5V Buzzer"]
        ESP --> Servo["SG90 Micro Servo (IV Clamp)"]
    end

    subgraph Cloud ["Google Firebase"]
        ESP -- "Telemetry (PATCH /devices)" --> RTDB[("Firebase Realtime Database")]
        RTDB -- "Remote Command (/servoCommand)" --> ESP
        ESP -- "Incident Log (/alerts)" --> RTDB
    end

    subgraph Frontend ["React Web Dashboard"]
        RTDB <--> IVContext["IVContext State Engine"]
        IVContext --> Views["Clinical Views (Dashboard, Patients, Vitals, Reports)"]
        IVContext --> WebAudio["Web Audio API Alarms"]
        IVContext <--> SQLite[("In-Browser SQLite DB (WASM)")]
        IVContext --> Simulator["Interactive Hardware Simulator"]
    end
```

---

## 🔌 Hardware Specifications & Pinout

The physical node is driven by the firmware located at [`esp8266/IV_Drips_Monitor_ESP8266.ino`](./esp8266/IV_Drips_Monitor_ESP8266.ino).

| Component | ESP8266 Pin | Pin Type | Function |
| :--- | :--- | :--- | :--- |
| **XKC-Y25 Liquid Sensor** | `D5` (GPIO 14) | Digital Input | `HIGH`: IV Fluid Present<br>`LOW`: No Fluid / Air in Drip Chamber |
| **Active 5V Buzzer** | `D6` (GPIO 12) | Digital Output | Pulses at 250ms cadence during empty alarm state |
| **SG90 Micro Servo Valve** | `D4` (GPIO 2) | PWM Output | `120°`: Flow OPEN (normal infusion)<br>`90°`: Flow CLAMPED (safety latch) |
| **SSD1306 0.96" OLED** | `D1` (SDA), `D2` (SCL) | I2C (0x3C) | Displays Battery %, Fluid Status, Countdown, and Valve State |
| **TP4056 Battery Monitor** | `A0` (ADC0) | Analog Input | Voltage divider reading mapped to 0–100% battery capacity |
| **MT3608 Step-Up Converter**| `VIN` / `5V` | Power Rail | Steps up 3.7V Li-ion battery to 5.0V for Servo, Buzzer, and Sensor |

---

## 💻 Tech Stack

### Web Application
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database (Cloud)**: [Firebase Realtime Database & Authentication](https://firebase.google.com/)
- **Database (Client/Local)**: [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly)
- **Audio Engine**: Native HTML5 Web Audio API
- **Styling**: Vanilla CSS Design System with Glassmorphism, CSS Custom Properties, and Dark Mode

### Embedded Hardware
- **Target**: ESP8266 NodeMCU (ESP-12E)
- **Firmware Language**: C++ (Arduino Framework)
- **Libraries**: `FirebaseESP8266`, `Adafruit SSD1306`, `Adafruit GFX`, `Servo`, `Blynk`

---

## 📁 Project Structure

```
├── esp8266/
│   └── IV_Drips_Monitor_ESP8266.ino   # Complete ESP8266 firmware source
├── public/
│   ├── favicon.svg                   # Hospital branding favicon
│   ├── hospital_backdrop.jpg         # Login screen background
│   ├── icons.svg                     # SVG icon assets
│   └── sql-wasm.wasm                 # SQLite WebAssembly binary
├── src/
│   ├── components/
│   │   ├── AddDeviceModal.jsx        # Register new IV monitoring device
│   │   ├── AssignPatientModal.jsx    # Assign patient, doctor & fluid details
│   │   ├── DeviceCard.jsx            # Real-time telemetry card with animations
│   │   ├── EditDeviceModal.jsx       # Edit room, bed, and device metadata
│   │   ├── HardwareSimulatorPanel.jsx# Interactive hardware testbench panel
│   │   ├── Navbar.jsx                # Top status bar, audio toggle, and user profile
│   │   ├── NotificationBellModal.jsx # Alerts dropdown modal & acknowledgement
│   │   └── Sidebar.jsx               # Navigation bar with role badge
│   ├── context/
│   │   └── IVContext.jsx             # Global state, RTDB sync, and audio triggers
│   ├── services/
│   │   ├── soundService.js           # Web Audio API clinical tone synthesizer
│   │   └── sqliteService.js          # SQLite client-side schema & query layer
│   ├── views/
│   │   ├── AdminPanelView.jsx        # System management, audit logs & users
│   │   ├── DashboardGrid.jsx         # Live telemetry grid with ward filters
│   │   ├── DeviceDetailsView.jsx     # Deep telemetry view, countdown & valve control
│   │   ├── LoginView.jsx             # Role-based glassmorphism login portal
│   │   ├── PatientsView.jsx          # Bed-to-patient directory & records
│   │   ├── ReportsView.jsx           # Shift summary & incident reports
│   │   ├── SettingsView.jsx          # Cloud sync, alerts, and system preferences
│   │   └── VitalsAnalyticsView.jsx   # Infusion rates & telemetry analytics
│   ├── firebase.js                   # Firebase client initialization & RTDB listeners
│   ├── App.jsx                       # Main application shell & router
│   ├── main.jsx                      # React root entry point
│   └── index.css                     # Comprehensive design tokens & styles
├── ESP8266_SETUP.md                  # Detailed hardware wiring & pinout guide
├── index.html                        # Application HTML template
├── package.json                      # Dependencies and scripts
└── vite.config.js                    # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/surhendhaar07/IV_Drips_Moinitor_Dashboard.git
cd IV_Drips_Moinitor_Dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
The compiled, minified production assets will be output to the `dist/` directory.

---

## 🔐 Demo Credentials

The platform includes pre-configured accounts with role-based access:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `password123` | Full Access: User Management, Audit Logs, Global Configuration |
| **Attending Doctor** | `doctor` | `password123` | Clinical Access: Vitals, Patient Assignment, Remote Valve Actuation |
| **Ward Nurse 1** | `nurse` | `password123` | Ward Telemetry: Infusion Monitoring, Alert Acknowledgement |
| **Ward Nurse 2** | `nurse2` | `password123` | Ward Telemetry: Bed Monitoring |
| **Ward Nurse 3** | `nurse3` | `password123` | Ward Telemetry: Bed Monitoring |

> 💡 *Quick Login buttons are available on the login screen for instant one-click testing.*

---

## 📡 Firebase Realtime Database Schema

### 1. Device Telemetry (`/devices/{deviceId}`)
```json
{
  "level": 100,
  "battery": 85,
  "status": "normal",
  "flowStatus": "open",
  "liquidPresent": true,
  "servoAngle": 120,
  "lastSeen": 1728901234,
  "wifiDbm": -62,
  "signal": 4,
  "room": "301",
  "bed": "01",
  "ward": "ICU Ward 3",
  "assignedNurse": "nurse",
  "assignedNurseName": "Nurse Elena Rostova",
  "patient": {
    "name": "Jane Doe",
    "age": 42,
    "gender": "Female",
    "diagnosis": "Post-operative Hydration",
    "fluidType": "Normal Saline 0.9% (500ml)",
    "medicineName": "Potassium Chloride 20mEq",
    "flowRate": 75,
    "startTime": "08:30 AM",
    "totalVolume": 500,
    "remainingVolume": 360,
    "notes": "Infusion running on schedule."
  },
  "hardware": {
    "charger": "TP4056 Normal",
    "sensor": "XKC-Y25 Non-contact Liquid Sensor",
    "stepUp": "MT3608 5.0V Active"
  }
}
```

### 2. Remote Valve Command (`/devices/{deviceId}/servoCommand`)
- `"CLAMP"`: Actuates the servo to `90°` (stops fluid flow).
- `"OPEN"`: Actuates the servo to `120°` (restores normal infusion).

### 3. Incident Alerts (`/alerts/{timestamp}`)
```json
{
  "type": "empty",
  "deviceId": "IV-DEVICE-001",
  "level": 0,
  "battery": 85,
  "timestamp": 1728901234000,
  "acknowledged": false
}
```

---

## 🛠️ Firmware Setup (ESP8266)

1. Open [`esp8266/IV_Drips_Monitor_ESP8266.ino`](./esp8266/IV_Drips_Monitor_ESP8266.ino) in the **Arduino IDE**.
2. Install the following libraries via **Sketch → Include Library → Manage Libraries**:
   - `Firebase ESP8266 Client` (by Mobizt)
   - `Blynk` (by Volodymyr Shymanskyy)
   - `Adafruit SSD1306` (by Adafruit)
   - `Adafruit GFX Library` (by Adafruit)
3. Set your Wi-Fi credentials and Firebase database host in the `.ino` file:
   ```cpp
   #define WIFI_SSID "YOUR_WIFI_SSID"
   #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
   #define FIREBASE_HOST "iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com"
   #define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"
   ```
4. Select board: **NodeMCU 1.0 (ESP-12E Module)** and flash the firmware.

For more hardware details, consult [ESP8266_SETUP.md](./ESP8266_SETUP.md).

---

## 🧪 Hardware Simulator

Don't have physical ESP8266 hardware at hand? The web dashboard includes an interactive **Hardware Simulator Panel**:
1. Open the dashboard and navigate to any device card.
2. Toggle the **Hardware Simulator** panel from the bottom or side drawer.
3. Test physical scenarios:
   - Simulate **Liquid Present / Empty** transitions.
   - Adjust battery levels to test low-power triggers.
   - Trigger the **60-second safety countdown** and witness real-time auto-clamping.
   - Test two-way remote valve commands.

---

## 📄 License & Acknowledgements

This project was built for the **Vishwakarma Awards** to demonstrate how low-cost IoT edge hardware paired with modern web telemetry can prevent critical medical errors and improve patient care standards.

Distributed under the MIT License.
