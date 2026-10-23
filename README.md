# 🩺 IV DRIPS MONITOR: Smart Non-Contact IoT-Based IV Bottle Monitoring & Automatic Flow Control System

> **Theme**: Health Tech | **Sub-Theme**: Emergency Response & Remote Monitoring  
> **Institution**: Prince Shri Venkateshwara Padmavathy Engineering College  
> *Developed for the Vishwakarma Awards*  
> *"From manual IV monitoring to smart, automated patient care."*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-RTDB?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WebAssembly-003B57?logo=sqlite&logoColor=white)](https://sql.js.org/)
[![ESP8266](https://img.shields.io/badge/Hardware-ESP8266_NodeMCU-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/)
[![Prototype Cost](https://img.shields.io/badge/Prototype_Cost-₹1%2C620_--_₹2%2C000_Rs-brightgreen)](#-bill-of-materials--prototype-cost)

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Proposed Solution](#-proposed-solution)
4. [The Key Innovation: Monitoring-and-Response](#-the-key-innovation-monitoring-and-response)
5. [User Journey: Before vs. After](#-user-journey-before-vs-after)
6. [System Flowchart & Operating Sequence](#-system-flowchart--operating-sequence)
7. [System Architecture](#-system-architecture)
8. [Bill of Materials & Prototype Cost](#-bill-of-materials--prototype-cost)
9. [Hardware Specifications & Pinout](#-hardware-specifications--pinout)
10. [Safety & Efficiency Analysis](#-safety--efficiency-analysis)
11. [Target Beneficiaries & Impact](#-target-beneficiaries--impact)
12. [Testing Insights & Engineering Challenges](#-testing-insights--engineering-challenges)
13. [Scalability & Future Enhancements](#-scalability--future-enhancements)
14. [Web Application Architecture & Features](#-web-application-architecture--features)
15. [Getting Started](#-getting-started)
16. [Demo Credentials](#-demo-credentials)
17. [Firebase Realtime Database Schema](#-firebase-realtime-database-schema)
18. [Firmware Setup (ESP8266)](#-firmware-setup-esp8266)
19. [Interactive Hardware Simulator](#-interactive-hardware-simulator)
20. [Conclusion](#-conclusion)

---

## 🌟 Project Overview

**IV Drips Monitor** is a low-cost, smart, non-contact IoT-based IV bottle monitoring and automatic flow control system developed by students of **Prince Shri Venkateshwara Padmavathy Engineering College**.

The system addresses critical challenges in intravenous therapy by combining non-invasive liquid-level sensing, IoT cloud telemetry, and automatic physical flow restriction. Unlike traditional monitors that merely alert staff, this system initiates an immediate physical response via a micro-servo clamp to prevent venous backflow and lethal air embolism when saline is depleted, automatically releasing the clamp once a fresh bottle is hung.

---

## ⚠️ Problem Statement

In hospitals and clinics:
- Nurses must manually and repeatedly check IV bottles across multiple beds to ensure timely replacement.
- In busy wards, emergency rooms, or understaffed night shifts, simultaneous monitoring becomes exhausting and error-prone.
- Delayed replacement of an empty IV bottle leads to:
  1. **Blood Backflow**: Pressure changes cause the patient's blood to siphon back into the IV line.
  2. **Venous Air Embolism**: Air entering the venous circulation, posing life-threatening cardiovascular risks.
  3. **Heightened Anxiety**: Stress for patients and their accompanying relatives.

Therefore, an automated, reliable system is required to continuously monitor fluid levels, notify staff remotely, and physically halt fluid flow if replacement is delayed.

---

## 💡 Proposed Solution

The system attaches an **XKC-Y26-V non-contact liquid-level sensor** externally to the IV bottle/drip chamber, completely eliminating direct contact with sterile saline. An **ESP8266 NodeMCU** processes telemetry, sounds a local audible alarm, pushes real-time telemetry to a cloud dashboard over Wi-Fi, and controls an **SG90 micro-servo valve** to gently clamp the IV tube.

### Automated Sequence of Operation:
1. **Detection**: The XKC-Y26-V sensor detects that fluid has fallen below the critical sensing threshold.
2. **Processing**: The ESP8266 microcontroller receives the digital low signal.
3. **Local Alarm**: An active 5V buzzer pulses (250ms cadence) for immediate bedside alerting.
4. **Cloud Telemetry**: Real-time alert dispatched over Wi-Fi to Firebase RTDB and the web dashboard.
5. **Nurse Notification**: Visual and audio chime alarms alert attending nurses at the central station or on mobile devices.
6. **Automatic Flow Restriction**: The servo motor actuates to `90°`, gently pinching the IV tube to restrict flow and prevent air from entering the vein.
7. **Bottle Replacement**: The nurse replaces the empty IV bottle with a fresh fluid bag.
8. **Automatic Level Restoration & Reset**: The sensor detects fluid restored; the servo automatically returns to `120°` (open) without requiring any manual reset buttons, resuming normal continuous monitoring.

---

## 🚀 The Key Innovation: Monitoring-and-Response

### Evolution from Phase 1 to Phase 2:
- **Original Prototype (Passive Monitoring & Alert)**:
  - Focused strictly on sensing fluid depletion, sounding a buzzer, and posting a dashboard alert.
  - Required manual nurse intervention for both flow stoppage and a physical button press for system reset.
- **Updated Innovation (Active Monitoring & Response)**:
  - **Autonomous Physical Intervention**: Transitions from a passive notification device into an active bedside safety system.
  - **Gentle Mechanical Flow Control**: Uses a servo-actuated clamp positioned around the IV tube to gently restrict flow without damaging the line.
  - **Zero-Touch Automatic Reset**: Completely removes dependency on a physical manual RESET button. When a fresh IV bottle is hung, the non-contact sensor senses fluid restoration and commands the clamp to release back to `120°` autonomously.
  - **Complete Sterility**: Non-contact optical/capacitive sensing stays entirely on the exterior of the bottle/chamber, preserving medical-grade fluid sterility.

---

## 🔄 User Journey: Before vs. After

| Stage | Conventional / Before | IV Drips Monitor / After |
| :--- | :--- | :--- |
| **Monitoring** | Nurse checks bottles manually every 15–30 minutes | 24/7 continuous non-invasive automated monitoring |
| **Saline Depletion** | Must be visually noticed by nurse or patient family | XKC-Y26-V sensor detects critical level instantly |
| **Alerting** | Patient calls nurse or family walks to station | Local 5V buzzer + instant real-time cloud dashboard chime |
| **Critical Condition** | Manual reaction, subject to transit/workload delay | Immediate automatic detection & 15-second heartbeat check |
| **Flow Control** | Manual roller-clamp adjustment by nurse | Automatic servo-actuated gentle flow restriction |
| **Bottle Replacement** | Nurse replaces bottle manually | Nurse replaces bottle when alerted |
| **System Reset** | Manual intervention / resetting machinery | **Automatic Reset**: Sensor detects fluid & releases clamp |
| **Workload Impact** | High stress, frequent false alarms, repeated walking | Reduced nursing workload; focus shifts to high-acuity care |

---

## 🔁 System Flowchart & Operating Sequence

```
 ┌──────────────┐     ┌──────────────────────┐     ┌────────────────────┐
 │  (1) Patient │     │ (2) XKC-Y26-V Sensor │     │ (3) Saline Falls   │
 │ Receives IV  ├────►│  Monitors Saline     ├────►│ Below Sensor Level │
 │  Treatment   │     │  Level Non-Invasively│     │ (Critical Point)   │
 └──────────────┘     └──────────────────────┘     └─────────┬──────────┘
                                                             │
                                                             ▼
 ┌──────────────┐     ┌──────────────────────┐     ┌────────────────────┐
 │ (6) Servo    │     │ (5) Buzzer & Wi-Fi / │     │ (4) ESP8266 NodeMCU│
 │  Motor       │◄────┤  Firebase Dashboard  │◄────┤ Detects Critical   │
 │  Activates   │     │  Alert Triggered     │     │ Condition          │
 └──────┬───────┘     └──────────────────────┘     └────────────────────┘
        │
        ▼
 ┌──────────────┐     ┌──────────────────────┐     ┌────────────────────┐
 │ (7) Clamp    │     │ (8) Nurse Replaces   │     │ (9) Sensor Detects │
 │ Gently Halts │────►│  IV Bottle Upon      ├────►│ Restored Fluid     │
 │  Saline Flow │     │  Remote Alert        │     │ Level in Chamber   │
 └──────────────┘     └──────────────────────┘     └─────────┬──────────┘
                                                             │
                                                             ▼
 ┌──────────────┐     ┌──────────────────────┐     ┌────────────────────┐
 │(12)Continuous│     │ (11) Monitoring      │     │ (10) Servo Returns │
 │  Monitoring  │◄────┤  Resumes on Central  │◄────┤ to Normal Open (90°│
 │  Cycle Loops │     │  Web Dashboard       │     │ to 120°) Auto-Reset│
 └──────────────┘     └──────────────────────┘     └────────────────────┘
```

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Bedside_Node ["IoT Bedside Node (ESP8266 NodeMCU)"]
        Sensor["XKC-Y26-V Non-Contact Liquid Sensor"] -->|Digital In D5| ESP["ESP8266 Microcontroller"]
        Battery["3.7V LiPo Battery"] --> TP4056["TP4056 Charging Module"]
        TP4056 --> MT3608["MT3608 DC-DC 5V Step-Up"]
        Battery -->|Voltage Divider| ESP_A0["ESP8266 ADC0 (A0)"]
        ESP -->|PWM D4| Servo["SG90 Micro Servo (Tube Clamp)"]
        ESP -->|Digital Out D6| Buzzer["Active 5V Buzzer"]
        ESP -->|I2C D1/D2| OLED["SSD1306 0.96\" OLED Display"]
    end

    subgraph Cloud_Infrastructure ["Google Firebase Cloud"]
        ESP -- "Telemetry PATCH every 2s" --> RTDB[("Firebase Realtime Database")]
        ESP -- "Incident Logs" --> RTDB_Alerts["/alerts/"]
        RTDB -- "Remote Servo Command" --> ESP
    end

    subgraph Central_Station ["Hospital Central Dashboard (React 19 + Vite)"]
        RTDB <--> IVContext["IVContext Realtime State Engine"]
        IVContext --> DashboardGrid["Ward & Bed Monitoring Grid"]
        IVContext --> DetailsView["Bedside Telemetry & Manual Valve Override"]
        IVContext --> AudioService["Web Audio API Synthesizer Alarms"]
        IVContext <--> SQLiteWASM[("In-Browser SQLite DB (sql.js)")]
        IVContext --> Simulator["Interactive Hardware Simulator Panel"]
    end
```

---

## 💰 Bill of Materials & Prototype Cost

The system is designed with accessible, off-the-shelf commercial components to ensure maximum affordability for rural and low-resource healthcare institutions:

| Component | Specification / Model | Purpose | Estimated Unit Cost (INR) |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP8266 NodeMCU (ESP-12E) | Core controller, Wi-Fi telemetry & logic | ₹300 |
| **Liquid Level Sensor** | XKC-Y26-V Non-Contact Sensor | Non-invasive capacitive saline detection | ₹450 |
| **Actuator** | SG90 Micro Servo Motor | Mechanical gentle IV tubing clamp | ₹130 |
| **Display** | 0.96" SSD1306 I2C OLED | Bedside display (Battery, State, Flow) | ₹220 |
| **Acoustic Indicator**| 5V Active Buzzer | Local critical audible alarm | ₹25 |
| **Rechargeable Battery**| 3.7V Li-ion / LiPo (1200mAh) | Portable un-tethered bedside power | ₹250 |
| **Charging Module** | TP4056 with Protection | Micro-USB / Type-C battery charging | ₹45 |
| **Voltage Regulator**| MT3608 DC-DC Step-Up | Steps up 3.7V LiPo to stable 5.0V | ₹50 |
| **Enclosure & Wiring**| 2-Way Switch, PCB, Jumper Wires, 3D Mount | Circuit housing & tube clamp structure | ₹150 – ₹300 |
| **Total Estimated Cost** | — | **Fully Functional Smart IoT Node** | **₹1,620 – ₹2,000 / unit** |

---

## 🔌 Hardware Specifications & Pinout

The physical node runs the firmware located at [`esp8266/IV_Drips_Monitor_ESP8266.ino`](./esp8266/IV_Drips_Monitor_ESP8266.ino).

| Component | ESP8266 Pin | Pin Type | Function |
| :--- | :--- | :--- | :--- |
| **XKC-Y26-V Sensor** | `D5` (GPIO 14) | Digital Input | `HIGH`: Saline present<br>`LOW`: Fluid empty / Air chamber detected |
| **Active 5V Buzzer** | `D6` (GPIO 12) | Digital Output | Pulses at 250ms cadence during empty alarm state |
| **SG90 Servo Valve** | `D4` (GPIO 2) | PWM Output | `120°`: Flow OPEN (normal infusion)<br>`90°`: Flow CLAMPED (safety latch) |
| **SSD1306 OLED** | `D1` (SDA), `D2` (SCL) | I2C (0x3C) | Real-time battery %, fluid status, countdown timer, valve state |
| **TP4056 Battery Line**| `A0` (ADC0) | Analog Input | Voltage divider reading mapped to 0–100% capacity |
| **MT3608 Step-Up** | `VIN` / `5V` | Power Rail | Boosts 3.7V LiPo to 5.0V rail for Servo, Buzzer, and Sensor |
| **2-Way Switch** | Power rail | Hardware Switch | Power ON / OFF control for bedside energy conservation |

---

## 🛡️ Safety & Efficiency Analysis

### Safety Highlights:
- **Zero Risk of Contamination**: The XKC-Y26-V sensor operates through the plastic wall of the IV bottle or drip chamber without penetrating or touching the saline solution.
- **Immediate Embolism Prevention**: The combined response of local buzzer, remote cloud alert, and automatic servo clamping stops fluid flow immediately, preventing air from being sucked into the vein.
- **Gentle Mechanical Restriction**: The servo motor applies a calibrated pinch to the flexible medical tubing rather than an abrupt cut or puncture, preserving line integrity.
- **Autonomous Recovery**: Releasing the clamp automatically upon bottle replacement prevents accidental flow blockage when treatment should resume.

### Efficiency Highlights:
- **Eliminates Repetitive Checking**: Frees nursing staff from having to pace wards solely to glance at drip levels.
- **15-Second Heartbeat Liveness**: Detects network dropouts or hardware failure within 15 seconds, setting the device badge to `Offline` if communication stops.
- **Alert Throttling**: The firmware limits repeat cloud alert events to once every 60 seconds, preventing database congestion while maintaining continuous audio-visual alerting.

---

## 🎯 Target Beneficiaries & Impact

- **Nursing Staff**: Vastly reduces routine manual checks, decreases fatigue, and eliminates anxiety around missing an empty drip bottle during busy shifts.
- **Inpatients**: Protects against vein collapse, blood backflow, and air embolisms; provides reassurance that their IV line is monitored round-the-clock.
- **Hospitals & Specialty Clinics**: Optimizes nursing staff allocation, lowers critical incident rates, and centralizes telemetry across wards.
- **Home Healthcare & Elderly Care**: Enables remote family members or home-care nurses to track ongoing infusions via web dashboard.
- **Emergency Departments & ICUs**: Provides fast, automated flow stoppage when emergency staff are occupied with life-saving trauma resuscitations.

---

## 🧪 Testing Insights & Engineering Challenges

During the development and testing phases, several key engineering insights and hurdles were addressed:

1. **Coordination Between Sensing & Mechanical Latching**:
   - *Hurdle*: Rapid fluid meniscus fluctuations or micro-bubbles inside the drip chamber could trigger false-positive clamps.
   - *Solution*: Implemented debounce timing in the ESP8266 firmware and a 60-second graceful countdown before the mechanical clamp executes, paired with immediate audio alerting.
2. **Eliminating the Manual Reset Dependency**:
   - *Hurdle*: Early prototypes required nurses to find and press a small physical push-button to unclamp the tube after hanging a new bottle.
   - *Solution*: Developed a closed-loop sensing return: once the XKC-Y26-V detects that fluid has returned to the threshold, the microcontroller commands the servo back to `120°` (open) automatically.
3. **Power Consumption & Battery Life**:
   - *Hurdle*: Continuous Wi-Fi transmissions and servo holding torque drain 3.7V LiPo cells quickly.
   - *Solution*: The servo is detached or relaxed after reaching its target angle (`90°` or `120°`), and telemetry updates are batched into 2-second heartbeats.

---

## 📈 Scalability & Future Enhancements

- **Droplet Flow-Rate Monitoring**: Integrate optical infrared drop-counting sensors to measure precise flow rates in drops/min (gtt/min) and mL/hr.
- **GSM / Cellular Fallback**: Add SIM800L / NB-IoT modules for hospital wards or rural clinics without reliable Wi-Fi coverage.
- **Improved Servo Precision**: Custom 3D-printed peristaltic or linear micro-stepper mechanisms for micro-rate flow throttling.
- **Battery Optimization**: Deep sleep cycles and smart display timeout to extend battery operation to several days per charge.
- **Multi-Ward Centralized Telemetry**: Expand patient directory to manage multi-floor hospital networks with automated shift-handover reports.

---

## 💻 Web Application Architecture & Features

The web frontend is a medical-grade dashboard built with modern React 19:

- **Dashboard Grid View**: Real-time visual cards for every bed in the ward with fluid level progress rings, flow badges (`Open`, `Waiting`, `Clamped`), and Wi-Fi signal meters.
- **Device Deep Details View**: Countdown progress indicator, remote two-way valve toggle button (`Toggle Clamp` / `Emergency Clamp`), and patient prescription details.
- **Audio Synthesizer Engine**: Native Web Audio API tone synthesis creates distinct clinical warning frequencies without external audio file dependencies.
- **In-Browser SQLite WASM Database**: Full client-side SQLite engine (`sql.js`) manages patient admissions, doctor assignments, and audit trails completely offline.
- **Interactive Hardware Simulator**: Built-in test bench to simulate sensor states, drain rates, battery drops, and clamp actuations without physical hardware connected.
- **Role-Based Access Control**: Pre-configured portals for Administrators, Attending Doctors, and Ward Nurses.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
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

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Compiled production files will be generated in `dist/`.

---

## 🔐 Demo Credentials

The platform provides role-based credentials for immediate testing:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `password123` | Full Access: User Management, Audit Logs, Settings |
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
    "sensor": "XKC-Y26-V Non-contact Liquid Sensor",
    "stepUp": "MT3608 5.0V Active"
  }
}
```

### 2. Two-Way Remote Valve Command (`/devices/{deviceId}/servoCommand`)
- `"CLAMP"`: Actuates the servo to `90°` (halts IV fluid flow).
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
   - `Adafruit SSD1306` (by Adafruit)
   - `Adafruit GFX Library` (by Adafruit)
   - `Servo` (ESP8266 built-in)
3. Update your Wi-Fi credentials and Firebase database parameters in the `.ino` file:
   ```cpp
   #define WIFI_SSID "YOUR_WIFI_SSID"
   #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
   #define FIREBASE_HOST "iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com"
   #define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"
   ```
4. Under **Tools → Board**, select **NodeMCU 1.0 (ESP-12E Module)** and flash the board.

For complete wiring schematics, consult [ESP8266_SETUP.md](./ESP8266_SETUP.md).

---

## 🧪 Interactive Hardware Simulator

To test the system without physical hardware:
1. Log into the dashboard and navigate to any device detail card.
2. Open the **Hardware Simulator** panel at the bottom right.
3. Test physical edge-cases:
   - Toggle **Liquid Present / Empty** to simulate IV depletion.
   - Adjust battery sliders to verify low-power notifications.
   - Trigger the **60-second safety countdown** to observe real-time auto-clamping.
   - Issue **Remote Clamp / Open** commands to verify bi-directional IoT communication.

---

## 🏁 Conclusion

The **IV Drips Monitor** presents an affordable, robust, and IoT-enabled approach to making intravenous therapy smarter, safer, and more efficient. By coupling the ESP8266 microcontroller with the XKC-Y26-V non-contact sensor, sterile saline levels are continuously monitored without invasive fluid contact. When a critical level is detected, the system immediately sounds local alarms, dispatches remote cloud notifications, and activates the servo-controlled clamp to gently restrict flow. 

With its automated recovery mechanism upon bottle replacement, the project bridges the gap between passive telemetry and active patient safety:

> *"From manual IV monitoring to smart, automated patient care."*
