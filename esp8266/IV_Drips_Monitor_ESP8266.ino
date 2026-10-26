#define BLYNK_TEMPLATE_ID "TMPL3cRFO-a6I"
#define BLYNK_TEMPLATE_NAME "IV Drips Monitor"
#define BLYNK_AUTH_TOKEN "Og3k7JHKay-1w_Qhp3zPnEQ8KPPs0fkg"

// =========================================================================
// IV Drip Monitor Telemetry - ESP8266 Firmware (Crash-Proof Edition)
// =========================================================================
// Fixes Applied:
// 1. BearSSL 16KB Heap Exhaustion Fix: fbdo.setBSSLBufferSize(1024, 512)
// 2. Servo Detach Protection: Eliminates inrush brownout resets & motor jitter
// 3. Buzzer continuous alarm on empty fluid (even when clamped)
// 4. Hardware Timer Interrupt (Ticker.h) Buzzer: Rhythmic, constant-gap beeping immune to blocking network calls
// 5. Sensor 60ms Debouncing: Eliminates meniscus jitter and false trigger pulses
// 6. Zero-delay event-driven sync to Firebase RTDB
// 7. Throttled OLED I2C display (250ms) to prevent WDT watchdog resets
// =========================================================================

// ===== Libraries =====
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <Servo.h>
#include <Ticker.h>

// ===== Firebase Libraries =====
#include <FirebaseESP8266.h>
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ===== OLED Setup =====
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ===== Pin Config =====
const byte SensePin  = D5;   // XKC-Y25 Liquid Sensor
const byte BuzzerPin = D6;   // Active Buzzer
const byte SDA_PIN   = D1;   // OLED SDA
const byte SCL_PIN   = D2;   // OLED SCL
const byte ServoPin  = D4;   // SG90 Micro Servo (Power from 5V/VIN, NOT 3.3V)

// ===== Servo Setup =====
Servo myServo;
bool manualClamped = false; // Doctor commanded via Web Dashboard
bool autoClamped   = false; // Triggered immediately by fluid empty sensor
String lastServoCmd = "";

// Helper to move servo safely and detach to prevent brownout current spikes
void setValvePosition(int angle) {
  myServo.attach(ServoPin);
  myServo.write(angle);
  delay(300);       // Allow servo arm to complete mechanical travel
  myServo.detach();  // Cut motor power to eliminate jitter & brownout reset!
}

// ===== Wi-Fi Credentials =====
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

// ===== Firebase Credentials =====
#define DATABASE_URL "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define DATABASE_SECRET "YOUR_DATABASE_SECRET"

// ===== DEVICE ID =====
String deviceId = "IV-DEVICE-001";

// ===== State Tracking =====
bool lastLiquidState = true;
bool forceImmediateSync = false;

// ===== Sensor Debounce State (Eliminates ripple/meniscus jitter) =====
bool debouncedLiquidPresent = true;
bool lastRawSensor = true;
unsigned long lastSenseDebounceTime = 0;
const unsigned long SENSE_DEBOUNCE_DELAY = 60; // 60ms noise filter

// ===== BUZZER TIMING CONFIG (Hardware Timer Interrupt) =====
// Uses ESP8266 hardware timer to produce steady, rhythmic beeps with a constant gap.
// Completely immune to blocking Firebase / WiFi / OLED delays!
const unsigned int BUZZER_BEEP_MS = 200; // Duration of active sound (BEEP) in ms
const unsigned int BUZZER_GAP_MS  = 250; // Duration of silence between beeps (CONSTANT GAP) in ms

#define BUZZER_TICK_MS 50
const int BEEP_TICKS  = BUZZER_BEEP_MS / BUZZER_TICK_MS;        // 4 ticks (200ms)
const int GAP_TICKS   = BUZZER_GAP_MS / BUZZER_TICK_MS;         // 5 ticks (250ms)
const int CYCLE_TICKS = BEEP_TICKS + GAP_TICKS;                 // 9 ticks total (450ms cycle)

Ticker buzzerTicker;
volatile bool isBuzzerAlertActive = false;
volatile int buzzerTickCount = 0;

// Hardware Timer Interrupt Service Routine (Runs every 50ms regardless of loop delays)
void IRAM_ATTR buzzerTimerCallback() {
  if (!isBuzzerAlertActive) {
    digitalWrite(BuzzerPin, LOW);
    buzzerTickCount = 0;
    return;
  }

  // Generate steady, constant cadence: BEEP for BEEP_TICKS, SILENCE for GAP_TICKS
  if (buzzerTickCount < BEEP_TICKS) {
    digitalWrite(BuzzerPin, HIGH);
  } else {
    digitalWrite(BuzzerPin, LOW);
  }

  buzzerTickCount++;
  if (buzzerTickCount >= CYCLE_TICKS) {
    buzzerTickCount = 0;
  }
}

