# ESP32 Sensor Node - VELOLINK

## Hardware Required

| Component | Model | Interface | ESP32 Pins |
|-----------|-------|-----------|------------|
| IMU | MPU6050 | I²C | SDA: GPIO21, SCL: GPIO22 |
| GPS | NEO-6M | UART2 | RX: GPIO16, TX: GPIO17 |
| Ultrasonic | HC-SR04 | GPIO | TRIG: GPIO12, ECHO: GPIO14 |
| IR Distance | Sharp GP2Y0A21 | Analog | ADC: GPIO34 |
| RGB LED | Common Cathode | GPIO | R: GPIO25, G: GPIO32, B: GPIO33 |
| Buzzer | Active | GPIO | GPIO26 |
| Emergency Switch | Tactile | GPIO | GPIO27 (pull-up) |

## Wiring Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ESP32 DevKit V1                          │
│                                                                 │
│   3.3V ──────────────────────┬── MPU6050 VCC                    │
│                              ├── NEO-6M VCC                      │
│                              ├── HC-SR04 VCC                     │
│                              ├── Sharp GP2Y0A21 VCC              │
│                              └── Emergency Switch (other side)   │
│                                                                 │
│   GND ──────────────────────┬── MPU6050 GND                      │
│                              ├── NEO-6M GND                      │
│                              ├── HC-SR04 GND                     │
│                              ├── Sharp GP2Y0A21 GND              │
│                              ├── RGB LED Cathode (common)        │
│                              └── Buzzer GND                      │
│                                                                 │
│   GPIO21 (SDA) ────────────── MPU6050 SDA                        │
│   GPIO22 (SCL) ────────────── MPU6050 SCL                        │
│                                                                 │
│   GPIO16 (RX2) ────────────── NEO-6M TX                          │
│   GPIO17 (TX2) ────────────── NEO-6M RX                          │
│                                                                 │
│   GPIO12 ──────────────────── HC-SR04 TRIG                        │
│   GPIO14 ──────────────────── HC-SR04 ECHO                        │
│                                                                 │
│   GPIO34 (ADC1_CH6) ───────── Sharp GP2Y0A21 Signal (Vo)        │
│                                                                 │
│   GPIO25 ──────────────────── RGB LED Red (via 220Ω)             │
│   GPIO32 ──────────────────── RGB LED Green (via 220Ω)           │
│   GPIO33 ──────────────────── RGB LED Blue (via 220Ω)            │
│                                                                 │
│   GPIO26 ──────────────────── Buzzer +                           │
│                                                                 │
│   GPIO27 ──────────────────── Emergency Switch (other side GND)  │
│        (INPUT_PULLUP)                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Pin Details

### MPU6050 (I²C)
- VCC → 3.3V
- GND → GND
- SDA → GPIO21
- SCL → GPIO22

### NEO-6M GPS (UART2)
- VCC → 3.3V or 5V (check module)
- GND → GND
- TX → GPIO16 (ESP32 RX2)
- RX → GPIO17 (ESP32 TX2)
- Baud: 9600

### HC-SR04 Ultrasonic
- VCC → 5V
- GND → GND
- TRIG → GPIO12
- ECHO → GPIO14
- **Note**: ECHO pin needs voltage divider (5V → 3.3V)

### Sharp GP2Y0A21 (Analog)
- VCC → 5V
- GND → GND
- Vo (Signal) → GPIO34 (ADC1_CH6, input only)
- Range: 10-80cm, non-linear output

### RGB LED (Common Cathode)
- Common Cathode → GND
- Red Anode → GPIO25 (via 220Ω)
- Green Anode → GPIO32 (via 220Ω)
- Blue Anode → GPIO33 (via 220Ω)

### Active Buzzer
- VCC → 3.3V
- GND → GND
- Signal → GPIO26

### Emergency Switch
- One leg → GPIO27
- Other leg → GND
- Internal pull-up enabled (INPUT_PULLUP)
- Pressed = LOW, Released = HIGH

## Software Setup

### Arduino IDE Libraries
1. **Adafruit MPU6050** (v2.x)
2. **Adafruit Unified Sensor** (v1.x)
3. **Adafruit BusIO** (v1.x)
4. **TinyGPSPlus** (v1.x)
5. **ESP32 Board Package** (Espressif v2.x+)

### Configuration
Edit `config.h`:
```c
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define SERVER_URL "http://192.168.137.107:3000/api/sensors"
#define API_KEY "akul617"
```

