#ifndef CONFIG_H
#define CONFIG_H

// ============== WIFI / DASHBOARD ==============
#define WIFI_SSID       "LAPTOP-1LEKFV4G 8819"
#define WIFI_PASSWORD   "43i8/Q66"
#define SERVER_URL      "https://taskcanvas.me/api/sensors"
#define API_KEY         "akul617"
#define DEVICE_ID       "esp32-01"

// ============== PIN CONFIGURATION ==============
#define SDA_PIN         21
#define SCL_PIN         22
#define GPS_RX          16
#define GPS_TX          17
#define SHARP_PIN       34
#define TRIG_PIN        12
#define ECHO_PIN        14
#define RED_LED         25
#define GREEN_LED       32
#define BLUE_LED        33
#define BUZZER_PIN      26
#define EMERGENCY_SW    27

// ============== THRESHOLDS ==============
#define OBSTACLE_THRESHOLD_CM  50.0
#define TILT_THRESHOLD_DEG     35.0
#define TILT_HOLD_MS           1000
#define SENSOR_INTERVAL_MS     100
#define DASHBOARD_INTERVAL_MS  2000
#define PACKET_INTERVAL_MS     500

// GPS fallback: clearly marked as NOT a live GPS fix
#define FALLBACK_LAT  28.7975
#define FALLBACK_LON  77.5389

// ============== SENSOR CONFIG ==============
#define MPU_I2C_ADDR          0x68
#define GPS_BAUD              9600
#define ULTRASONIC_TIMEOUT_US 30000
#define ADC_RESOLUTION        12
#define ADC_ATTENUATION       ADC_11db

// LED / BUZZER
#define LED_PWM_FREQ          5000
#define LED_PWM_RES           8

#endif