unsigned long lastAlertTime = 0;
const unsigned long ALERT_INTERVAL = 60000;

// Cloud Sync Timer (Every 2 seconds heartbeat, or instant on state change)
unsigned long lastSyncTime = 0;
const unsigned long SYNC_INTERVAL = 2000;

// OLED Refresh Timer (Every 250ms instead of every loop iteration)
unsigned long lastOledTime = 0;
const unsigned long OLED_INTERVAL = 250;

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n========================================");
  Serial.println(">>> [1/5] Booting IV Drip Monitor ESP8266");
  Serial.println("========================================");

  pinMode(SensePin, INPUT);
  pinMode(BuzzerPin, OUTPUT);
  digitalWrite(BuzzerPin, LOW);

  // ===== BUZZER TIMER INIT (Hardware Timer Interrupt) =====
  buzzerTicker.attach_ms(BUZZER_TICK_MS, buzzerTimerCallback);
  Serial.println(">>> Buzzer hardware timer attached (steady cadence with constant gap).");

  // ===== SERVO INIT (Safe Soft Actuation) =====
  setValvePosition(120);   // Default: OPEN (120°)
  Serial.println(">>> [2/5] Servo set to 120 deg (OPEN) & detached.");

  // ===== OLED INIT =====
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000); // 400kHz fast I2C
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextColor(WHITE);
    display.setTextSize(1);
    display.setCursor(0, 10);
    display.println("Connecting WiFi...");
    display.display();
  }
  Serial.println(">>> [3/5] OLED Initialized.");

  // ===== WIFI =====
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  Serial.print(">>> Connecting to WiFi: ");
  Serial.println(ssid);

  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 30) {
    delay(300);
    yield(); // Feed watchdog during connection
    Serial.print(".");
    wifiTimeout++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n>>> [4/5] WiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n>>> [WARNING] WiFi connecting in background...");
  }

  // ===== BLYNK (Non-blocking) =====
  Blynk.config(BLYNK_AUTH_TOKEN);
  Blynk.connect(2000);

  // ===== CRITICAL FIREBASE MEMORY BUFFER CONFIG =====
  // Default BearSSL buffer is 16KB Rx + 4KB Tx = 20KB heap (causes OUT OF MEMORY CRASH on ESP8266!).
  // Setting buffer to 1024 Rx and 512 Tx prevents heap exhaustion completely!
  fbdo.setBSSLBufferSize(1024, 512);
  fbdo.setResponseSize(1024);

  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  config.timeout.wifiReconnect = 5000;
  config.timeout.socketConnection = 5000;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Initialize state tracker with initial sensor reading
  debouncedLiquidPresent = (digitalRead(SensePin) == HIGH);
  lastRawSensor = debouncedLiquidPresent;
  lastLiquidState = debouncedLiquidPresent;

  Serial.print(">>> [5/5] Firebase Configured! Free Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  Serial.println(">>> System Ready. Entering Main Loop...\n");
}

