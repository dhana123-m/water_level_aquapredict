# app.py
# Main Flask application for WaterLevel System
from flask import send_from_directory, request, jsonify

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from config import SECRET_KEY
from db import get_db_connection
from predict import run_prediction
from tts import generate_tts



app = Flask(__name__)
app.secret_key = SECRET_KEY
CORS(app, supports_credentials=True)



# -------------------- HEALTH CHECK --------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Backend running"})


# -------------------- REGISTER --------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not all([email, password, role]):
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    hashed_pw = generate_password_hash(password)

    try:
        cursor.execute(
            "INSERT INTO users (email, password, role) VALUES (%s,%s,%s)",
            (email, hashed_pw, role)
        )
        conn.commit()
    except Exception:
        return jsonify({"error": "User already exists"}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "User registered successfully"})


# -------------------- LOGIN --------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = user["id"]
    session["role"] = user["role"]

    return jsonify({
        "message": "Login successful",
        "role": user["role"]
    })


# -------------------- LOGOUT --------------------
@app.route("/logout", methods=["GET"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


# -------------------- ADD BOREWELL --------------------
@app.route("/add-borewell", methods=["POST"])
def add_borewell():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO borewells (user_id, latitude, longitude) VALUES (%s,%s,%s)",
        (session["user_id"], latitude, longitude)
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Borewell added"})


# -------------------- SET THRESHOLD --------------------
@app.route("/set-threshold", methods=["POST"])
def set_threshold():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    threshold = request.json.get("threshold")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "REPLACE INTO settings (user_id, threshold) VALUES (%s,%s)",
        (session["user_id"], threshold)
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Threshold saved"})


# -------------------- RUN PREDICTION --------------------
# -------------------- RUN PREDICTION --------------------
@app.route("/predict", methods=["POST"])
def predict():

    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT latitude, longitude FROM borewells WHERE user_id=%s",
        (session["user_id"],)
    )

    borewell = cursor.fetchone()

    cursor.close()
    conn.close()

    if not borewell:
        return jsonify({"error": "No borewell found"}), 404

    prediction = run_prediction(
        borewell["latitude"],
        borewell["longitude"]
    )

    return jsonify({
        "prediction": prediction
    })




@app.route("/audio/<filename>")
def serve_audio(filename):
    return send_from_directory("audio", filename)



# -------------------- GET THRESHOLD --------------------
@app.route("/get-threshold", methods=["GET"])
def get_threshold():

    if "user_id" not in session:
        return jsonify({"error":"Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT threshold FROM settings WHERE user_id=%s",
        (session["user_id"],)
    )
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "threshold": row["threshold"]
    })




# -------------------- GET PROFILE --------------------
@app.route("/get-profile", methods=["GET"])
def get_profile():

    if "user_id" not in session:
        return jsonify({"error":"Unauthorized"}),401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT u.email, u.role, 
               b.latitude, b.longitude,
               s.threshold
        FROM users u
        LEFT JOIN borewells b ON u.id = b.user_id
        LEFT JOIN settings s ON u.id = s.user_id
        WHERE u.id=%s
    """,(session["user_id"],))

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(user)

    # -------------------- UPDATE PROFILE --------------------
@app.route("/update-profile", methods=["POST"])
def update_profile():

    if "user_id" not in session:
        return jsonify({"error":"Unauthorized"}),401

    data = request.json
    email = data.get("email")
    threshold = data.get("threshold")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET email=%s WHERE id=%s",
        (email, session["user_id"])
    )

    cursor.execute(
        "REPLACE INTO settings (user_id, threshold) VALUES (%s,%s)",
        (session["user_id"], threshold)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message":"Profile updated"})


# -------------------- CHANGE PASSWORD --------------------
@app.route("/change-password", methods=["POST"])
def change_password():

    if "user_id" not in session:
        return jsonify({"error":"Unauthorized"}),401

    data = request.json
    new_password = data.get("password")

    hashed = generate_password_hash(new_password)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET password=%s WHERE id=%s",
        (hashed, session["user_id"])
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message":"Password updated"})




# -------------------- GET BOREWELL BY ID (AUTHORITY) --------------------
@app.route("/get-borewell/<int:borewell_id>", methods=["GET"])
def get_borewell_by_id(borewell_id):

    if "user_id" not in session or session.get("role") != "authority":
        return jsonify({"error":"Unauthorized"}),401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, user_id, latitude, longitude FROM borewells WHERE id=%s",
        (borewell_id,)
    )

    borewell = cursor.fetchone()

    cursor.close()
    conn.close()

    if not borewell:
        return jsonify({"error":"Borewell not found"}),404

    return jsonify(borewell)

# -------------------- AUTHORITY PREDICT BY BOREWELL --------------------
@app.route("/predict-by-borewell/<int:borewell_id>", methods=["POST"])
def predict_by_borewell(borewell_id):

    if "user_id" not in session or session.get("role") != "authority":
        return jsonify({"error":"Unauthorized"}),401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT latitude, longitude FROM borewells WHERE id=%s",
        (borewell_id,)
    )
    borewell = cursor.fetchone()

    cursor.close()
    conn.close()

    if not borewell:
        return jsonify({"error":"Borewell not found"}),404

    prediction = run_prediction(
        borewell["latitude"],
        borewell["longitude"]
    )

    return jsonify({"prediction": prediction})


# -------------------- START SERVER --------------------
if __name__ == "__main__":
    app.run(debug=True)


