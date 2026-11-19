#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <esp_task_wdt.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <TinyGPSPlus.h>
#include <math.h>

#include "config.h"

// ============== SENSORS ==============
Adafruit_MPU6050 mpu;
TinyGPSPlus gps;

bool mpuReady = false;
bool espNowReady = false;
bool baselineReady = false;
bool tiltEmergency = false;
bool manualSOS = false;
bool obstacleDetected = false;
bool crashOrTiltDetected = false;

float ax = 0, ay = 0, az = 0;
float gx = 0, gy = 0, gz = 0;
float accelMagnitude = 0;

float pitchBaseline = 0;
float rollBaseline = 0;
float pitchNow = 0;
float rollNow = 0;
float tiltAngle = 0;

float ultrasonicCm = -1;
float sharpVoltage = 0;
float sharpDistanceCm = -1;

unsigned long tiltStartMs = 0;
unsigned long lastSensorRead = 0;
unsigned long lastDashboardSend = 0;
unsigned long lastPacketSend = 0;
uint32_t sequenceNumber = 0;

// ESP-NOW broadcast address
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// Keep packet layout identical on the receiver
struct EmergencyPacket {
  uint32_t sequence;
  uint8_t eventCode;   // 0=status, 1=SOS, 2=tilt, 3=obstacle
  uint8_t gpsValid;
  uint8_t gpsFallback;
  uint8_t reserved;
  float latitude;
  float longitude;
  float ultrasonicCm;
  float sharpCm;
  float tiltDegrees;
  float acceleration;
};

// ============== LED / BUZZER ==============
void setRGB(bool r, bool g, bool b) {
  digitalWrite(RED_LED, r);
  digitalWrite(GREEN_LED, g);
  digitalWrite(BLUE_LED, b);
}

void updateAlerts() {
  bool emergency = manualSOS || crashOrTiltDetected;

  if (emergency) {
    setRGB(true, false, false);  // Red
    digitalWrite(BUZZER_PIN, HIGH);
  } else if (obstacleDetected) {
    setRGB(true, true, false);   // Yellow
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    setRGB(false, true, false);  // Green
    digitalWrite(BUZZER_PIN, LOW);
  }
}

// ============== ANGLE HELPERS ==============
float wrapAngle(float angle) {
  while (angle > 180.0) angle -= 360.0;
  while (angle < -180.0) angle += 360.0;
  return angle;
}

void calculateAngles(float x, float y, float z,
                     float &pitch, float &roll) {
  pitch = atan2(-x, sqrt(y * y + z * z)) * 180.0 / PI;
  roll  = atan2(y, z) * 180.0 / PI;
}

void calibrateMPU() {
  if (!mpuReady) return;

  Serial.println("Keep MPU6050 still: calibrating orientation...");

  float pitchSum = 0;
  float rollSum = 0;
  int samples = 0;
  unsigned long start = millis();

  while (millis() - start < 2000) {
    sensors_event_t accel, gyro, temp;
    mpu.getEvent(&accel, &gyro, &temp);

    float p, r;
    calculateAngles(accel.acceleration.x, accel.acceleration.y, accel.acceleration.z, p, r);

    pitchSum += p;
    rollSum += r;
    samples++;

    esp_task_wdt_reset();
    delay(20);
  }

  if (samples > 0) {
    pitchBaseline = pitchSum / samples;
    rollBaseline = rollSum / samples;
    baselineReady = true;
    Serial.println("MPU6050 baseline ready");
  } else {
    Serial.println("MPU6050 baseline failed");
  }
}

// ============== ULTRASONIC ==============
float readUltrasonicCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, ULTRASONIC_TIMEOUT_US);

  if (duration == 0) return -1;
  return duration * 0.0343 / 2.0;
}

// ============== WIFI ==============
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi...");
  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
    esp_task_wdt_reset();
    delay(300);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Wi-Fi channel: ");
    Serial.println(WiFi.channel());
  } else {
    Serial.println("Wi-Fi not connected");
  }
}

// ============== ESP-NOW ==============
bool setupESPNow() {
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return false;
  }

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, broadcastAddress, 6);
  peer.channel = 0;
  peer.encrypt = false;

  if (esp_now_add_peer(&peer) != ESP_OK) {
    Serial.println("ESP-NOW peer setup failed");
    return false;
  }

  Serial.println("ESP-NOW master ready");
  return true;
}

