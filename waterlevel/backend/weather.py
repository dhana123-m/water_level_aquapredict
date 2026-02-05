# weather.py
# Fetch weather forecast using Open-Meteo API

import requests
from config import WEATHER_FORECAST_DAYS, TIMEZONE

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def get_weather(lat, lon):

    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,precipitation_sum",
        "forecast_days": WEATHER_FORECAST_DAYS,
        "timezone": TIMEZONE
    }

    res = requests.get(OPEN_METEO_URL, params=params, timeout=10)

    if res.status_code != 200:
        raise Exception("Weather API failed")

    data = res.json()

    temperature = data["daily"]["temperature_2m_max"][0]
    rainfall = data["daily"]["precipitation_sum"][0]

    return {
        "temperature": temperature,
        "rainfall": rainfall,
        "humidity": 60,        # dummy constant
        "wind_speed": 5        # dummy constant
    }