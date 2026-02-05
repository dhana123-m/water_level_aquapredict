# tts.py
import os
import uuid
import pyttsx3

def generate_tts(text):

    # create audio folder if not exists
    if not os.path.exists("audio"):
        os.makedirs("audio")

    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join("audio", filename)

    engine = pyttsx3.init()
    engine.save_to_file(text, filepath)
    engine.runAndWait()

    return "/audio/" + filename