### ESP-NOW
Uses broadcast address (FF:FF:FF:FF:FF:FF) on current WiFi channel.
Set specific peer MAC in `broadcastAddress[]` if needed.

## Flashing

1. Open `esp32_sensor_node.ino` in Arduino IDE
2. Tools → Board → ESP32 Arduino → ESP32 Dev Module
3. Tools → Port → (your COM port)
4. Tools → Upload Speed → 921600
5. Click Upload
6. Open Serial Monitor (115200 baud)

## Serial Monitor Output

```
Connecting to Wi-Fi... 
ESP32 IP: 192.168.x.x
Wi-Fi channel: 1
Keep MPU6050 still: calibrating orientation...
MPU6050 baseline ready
ESP-NOW master ready
VELOLINK sender ready

===== VELOLINK STATUS =====
MPU ready: YES
Pitch / roll / tilt: 0.1 / -0.2 / 0.3
Ultrasonic cm: 45.2
Sharp estimated cm: 44.8
Emergency switch: OFF
GPS live: 28.797500, 77.538900

Dashboard HTTP status: 200
{"message":"Data received successfully","status":"ok"}
ESP-NOW packet queued: YES | Event code: 0
```

## LED Status Codes

| Pattern | Meaning |
|---------|---------|
| Red solid | Emergency (SOS pressed or tilt crash detected) |
| Yellow solid | Obstacle detected (ultrasonic < 50cm) |
| Green solid | Normal operation |
| Red pulse | Emergency active |

## Emergency Behavior

| Event | Trigger | LED | Buzzer | ESP-NOW Code |
|-------|---------|-----|--------|--------------|
| Manual SOS | Switch pressed | Red | ON | 1 |
| Tilt/Crash | >35° for 1s | Red | ON | 2 |
| Obstacle | Ultrasonic < 50cm | Yellow | ON | 3 |
| Status | Normal | Green | OFF | 0 |

## Data Payload (HTTP Dashboard)

```json
{
  "device_id": "esp32-01",
  "uptime_ms": 123456,
  "mpu6050": {
    "ok": true,
    "accel_x": 0.1,
    "accel_y": -0.2,
    "accel_z": 9.81,
    "accel_magnitude": 9.81,
    "pitch_deg": 0.5,
    "roll_deg": -0.3,
    "tilt_deg": 0.6
  },
  "ultrasonic": {
    "distance_cm": 45.2,
    "obstacle_detected": false
  },
  "sharp_ir": {
    "voltage": 1.234,
    "distance_cm": 44.8
  },
  "gps_valid": true,
  "gps_fallback": false,
  "latitude": 28.797500,
  "longitude": 77.538900,
  "gps_speed_kmph": 5.2,
  "emergency_button": false,
  "crash_detected": false,
  "wifi_rssi_dbm": -45
}
```

## ESP-NOW Binary Payload

```c
struct EmergencyPacket {
  uint32_t sequence;      // Incrementing counter
  uint8_t eventCode;      // 0=status, 1=SOS, 2=tilt, 3=obstacle
  uint8_t gpsValid;       // 1=live GPS, 0=fallback
  uint8_t gpsFallback;    // Inverse of gpsValid
  uint8_t reserved;       // Padding
  float latitude;         // Degrees * 1e6
  float longitude;        // Degrees * 1e6
  float ultrasonicCm;     // Distance
  float sharpCm;          // IR distance
  float tiltDegrees;      // Current tilt
  float acceleration;     // Accel magnitude
};
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MPU6050 not found | Check I²C wiring, 3.3V power, try 4.7kΩ pull-ups |
| GPS no fix | Move outdoors, wait 1-5 min for cold start |
| Ultrasonic -1 cm | Check TRIG/ECHO wiring, voltage divider on ECHO |
| IR distance wrong | Verify 5V supply, ADC pin (GPIO34 only!) |
| LED wrong color | Check common anode vs cathode, pin mapping |
| Buzzer too quiet | Use transistor driver, check 3.3V vs 5V buzzer |
| ESP-NOW not sending | Ensure WiFi.mode(WIFI_STA), peer MAC correct |
| WiFi won't connect | 2.4GHz only, check SSID/password |

## Calibration

### MPU6050
- On startup, keep device completely still for 2 seconds
- Baseline pitch/roll recorded
- Tilt measured relative to baseline

### Sharp GP2Y0A21
Default formula: `distance = 29.988 * V^-1.173`
Calibrate by measuring known distances and adjusting coefficients.