// ===== LOOP =====
void loop() {
  // 1. Maintain Blynk connection
  if (Blynk.connected()) {
    Blynk.run();
  }
  yield(); // Feed watchdog

  // 2. Read Liquid Sensor with 60ms Noise Debouncing
  // Prevents fluid meniscus ripples or bubbles from creating erratic glitch beeps
  bool currentRawSense = (digitalRead(SensePin) == HIGH);
  if (currentRawSense != lastRawSensor) {
    lastSenseDebounceTime = millis();
    lastRawSensor = currentRawSense;
  }

  if ((millis() - lastSenseDebounceTime) > SENSE_DEBOUNCE_DELAY) {
    if (currentRawSense != debouncedLiquidPresent) {
      debouncedLiquidPresent = currentRawSense;
      lastLiquidState = debouncedLiquidPresent;
      forceImmediateSync = true;
      Serial.println(debouncedLiquidPresent ? ">>> [EVENT] Fluid Restored! Debounced & Verified." 
                                            : ">>> [EVENT] Fluid EMPTY! Debounced & Verified.");
    }
  }

  bool liquidPresent = debouncedLiquidPresent;
  bool isClamped = (manualClamped || autoClamped);

  // ===== IMMEDIATE AUTO-CLAMP SAFETY LOGIC =====
  if (!liquidPresent && !isClamped) {
    setValvePosition(90);   // CLAMP IMMEDIATELY (90°)
    autoClamped = true;
    isClamped = true;
    forceImmediateSync = true;
    Serial.println(">>> [SAFETY] No liquid detected! Valve auto-clamped at 90 deg. <<<");
  } else if (liquidPresent && autoClamped && !manualClamped) {
    setValvePosition(120);  // REOPEN (120°)
    autoClamped = false;
    isClamped = false;
    forceImmediateSync = true;
    Serial.println(">>> [SERVO] Liquid restored. Auto-clamped valve reopened to 120 deg. <<<");
  }

  // 3. Battery Calculation (A0 ADC)
  int raw = analogRead(A0);
  int batteryPercent = map(raw, 600, 1023, 0, 100);
  batteryPercent = constrain(batteryPercent, 0, 100);

  String status = liquidPresent ? "normal" : "empty";
  if (!liquidPresent && batteryPercent < 20) status = "low";

  // 4. BUZZER HANDLING - HARDWARE TIMER INTERRUPT ALARM
  // Uses ESP8266 Ticker interrupt to maintain exact 200ms beep / 250ms gap
  // Completely immune to blocking Firebase network calls or OLED refreshes!
  if (!liquidPresent) {
    isBuzzerAlertActive = true;

    // Blynk push alert (rate-limited)
    if (millis() - lastAlertTime > ALERT_INTERVAL) {
      if (Blynk.connected()) {
        Blynk.logEvent("iv_drip_alert", "IV Bag EMPTY! Valve clamped & buzzer sounding.");
      }
      lastAlertTime = millis();
    }
  } else {
    // Fluid is present - silence buzzer immediately
    isBuzzerAlertActive = false;
    digitalWrite(BuzzerPin, LOW);
  }

  // 5. Throttled OLED Rendering (Every 250ms to keep I2C bus & CPU free)
  if (millis() - lastOledTime >= OLED_INTERVAL) {
    lastOledTime = millis();

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("Battery: ");
    display.print(batteryPercent);
    display.println("%");

    display.setTextSize(2);
    display.setCursor(0, 20);

    if (liquidPresent) {
      display.println("IV Fluid");
      display.setCursor(0, 45);
      display.println("Detected");
    } else {
      display.println("No Liquid");
      display.setCursor(0, 45);
      display.println("Available");
    }

    display.setTextSize(1);
    display.setCursor(80, 0);
    if (isClamped) {
      display.print("CLAMPED");
    } else {
      display.print("OPEN");
    }
    display.display();
  }

  yield(); // Feed watchdog

  // 6. SYNC TO BLYNK & FIREBASE (Instant on event, or 2-second heartbeat)
  if (forceImmediateSync || (millis() - lastSyncTime >= SYNC_INTERVAL)) {
    lastSyncTime = millis();
    bool isEmergency = forceImmediateSync;
    forceImmediateSync = false;

    // Guard with WiFi check and free heap check to prevent crash
    if (WiFi.status() == WL_CONNECTED && ESP.getFreeHeap() > 4000) {
      String flow = isClamped ? "clamped" : "open";

      // (a) Send Telemetry Update FIRST for zero-delay dashboard response
      FirebaseJson telemetry;
      telemetry.set("level", liquidPresent ? 100 : 0);
      telemetry.set("battery", batteryPercent);
      telemetry.set("status", status);
      telemetry.set("flowStatus", flow);
      telemetry.set("liquidPresent", liquidPresent);
      telemetry.set("servoAngle", isClamped ? 90 : 120);
      telemetry.set("lastSeen", (double)millis());

      if (Firebase.updateNode(fbdo, "/devices/" + deviceId, telemetry)) {
        Serial.print(isEmergency ? "[INSTANT SYNC] " : "[HEARTBEAT] ");
        Serial.print("flow=");
        Serial.print(flow);
        Serial.print(", heap=");
        Serial.println(ESP.getFreeHeap());
      } else {
        Serial.print("[FIREBASE ERROR] ");
        Serial.println(fbdo.errorReason());
      }
      yield();

      // (b) Check for Remote Commands from Web Dashboard (Doctor clicked Clamp/Open)
      if (Firebase.getString(fbdo, "/devices/" + deviceId + "/servoCommand")) {
        String cmd = fbdo.stringData();
        if (cmd != lastServoCmd && cmd != "") {
          lastServoCmd = cmd;
          if (cmd == "CLAMP") {
            manualClamped = true;
            setValvePosition(90);
            Serial.println(">>> [REMOTE] Dashboard commanded CLAMP! Servo set to 90 deg. <<<");
          } else if (cmd == "OPEN") {
            manualClamped = false;
            autoClamped   = false;
            setValvePosition(120);
            Serial.println(">>> [REMOTE] Dashboard commanded OPEN! Servo set to 120 deg. <<<");
          }
        }
      }
      yield();

      // (c) Blynk Virtual Pins
      if (Blynk.connected()) {
        Blynk.virtualWrite(V0, batteryPercent);
        Blynk.virtualWrite(V1, liquidPresent ? 1 : 0);
      }
    }
  }

  delay(10);
  yield();
}
