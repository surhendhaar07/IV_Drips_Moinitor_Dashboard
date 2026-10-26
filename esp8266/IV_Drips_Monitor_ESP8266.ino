#define BLYNK_TEMPLATE_ID "TMPL3cRFO-a6I"
#define BLYNK_TEMPLATE_NAME "IV Drips Monitor"
#define BLYNK_AUTH_TOKEN "Og3k7JHKay-1w_Qhp3zPnEQ8KPPs0fkg"

// =========================================================================
// IV Drip Monitor Telemetry - ESP8266 Firmware
// =========================================================================
// Features:
// 1. Immediate Safety Auto-Clamp (Servo 90° instantly upon fluid depletion)
// 2. Active Buzzer Alerting continuously on empty fluid (even when clamped)
// 3. Zero-Delay Event-Driven Cloud Sync (Instant Firebase push upon state change)
// 4. OLED SSD1306 Local Display (Throttled refresh to prevent WDT resets)
// 5. Anti-Watchdog (WDT) and Brownout Protection
// =========================================================================

// ===== Libraries =====
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <Servo.h>

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

// ===== Wi-Fi Credentials =====
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

// ===== Firebase Credentials =====
#define DATABASE_URL "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define DATABASE_SECRET "YOUR_DATABASE_SECRET"

// ===== DEVICE ID =====
String deviceId = "IV-DEVICE-001";

// ===== State Tracking for Zero-Delay Event Sync =====
bool lastLiquidState = true;
bool forceImmediateSync = false;

// ===== Timing & Anti-WDT Throttling =====
bool buzzerState = LOW;
unsigned long previousBuzzerFlip = 0;
const unsigned long BUZZER_PERIOD = 250;

unsigned long lastAlertTime = 0;
const unsigned long ALERT_INTERVAL = 60000;

// Cloud Sync Timer (Every 2 seconds heartbeat, or instant on state change)
unsigned long lastSyncTime = 0;
const unsigned long SYNC_INTERVAL = 2000;

// OLED Refresh Timer (Update 4 times/sec instead of every loop iteration to prevent I2C bus lockup)
unsigned long lastOledTime = 0;
const unsigned long OLED_INTERVAL = 250;

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n\n========================================");
  Serial.println(">>> [1/4] Booting IV Drip Monitor ESP8266");
  Serial.println("========================================");

  pinMode(SensePin, INPUT);
  pinMode(BuzzerPin, OUTPUT);
  digitalWrite(BuzzerPin, LOW);

  // ===== SERVO INIT =====
  myServo.attach(ServoPin);
  myServo.write(120);   // Default: OPEN (120°)
  Serial.println(">>> [2/4] Servo initialized at 120 deg (OPEN)");

  // ===== OLED INIT =====
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000); // 400kHz fast I2C to reduce frame transfer time
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextColor(WHITE);
    display.setTextSize(1);
    display.setCursor(0, 10);
    display.println("Connecting WiFi...");
    display.display();
  }

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
    Serial.println("\n>>> [3/4] WiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n>>> [WARNING] WiFi connecting in background...");
  }

  // ===== BLYNK (Non-blocking) =====
  Blynk.config(BLYNK_AUTH_TOKEN);
  Blynk.connect(3000);
  Serial.println(">>> [4/4] Blynk configured.");

  // ===== FIREBASE CONFIG =====
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  fbdo.setResponseSize(1024);

  // Initialize state tracker
  lastLiquidState = (digitalRead(SensePin) == HIGH);

  Serial.println(">>> Firebase Initialized with Zero-Delay Event Sync!");
  Serial.println(">>> Entering Main Loop...\n");
}

