# db.py
# MySQL database connection helper

import mysql.connector
from config import DB_CONFIG


def get_db_connection():
    """
    Creates and returns a new MySQL database connection.
    Caller is responsible for closing the connection.
    """
    return mysql.connector.connect(
        host=DB_CONFIG["host"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
        port=DB_CONFIG["port"]
    )
