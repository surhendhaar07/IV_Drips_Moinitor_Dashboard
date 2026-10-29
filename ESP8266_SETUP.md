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
| **SG90 Micro Servo Valve** | `D4` (GPIO 2) | PWM Output | `120°`: Flow OPEN (normal operation)<br>`90°`: Flow CLAMPED (safety latch immediately upon empty fluid or remote clamp) |
| **SSD1306 0.96" OLED Display** | `D1` (SDA), `D2` (SCL) | I2C (0x3C) | Displays Battery %, Fluid Status, and Flow state (OPEN/CLAMPED) |
| **TP4056 Battery Charger & Voltage** | `A0` (ADC0) | Analog Input | Reads battery voltage (mapped 600 - 1023 raw ADC to 0 - 100%) |
| **MT3608 DC-DC Step-Up Converter** | `VIN` / `5V` | Power Rail | Steps up 3.7V Li-ion to constant 5.0V for Servo, Buzzer, and Sensor |

---

## 3. Firebase Realtime Database Synchronization Schema

The dashboard connects directly to your Firebase Realtime Database at:
`https://iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com/`

### Path: `/devices/{deviceId}`
The Firebase Realtime Database strictly stores the **8 live IoT telemetry & control variables** synchronized between the physical ESP8266 node and the Web Dashboard:

```json
{
  "battery": 0,
  "flowStatus": "clamped",
  "lastSeen": 160049,
  "level": 0,
  "liquidPresent": false,
  "servoAngle": 90,
  "servoCommand": "OPEN",
  "status": "low"
}
```

| Key | Type | Description |
| :--- | :--- | :--- |
| `battery` | `int` | Battery capacity (0–100%) mapped from analog A0 voltage |
| `flowStatus` | `String` | Flow status: `"open"`, `"clamped"`, or `"offline"` |
| `lastSeen` | `long` | Millis uptime heartbeat (`millis()`) or epoch timestamp |
| `level` | `int` | Liquid level: `100` (present) or `0` (empty) |
| `liquidPresent`| `bool` | XKC sensor digital state: `true` (liquid present) or `false` (empty) |
| `servoAngle` | `int` | Servo arm angle: `120` (open) or `90` (clamped) |
| `servoCommand` | `String`| Remote dashboard command: `"OPEN"` or `"CLAMP"` |
| `status` | `String` | Device health status: `"normal"`, `"low"`, `"empty"`, or `"offline"` |

> 🔒 **Clinical Data Separation**: All patient admission data, doctor/nurse duty rosters, prescriptions, and room/bed allocations are stored in the browser's client-side **SQLite database** (`sqliteService.js`), keeping Firebase RTDB ultra-lightweight and focused strictly on live IoT telemetry.

### Path: `/alerts/{timestamp}`
Logged automatically when fluid runs dry:
```json
{
  "type": "empty",
  "deviceId": "IV-DEVICE-001",
  "level": 0,
  "battery": 0,
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
