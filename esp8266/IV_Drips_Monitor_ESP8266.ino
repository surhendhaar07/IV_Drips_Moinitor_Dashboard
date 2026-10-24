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

// ===== Servo Setup =====
Servo myServo;
bool manualClamped = false; // Doctor commanded via Web Dashboard
bool autoClamped   = false; // Triggered by fluid empty timer
String lastServoCmd = "";

// ===== Servo Timing =====
unsigned long noLiquidStartTime = 0;
bool timerStarted = false;
const unsigned long CLAMP_DELAY = 60000; // 60000 for 1 minute

// ===== Wi-Fi Credentials =====
char ssid[] = "LAPTOP-SIJFUAAV 3156";
char pass[] = "priiyaa3";

// ===== Firebase Credentials =====
#define DATABASE_URL "https://iv-drips-monitor-8-e6682-default-rtdb.firebaseio.com"
#define DATABASE_SECRET "iRYSiGLJNU884wdLmOskwnNttTd36r8tp6rfFycb"

// ===== DEVICE ID =====
String deviceId = "IV-DEVICE-001";

// ===== Timing ===== 
bool buzzerState = LOW;
unsigned long previousFlip = 0;
const unsigned long PERIOD = 250;
unsigned long lastAlertTime = 0;
const unsigned long ALERT_INTERVAL = 60000;

// Cloud Sync Timer (Every 2 seconds)
unsigned long lastSyncTime = 0;
const unsigned long SYNC_INTERVAL = 1000;

// ===== Setup =====
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
  myServo.attach(D4);
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
    display.display();
  }

  // ===== WIFI =====
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  Serial.print(">>> Connecting to WiFi: ");
  Serial.println(ssid);
  
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 30) {
    delay(400);
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

  Serial.println(">>> Firebase Initialized with Database Secret!");
  Serial.println(">>> Entering Main Loop...\n");
}

// ===== LOOP =====
void loop() {
  if (Blynk.connected()) {
    Blynk.run();
  }

  bool liquidPresent = (digitalRead(SensePin) == HIGH);
  bool isClamped = (manualClamped || autoClamped);

  // ===== AUTO-CLAMP SAFETY LOGIC (Only runs if NOT manually clamped by Doctor) =====
  if (!liquidPresent && !isClamped) {
    if (!timerStarted) {
      noLiquidStartTime = millis();
      timerStarted = true;
      Serial.println("[TIMER] Fluid empty! Auto-clamp timer started...");
    }

    // Auto-clamp when timer expires
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

  String status = liquidPresent ? "normal" : "empty";
  if (!liquidPresent && batteryPercent < 20) status = "low";

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

    // Only auto-open if it was auto-clamped by empty bottle, NOT if manually clamped by Doctor!
    if (autoClamped && !manualClamped) {
      myServo.write(120);
      autoClamped = false;
      timerStarted = false;
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
      digitalWrite(BuzzerPin, LOW); // Silence buzzer once clamped
    }

    // Alert push
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

  // ===== SYNC TO BLYNK & FIREBASE EVERY 2 SECONDS =====
  if (millis() - lastSyncTime >= SYNC_INTERVAL) {
    lastSyncTime = millis();

    // 1. Check for Remote Commands from Web Dashboard (Doctor clicked Clamp/Open)
    if (Firebase.getString(fbdo, "/devices/" + deviceId + "/servoCommand")) {
      String cmd = fbdo.stringData();
      if (cmd != lastServoCmd && cmd != "") {
        lastServoCmd = cmd;
        if (cmd == "CLAMP") {
          manualClamped = true;
          myServo.write(90); // Physically turn servo to 90°
          Serial.println(">>> [REMOTE] Dashboard commanded CLAMP! Servo set to 90 deg. <<<");
        } else if (cmd == "OPEN") {
          manualClamped = false;
          autoClamped   = false;
          timerStarted  = false;
          myServo.write(120); // Physically turn servo to 120°
          Serial.println(">>> [REMOTE] Dashboard commanded OPEN! Servo set to 120 deg. <<<");
        }
      }
    }

    // Recalculate clamped state after checking remote command
    isClamped = (manualClamped || autoClamped);

    // 2. Determine Flow Status string for Web Dashboard & Firebase
    String flow = isClamped ? "clamped" : (!liquidPresent ? "waiting" : "open");

    // 3. Blynk Virtual Pins
    if (Blynk.connected()) {
      Blynk.virtualWrite(V0, batteryPercent);
      Blynk.virtualWrite(V1, liquidPresent ? 1 : 0);
    }

    // 4. Batched Firebase RTDB Update
    FirebaseJson telemetry;
    telemetry.set("level", liquidPresent ? 100 : 0);
    telemetry.set("battery", batteryPercent);
    telemetry.set("status", status);
    telemetry.set("flowStatus", flow);
    telemetry.set("lastSeen", (double)millis());

    if (Firebase.updateNode(fbdo, "/devices/" + deviceId, telemetry)) {
      Serial.print("[FIREBASE SUCCESS] flowStatus=");
      Serial.print(flow);
      Serial.print(", lastSeen=");
      Serial.println(millis());
    } else {
      Serial.print("[FIREBASE ERROR] Reason: ");
      Serial.println(fbdo.errorReason());
    }
  }

  delay(20);
}