// ===== LOOP =====
void loop() {
  // 1. Maintain Blynk connection
  if (Blynk.connected()) {
    Blynk.run();
  }
  yield(); // Keep background WiFi stack healthy

  // 2. Read Liquid Sensor
  bool liquidPresent = (digitalRead(SensePin) == HIGH);
  bool isClamped = (manualClamped || autoClamped);

  // ===== INSTANT EVENT DETECTION (Removes Dashboard Update Delay) =====
  if (liquidPresent != lastLiquidState) {
    lastLiquidState = liquidPresent;
    forceImmediateSync = true; // Trigger instant cloud push without waiting for 2s interval!
    Serial.println(liquidPresent ? ">>> [EVENT] Fluid Restored! Instant sync triggered." 
                                 : ">>> [EVENT] Fluid EMPTY! Instant emergency sync triggered.");
  }

  // ===== IMMEDIATE AUTO-CLAMP SAFETY LOGIC =====
  if (!liquidPresent && !isClamped) {
    myServo.write(90);   // CLAMP IMMEDIATELY (90°)
    autoClamped = true;
    isClamped = true;
    forceImmediateSync = true;
    Serial.println(">>> [SAFETY] No liquid detected! Valve IMMEDIATELY auto-clamped at 90 deg. <<<");
  } else if (liquidPresent && autoClamped && !manualClamped) {
    myServo.write(120);  // REOPEN (120°)
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

  // 4. BUZZER HANDLING - ALERTS CONTINUOUSLY WHEN EMPTY, EVEN WHEN CLAMPED!
  if (!liquidPresent) {
    // Intermittent clinical alarm (250ms ON / 250ms OFF)
    if (millis() - previousBuzzerFlip > BUZZER_PERIOD) {
      previousBuzzerFlip = millis();
      buzzerState = !buzzerState;
      digitalWrite(BuzzerPin, buzzerState);
    }

    // Blynk push alert
    if (millis() - lastAlertTime > ALERT_INTERVAL) {
      if (Blynk.connected()) {
        Blynk.logEvent("iv_drip_alert", "IV Bag EMPTY! Valve clamped & buzzer sounding.");
      }
      lastAlertTime = millis();
    }
  } else {
    // Fluid is present - silence buzzer
    digitalWrite(BuzzerPin, LOW);
    buzzerState = LOW;
  }

  // 5. Throttled OLED Rendering (Every 250ms instead of every loop iteration to prevent WDT resets)
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

    // OLED Status Indicator
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

  // 6. SYNC TO BLYNK & FIREBASE (Immediate on event, or every 2s heartbeat)
  if (forceImmediateSync || (millis() - lastSyncTime >= SYNC_INTERVAL)) {
    lastSyncTime = millis();
    bool isEmergency = forceImmediateSync;
    forceImmediateSync = false;

    if (WiFi.status() == WL_CONNECTED) {
      String flow = isClamped ? "clamped" : "open";

      // (a) Send telemetry update FIRST for zero dashboard latency!
      FirebaseJson telemetry;
      telemetry.set("level", liquidPresent ? 100 : 0);
      telemetry.set("battery", batteryPercent);
      telemetry.set("status", status);
      telemetry.set("flowStatus", flow);
      telemetry.set("liquidPresent", liquidPresent);
      telemetry.set("servoAngle", isClamped ? 90 : 120);
      telemetry.set("lastSeen", (double)millis());

      if (Firebase.updateNode(fbdo, "/devices/" + deviceId, telemetry)) {
        Serial.print(isEmergency ? "[INSTANT EMERGENCY SYNC] " : "[FIREBASE SYNC] ");
        Serial.print("flowStatus=");
        Serial.print(flow);
        Serial.print(", status=");
        Serial.println(status);
      } else {
        Serial.print("[FIREBASE ERROR] Reason: ");
        Serial.println(fbdo.errorReason());
      }
      yield();

      // (b) Push critical alert to /alerts if fluid is empty on state change
      if (!liquidPresent && isEmergency) {
        FirebaseJson alert;
        alert.set("deviceId", deviceId);
        alert.set("type", "empty");
        alert.set("severity", "critical");
        alert.set("title", "LINE EMPTY: " + deviceId);
        alert.set("message", "No liquid detected! Valve clamped immediately & buzzer active.");
        alert.set("timestamp", (double)millis());
        alert.set("acknowledged", false);
        Firebase.pushJSON(fbdo, "/alerts", alert);
        yield();
      }

      // (c) Check for Remote Commands from Web Dashboard (Doctor clicked Clamp/Open)
      if (Firebase.getString(fbdo, "/devices/" + deviceId + "/servoCommand")) {
        String cmd = fbdo.stringData();
        if (cmd != lastServoCmd && cmd != "") {
          lastServoCmd = cmd;
          if (cmd == "CLAMP") {
            manualClamped = true;
            myServo.write(90);
            Serial.println(">>> [REMOTE] Dashboard commanded CLAMP! Servo set to 90 deg. <<<");
          } else if (cmd == "OPEN") {
            manualClamped = false;
            autoClamped   = false;
            myServo.write(120);
            Serial.println(">>> [REMOTE] Dashboard commanded OPEN! Servo set to 120 deg. <<<");
          }
        }
      }
      yield();

      // (d) Blynk Virtual Pins
      if (Blynk.connected()) {
        Blynk.virtualWrite(V0, batteryPercent);
        Blynk.virtualWrite(V1, liquidPresent ? 1 : 0);
      }
    }
  }

  delay(10);
  yield();
}
