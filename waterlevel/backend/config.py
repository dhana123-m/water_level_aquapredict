# config.py
# Central configuration for the Water Level Prediction system

# ----------------------------
# Flask Configuration
# ----------------------------
SECRET_KEY = "waterlevel_secret_key_change_in_production"


# ----------------------------
# MySQL Database Configuration
# ----------------------------
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "gopalaias",
    "database": "waterlevel_db",
    "port": 3306
}


# ----------------------------
# Application Constants
# ----------------------------
# Number of days to predict
PREDICTION_DAYS = 30

# Weather forecast days (Open-Meteo limit)
WEATHER_FORECAST_DAYS = 16

# Timezone for weather data
TIMEZONE = "Asia/Kolkata"

# Default TTS voice
TTS_VOICE = "en-IN-PrabhatNeural"

# Directory to store generated audio files
AUDIO_OUTPUT_DIR = "backend/audio"
