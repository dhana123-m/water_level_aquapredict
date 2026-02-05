# predict.py
# Handles ML inference & 30-day recursive forecasting

import joblib
import pandas as pd
import numpy as np

from weather import get_weather

MODEL_PATH = "backend/model.pkl"
PREDICTION_DAYS = 30

model = joblib.load(MODEL_PATH)


def run_prediction(latitude, longitude):

    weather = get_weather(latitude, longitude)

    predictions = []

    gw_prev = 10.0
    gw_7 = 10.0
    rain_buffer = [0] * 7

    rain = weather["rainfall"]
    temp = weather["temperature"]

    for i in range(PREDICTION_DAYS):

        rain_buffer.pop(0)
        rain_buffer.append(rain)

        rain_7day = sum(rain_buffer)
        recharge_delay = int(rain_7day > 20)

        gw_trend_7 = (gw_prev - gw_7) / 7

        row = np.array([[  
            latitude,
            longitude,
            rain,
            rain_7day,
            temp,
            gw_prev,
            gw_7,
            gw_trend_7,
            recharge_delay
        ]])

        gw_pred = model.predict(row)[0]

        gw_7 = gw_prev
        gw_prev = gw_pred

        predictions.append(float(gw_pred))

    return predictions