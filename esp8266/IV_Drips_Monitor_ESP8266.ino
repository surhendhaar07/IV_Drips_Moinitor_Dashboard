#define BLYNK_TEMPLATE_ID "TMPL3cRFO-a6I"
#define BLYNK_TEMPLATE_NAME "IV Drips Monitor"
#define BLYNK_AUTH_TOKEN "Og3k7JHKay-1w_Qhp3zPnEQ8KPPs0fkg"

// ===== Libraries =====
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <Servo.h>

// ===== Firebase Libraries =====
#include <FirebaseESP8266.h>

// Single FirebaseData object (keeps RAM usage low and avoids SSL socket exhaustion)
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ===== OLED Setup =====
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ===== Pin Config =====
const byte SensePin  = D5;   // XKC-Y25 Liquid Sensor (HIGH: Liquid Present, LOW: Empty)
const byte BuzzerPin = D6;   // Active Buzzer
const byte ServoPin  = D4;   // SG90 Micro Servo (D4 / GPIO 2)
const byte SDA_PIN   = D1;   // OLED SDA
const byte SCL_PIN   = D2;   // OLED SCL

// ===== Servo Setup =====
Servo myServo;
bool manualClamped = false; // Commanded via Web Dashboard (Doctor/Nurse)
bool autoClamped   = false; // Triggered by 60s empty liquid timer

// ===== Servo Timing =====
unsigned long noLiquidStartTime = 0;
bool timerStarted = false;
const unsigned long CLAMP_DELAY = 60000; // 60 seconds latch delay (change to 5000 for quick bench test)

// ===== Wi-Fi Credentials =====
// IMPORTANT: If using Windows Laptop Hotspot, ensure 'Network band' is set to 2.4 GHz (ESP8266 does not support 5 GHz)
char ssid[] = "LAPTOP-SIJFUAAV 3156";
char pass[] = "priiyaa3";

// ===== Firebase RTDB Credentials =====
// Target Database: https://iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com/
#define FIREBASE_HOST "iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "iRYSiGLJNU884wdLmOskwnNttTd36r8tp6rfFycb"
#define DATABASE_URL  "https://iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com"

// ===== DEVICE ID =====
String deviceId = "IV-DEVICE-001"; // Set to IV-DEVICE-001, IV-DEVICE-002, etc.

// ===== Timing ===== 
bool buzzerState = LOW;
unsigned long previousFlip = 0;
const unsigned long PERIOD = 250; // 250ms buzzer beep interval

unsigned long lastAlertTime = 0;
const unsigned long ALERT_INTERVAL = 60000; // 60s alert throttle to prevent Firebase flooding
bool emptyAlertLogged = false;

// Cloud Sync Timer (Every 2 seconds to keep Web Dashboard LIVE)
unsigned long lastSyncTime = 0;
const unsigned long SYNC_INTERVAL = 2000;

// =========================================================================
// SETUP
// =========================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n========================================");
  Serial.println(">>> [1/4] Booting IV Drip Monitor NodeMCU");
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
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextColor(WHITE);
    display.setTextSize(1);
    display.setCursor(0, 10);
    display.println("Connecting WiFi...");
    display.setCursor(0, 25);
    display.println(ssid);
    display.display();
  }

  // ===== WIFI =====
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(ssid, pass);
  Serial.print(">>> Connecting to WiFi: ");
  Serial.println(ssid);
  
  // Wait up to 25 seconds for Wi-Fi / Hotspot connection
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 50) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n>>> [3/4] WiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n>>> [WARNING] WiFi connecting in background. Ensure hotspot band is 2.4 GHz!");
  }

  // ===== BLYNK (Non-blocking) =====
  Blynk.config(BLYNK_AUTH_TOKEN);
  Blynk.connect(2000);
  Serial.println(">>> Blynk configured.");

  // ===== FIREBASE CONFIG (Clean Database Secret / Legacy Token Authentication) =====
  // NOTE: When using Database Secret, we MUST NOT set config.api_key or config.signer.test_mode.
  // Setting api_key makes the library attempt Google OAuth token exchange which fails with a secret token!
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  fbdo.setResponseSize(1024);
  fbdo.setBSSLBufferSize(1024, 512);

  Serial.println(">>> [4/4] Testing Firebase RTDB connection...");
  fbdo.clear();
  if (Firebase.getString(fbdo, "/devices/" + deviceId + "/servoCommand")) {
    Serial.println(">>> [SUCCESS] Firebase RTDB Connected & Initialized!");
  } else {
    Serial.print(">>> [NOTICE] Firebase connect note: ");
    Serial.println(fbdo.errorReason());
  }

  Serial.println(">>> Entering Main Telemetry Loop...\n");
}

