# IV Drips Monitor & Telemetry Platform - Hardware & Firebase Integration

## 1. System Overview
This web application is a Hospital Management & Telemetry Dashboard for IV Drip Monitoring, paired directly with the ESP8266 firmware located at:
📁 **[`esp8266/IV_Drips_Monitor_ESP8266.ino`](./esp8266/IV_Drips_Monitor_ESP8266.ino)**

---

## 2. Hardware Pinout & Architecture (ESP8266)

| Component | ESP8266 Pin | Pin Type | Function |
| :--- | :--- | :--- | :--- |
| **XKC-Y25 Non-Contact Liquid Sensor** | `D5` (GPIO 14) | Digital Input | `HIGH`: IV Fluid Present<br>`LOW`: No Fluid / Air in Drip Chamber |
| **Active 5V Buzzer** | `D6` (GPIO 12) | Digital Output | Pulses at 250ms cadence when fluid is empty until acknowledged/clamped |
| **SG90 Micro Servo Valve** | `D4` (GPIO 2) | PWM Output | `120°`: Flow OPEN (normal operation)<br>`90°`: Flow CLAMPED (safety latch after 60s of no liquid or remote clamp) |
| **SSD1306 0.96" OLED Display** | `D1` (SDA), `D2` (SCL) | I2C (0x3C) | Displays Battery %, Fluid Status, Countdown, and Flow state (OPEN/WAITING/CLAMPED) |
| **TP4056 Battery Charger & Voltage** | `A0` (ADC0) | Analog Input | Reads battery voltage (mapped 600 - 1023 raw ADC to 0 - 100%) |
| **MT3608 DC-DC Step-Up Converter** | `VIN` / `5V` | Power Rail | Steps up 3.7V Li-ion to constant 5.0V for Servo, Buzzer, and Sensor |

---

## 3. Firebase Realtime Database Synchronization Schema

The dashboard connects directly to your Firebase Realtime Database at:
`https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/`

### Path: `/devices/{deviceId}`
All patient details, room, bed, and hardware assignments are **strictly preserved** in Firebase. The ESP8266 firmware updates **only the dynamic telemetry keys** using `Firebase.updateNode` (PATCH):

```json
{
  "level": 100,           // 100 (fluid present) or 0 (empty)
  "battery": 85,          // 0 to 100%
  "status": "normal",     // "normal", "low", or "empty"
  "flowStatus": "open",   // "open", "waiting" (in 60s countdown), or "clamped"
  "liquidPresent": true,  // true / false
  "servoAngle": 120,      // 120 (open) or 90 (clamped)
  "lastSeen": 1728901234, // Unix epoch or millis() heartbeat
  "wifiDbm": -62,         // Wi-Fi signal in dBm
  "signal": 4,            // 1 to 4 signal bars

  // --- PRESERVED CLINICAL METADATA (Managed by Dashboard) ---
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

### Path: `/devices/{deviceId}/servoCommand` (Two-Way IoT Remote Control)
- Written by Web Dashboard when Doctor/Nurse clicks **Toggle Clamp** or **Emergency Clamp**.
- Commands: `"CLAMP"` (commands servo to 90°) or `"OPEN"` (commands servo to 120°).
- Read by ESP8266 in its main loop to execute real-time physical valve actuation.

### Path: `/alerts/{timestamp}`
Logged automatically when fluid runs dry:
```json
{
  "type": "empty",
  "deviceId": "IV-DEVICE-001",
  "level": 0,
  "battery": 85,
  "timestamp": 1792135716625,
  "acknowledged": false
}
```
> **Note on Alert Throttling**: The updated firmware logs to `/alerts/` **once** when fluid transitions to empty, and throttles repeat alerts to a maximum of once every 60 seconds. This prevents flooding the database with hundreds of alerts per second.

---

## 4. 15-Second Heartbeat & Live/Offline Indicator
- The web dashboard monitors the `lastSeen` timestamp of each device.
- If `lastSeen` does not update for **more than 15 seconds**, the dashboard automatically sets the device badge to **`Offline`** (grey dot).
- The ESP8266 firmware pushes telemetry every **2 seconds**, ensuring the status remains **`Live`** (green pulsing dot) whenever the hardware is active.

---

## 5. Required Arduino Libraries
Install the following via the Arduino Library Manager:
1. **Firebase ESP8266 Client** (by Mobizt)
2. **Blynk** (by Volodymyr Shymanskyy)
3. **Adafruit SSD1306** (by Adafruit)
4. **Adafruit GFX Library** (by Adafruit)
5. **Servo** (ESP8266 built-in)