void sendEmergencyPacket(uint8_t eventCode) {
  if (!espNowReady) return;

  bool liveGPS = gps.location.isValid();

  EmergencyPacket packet = {};
  packet.sequence = ++sequenceNumber;
  packet.eventCode = eventCode;
  packet.gpsValid = liveGPS ? 1 : 0;
  packet.gpsFallback = liveGPS ? 0 : 1;
  packet.reserved = 0;

  packet.latitude = liveGPS ? gps.location.lat() : FALLBACK_LAT;
  packet.longitude = liveGPS ? gps.location.lng() : FALLBACK_LON;
  packet.ultrasonicCm = ultrasonicCm;
  packet.sharpCm = sharpDistanceCm;
  packet.tiltDegrees = tiltAngle;
  packet.acceleration = accelMagnitude;

  esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *)&packet, sizeof(packet));

  Serial.print("ESP-NOW packet queued: ");
  Serial.print(result == ESP_OK ? "YES" : "NO");
  Serial.print(" | Event code: ");
  Serial.println(eventCode);
}

// ============== DASHBOARD ==============
void sendDashboardData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Dashboard skipped: Wi-Fi disconnected");
    return;
  }

  HTTPClient http;
  http.setTimeout(2000);

  if (!http.begin(SERVER_URL)) {
    Serial.println("HTTP begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  bool liveGPS = gps.location.isValid();

  String json = "{";
  json += "\"device_id\":\"" DEVICE_ID "\",";
  json += "\"uptime_ms\":" + String(millis()) + ",";
  json += "\"mpu6050\":{";
  json += "\"ok\":" + String(mpuReady ? "true" : "false") + ",";
  json += "\"accel_x\":" + String(ax, 3) + ",";
  json += "\"accel_y\":" + String(ay, 3) + ",";
  json += "\"accel_z\":" + String(az, 3) + ",";
  json += "\"accel_magnitude\":" + String(accelMagnitude, 3) + ",";
  json += "\"pitch_deg\":" + String(pitchNow, 2) + ",";
  json += "\"roll_deg\":" + String(rollNow, 2) + ",";
  json += "\"tilt_deg\":" + String(tiltAngle, 2);
  json += "},";

  json += "\"ultrasonic\":{";
  json += "\"distance_cm\":" + String(ultrasonicCm, 1) + ",";
  json += "\"obstacle_detected\":" + String(obstacleDetected ? "true" : "false");
  json += "},";

  json += "\"sharp_ir\":{";
  json += "\"voltage\":" + String(sharpVoltage, 3) + ",";
  json += "\"distance_cm\":" + String(sharpDistanceCm, 1);
  json += "},";

  json += "\"gps_valid\":" + String(liveGPS ? "true" : "false") + ",";
  json += "\"gps_fallback\":" + String(liveGPS ? "false" : "true") + ",";
  json += "\"latitude\":" + String(liveGPS ? gps.location.lat() : FALLBACK_LAT, 6) + ",";
  json += "\"longitude\":" + String(liveGPS ? gps.location.lng() : FALLBACK_LON, 6) + ",";
  json += "\"gps_speed_kmph\":" + String(gps.speed.isValid() ? gps.speed.kmph() : 0.0, 2) + ",";
  json += "\"emergency_button\":" + String(manualSOS ? "true" : "false") + ",";
  json += "\"crash_detected\":" + String(crashOrTiltDetected ? "true" : "false") + ",";
  json += "\"wifi_rssi_dbm\":" + String(WiFi.RSSI());
  json += "}";

  int status = http.POST(json);
  Serial.print("Dashboard HTTP status: ");
  Serial.println(status);

  if (status > 0) {
    Serial.println(http.getString());
  } else {
    Serial.println(http.errorToString(status));
  }

  http.end();
}

// ============== SETUP ==============
void setup() {
  Serial.begin(115200);

  // Initialize task watchdog FIRST - before any blocking operations
  esp_task_wdt_init(30, true);
  esp_task_wdt_add(NULL);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BLUE_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(EMERGENCY_SW, INPUT_PULLUP);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  setRGB(false, false, false);

  analogReadResolution(ADC_RESOLUTION);
  analogSetPinAttenuation(SHARP_PIN, ADC_ATTENUATION);

  Wire.begin(SDA_PIN, SCL_PIN);
  mpuReady = mpu.begin(MPU_I2C_ADDR, &Wire);

  if (mpuReady) {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("MPU6050 detected");
  } else {
    Serial.println("WARNING: MPU6050 NOT DETECTED");
    Serial.println("Tilt detection disabled until it is detected");
  }

  Serial2.begin(GPS_BAUD, SERIAL_8N1, GPS_RX, GPS_TX);

  connectWiFi();
  espNowReady = setupESPNow();

  calibrateMPU();

  Serial.println("VELOLINK sender ready");
}

// ============== MAIN LOOP ==============
void loop() {
  esp_task_wdt_reset();

  // GPS parsing
  while (Serial2.available()) {
    gps.encode(Serial2.read());
  }

  manualSOS = (digitalRead(EMERGENCY_SW) == LOW);

  // Sensor sampling
  if (millis() - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = millis();

    if (mpuReady) {
      sensors_event_t accel, gyro, temp;
      mpu.getEvent(&accel, &gyro, &temp);

      ax = accel.acceleration.x;
      ay = accel.acceleration.y;
      az = accel.acceleration.z;
      gx = gyro.gyro.x;
      gy = gyro.gyro.y;
      gz = gyro.gyro.z;

      accelMagnitude = sqrt(ax * ax + ay * ay + az * az);

      calculateAngles(ax, ay, az, pitchNow, rollNow);

      if (baselineReady) {
        float pitchChange = wrapAngle(pitchNow - pitchBaseline);
        float rollChange = wrapAngle(rollNow - rollBaseline);

        tiltAngle = sqrt(pitchChange * pitchChange + rollChange * rollChange);

        if (tiltAngle >= TILT_THRESHOLD_DEG) {
          if (tiltStartMs == 0) tiltStartMs = millis();

          if (millis() - tiltStartMs >= TILT_HOLD_MS) {
            tiltEmergency = true;
          }
        } else {
          tiltStartMs = 0;
        }
      }
    }

    ultrasonicCm = readUltrasonicCm();
    obstacleDetected = (ultrasonicCm > 0 && ultrasonicCm <= OBSTACLE_THRESHOLD_CM);

    // Sharp IR estimate: GP2Y0A21YK0F only, approximate
    int raw = analogRead(SHARP_PIN);
    sharpVoltage = raw * (3.3f / 4095.0f);

    sharpDistanceCm = -1;

    if (sharpVoltage >= 0.4f && sharpVoltage <= 3.0f) {
      float estimate = 29.988f * pow(sharpVoltage, -1.173f);
      if (estimate >= 10.0f && estimate <= 80.0f) {
        sharpDistanceCm = estimate;
      }
    }

    Serial.println("\n===== VELOLINK STATUS =====");
    Serial.print("MPU ready: ");
    Serial.println(mpuReady ? "YES" : "NO");

    Serial.print("Pitch / roll / tilt: ");
    Serial.print(pitchNow, 1);
    Serial.print(" / ");
    Serial.print(rollNow, 1);
    Serial.print(" / ");
    Serial.println(tiltAngle, 1);

    Serial.print("Ultrasonic cm: ");
    Serial.println(ultrasonicCm, 1);

    Serial.print("Sharp estimated cm: ");
    Serial.println(sharpDistanceCm, 1);

    Serial.print("Emergency switch: ");
    Serial.println(manualSOS ? "ON" : "OFF");

    if (gps.location.isValid()) {
      Serial.print("GPS live: ");
      Serial.print(gps.location.lat(), 6);
      Serial.print(", ");
      Serial.println(gps.location.lng(), 6);
    } else {
      Serial.println("GPS no fix: using marked fallback coordinates");
      Serial.println("28.797500, 77.538900");
    }
  }

  crashOrTiltDetected = tiltEmergency;

  updateAlerts();

  // Event priority: manual SOS > tilt > obstacle > status
  uint8_t eventCode = 0;

  if (manualSOS) {
    eventCode = 1;
  } else if (crashOrTiltDetected) {
    eventCode = 2;
  } else if (obstacleDetected) {
    eventCode = 3;
  }

  if (millis() - lastPacketSend >= PACKET_INTERVAL_MS) {
    lastPacketSend = millis();
    sendEmergencyPacket(eventCode);
  }

  if (millis() - lastDashboardSend >= DASHBOARD_INTERVAL_MS) {
    lastDashboardSend = millis();

    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }

    sendDashboardData();
  }

  delay(10);
}