// =========================================================================
// MAIN LOOP
// =========================================================================
void loop() {
  if (Blynk.connected()) {
    Blynk.run();
  }
  yield();

  bool liquidPresent = (digitalRead(SensePin) == HIGH);
  bool isClamped = (manualClamped || autoClamped);

  // ===== AUTO-CLAMP SAFETY LOGIC =====
  if (!liquidPresent && !isClamped) {
    if (!timerStarted) {
      noLiquidStartTime = millis();
      timerStarted = true;
      Serial.println("[TIMER] Fluid empty! Auto-clamp timer started...");
    }

    // Auto-clamp when 60s timer expires
    if (millis() - noLiquidStartTime >= CLAMP_DELAY) {
      myServo.write(90);   // CLAMP (90°)
      autoClamped = true;
      Serial.println(">>> [SAFETY] Time expired! Auto-clamped valve at 90 deg. <<<");
    }
  } else if (liquidPresent && !isClamped) {
    timerStarted = false;
  }

  // ===== BATTERY CALCULATION =====
  int raw = analogRead(A0);
  int batteryPercent = map(raw, 600, 1023, 0, 100);
  batteryPercent = constrain(batteryPercent, 0, 100);

  String status = "normal";
  if (!liquidPresent) {
    status = "empty";
  } else if (batteryPercent < 20) {
    status = "low";
  }

  // ===== OLED & BUZZER HANDLING =====
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
    digitalWrite(BuzzerPin, LOW);

    // Auto-open only if auto-clamped by empty bottle, NOT if manually clamped by Doctor
    if (autoClamped && !manualClamped) {
      myServo.write(120);
      autoClamped = false;
      timerStarted = false;
      emptyAlertLogged = false;
      Serial.println("[SERVO] Liquid restored. Auto-clamped valve reopened to 120 deg.");
    }
  } else {
    display.println("No Liquid");
    display.setCursor(0, 45);
    display.println("Available");

    // 250ms flip buzzer until clamped
    if (millis() - previousFlip > PERIOD && !isClamped) {
      previousFlip = millis();
      buzzerState = !buzzerState;
      digitalWrite(BuzzerPin, buzzerState);
    } else if (isClamped) {
      digitalWrite(BuzzerPin, LOW);
    }

    // Alert push to Blynk
    if (millis() - lastAlertTime > ALERT_INTERVAL) {
      if (Blynk.connected()) {
        Blynk.logEvent("iv_drip_alert", "IV Bag EMPTY! Check immediately.");
      }
      lastAlertTime = millis();
    }
  }

  // OLED Status Indicator
  display.setTextSize(1);
  display.setCursor(80, 0);
  if (isClamped) {
    display.print("CLAMPED");
  } else if (!liquidPresent) {
    display.print("WAITING");
  } else {
    display.print("OPEN");
  }
  display.display();
  yield();

  // ===== SYNC TO BLYNK & FIREBASE (Every 2 Seconds) =====
  if (millis() - lastSyncTime >= SYNC_INTERVAL) {
    lastSyncTime = millis();

    if (WiFi.status() == WL_CONNECTED) {
      // 1. Check for Remote Commands from Web Dashboard (Doctor/Nurse clicked Toggle Clamp)
      fbdo.clear();
      if (Firebase.getString(fbdo, "/devices/" + deviceId + "/servoCommand")) {
        String cmd = fbdo.stringData();
        cmd.trim();
        if (cmd == "CLAMP" && !autoClamped && !manualClamped) {
          manualClamped = true;
          myServo.write(90);
          Serial.println(">>> [REMOTE] Dashboard commanded CLAMP! Servo set to 90 deg. <<<");
        } else if (cmd == "OPEN" && (manualClamped || autoClamped)) {
          manualClamped = false;
          autoClamped   = false;
          timerStarted  = false;
          myServo.write(120);
          Serial.println(">>> [REMOTE] Dashboard commanded OPEN! Servo set to 120 deg. <<<");
        }
      }
      yield();

      isClamped = (manualClamped || autoClamped);
      String flow = isClamped ? "clamped" : (!liquidPresent ? "waiting" : "open");

      // 2. Batched Firebase RTDB Update (Only essential variables from the analyzed code)
      String jsonPayload = "{\"level\":" + String(liquidPresent ? 100 : 0) +
                           ",\"battery\":" + String(batteryPercent) +
                           ",\"status\":\"" + status + "\"" +
                           ",\"flowStatus\":\"" + flow + "\"" +
                           ",\"lastSeen\":" + String(millis()) + "}";

      FirebaseJson telemetry;
      telemetry.setJsonData(jsonPayload);

      fbdo.clear();
      if (Firebase.updateNode(fbdo, "/devices/" + deviceId, telemetry)) {
        Serial.print("[FIREBASE SUCCESS] flowStatus=");
        Serial.print(flow);
        Serial.print(" | level=");
        Serial.print(liquidPresent ? 100 : 0);
        Serial.print(" | battery=");
        Serial.print(batteryPercent);
        Serial.print("% | lastSeen=");
        Serial.println(millis());
      } else {
        Serial.print("[FIREBASE ERROR] Reason: ");
        Serial.println(fbdo.errorReason());
      }
      yield();

      // 3. Blynk Virtual Pins
      if (Blynk.connected()) {
        Blynk.virtualWrite(V0, batteryPercent);
        Blynk.virtualWrite(V1, liquidPresent ? 1 : 0);
      }

      // 4. Emergency Alert Logging to Firebase /alerts/ (Once per empty cycle, throttled)
      if (!liquidPresent) {
        if (!emptyAlertLogged || (millis() - lastAlertTime > ALERT_INTERVAL)) {
          emptyAlertLogged = true;
          lastAlertTime = millis();
          String alertPath = "/alerts/" + String(millis());

          String alertPayload = "{\"type\":\"empty\"" +
                                String(",\"deviceId\":\"") + deviceId + "\"" +
                                String(",\"level\":0") +
                                String(",\"battery\":") + String(batteryPercent) +
                                String(",\"timestamp\":") + String(millis()) +
                                String(",\"acknowledged\":false}");

          FirebaseJson alertJson;
          alertJson.setJsonData(alertPayload);

          fbdo.clear();
          Firebase.set(fbdo, alertPath, alertJson);
          Serial.println(">>> [ALERT LOGGED] Emergency LINE EMPTY written to Firebase /alerts/ <<<");
        }
      } else {
        emptyAlertLogged = false;
      }
    }
  }

  delay(20);
}
