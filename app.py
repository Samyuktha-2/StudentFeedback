import os
import re
import sqlite3
import html
import logging
from datetime import datetime
import csv
import io
from flask import Flask, request, jsonify, render_template, redirect, url_for, session, Response
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Initialize Flask App
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super_secret_fallback_key_123")

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Database file
DB_FILE = "feedback.db"

def get_db_connection():
    """Establish a connection to the SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize SQLite database and create feedback table if not exists."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                rating INTEGER NOT NULL,
                experience TEXT NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

# Call init_db on startup
init_db()

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

def send_telegram_notification(name, email, rating, experience):
    """Sends the submitted feedback to the designated Telegram bot."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram Bot Token or Chat ID not configured. Skipping notification.")
        return False, "Telegram credentials not configured."

    # Generate stars representation (e.g., ⭐⭐⭐⭐⭐)
    stars = "⭐" * rating

    # Escape HTML tags from inputs to prevent Telegram HTML parse errors
    safe_name = html.escape(name)
    safe_email = html.escape(email)
    safe_experience = html.escape(experience)

    # Format Telegram Message
    formatted_msg = (
        f"📩 <b>New Student Feedback</b>\n\n"
        f"👤 <b>Name:</b> {safe_name}\n"
        f"📧 <b>Email:</b> {safe_email}\n"
        f"⭐ <b>Rating:</b> {stars} ({rating}/5)\n\n"
        f"📝 <b>Experience:</b>\n"
        f"<i>{safe_experience}</i>"
    )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": formatted_msg,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=8)
        response_json = response.json()
        if response.status_code == 200 and response_json.get("ok"):
            logger.info("Telegram notification sent successfully.")
            return True, "Notification sent."
        else:
            error_desc = response_json.get("description", "Unknown error")
            logger.error(f"Telegram API failed: {error_desc}")
            return False, f"Telegram API error: {error_desc}"
    except Exception as e:
        logger.error(f"Failed to connect to Telegram: {e}")
        return False, str(e)


# --- ROUTING HANDLERS ---

@app.route("/")
def home():
    """Serves the student feedback form frontend."""
    return render_template("index.html")


@app.route("/submit", methods=["POST"])
def submit_feedback():
    """Handles POST submissions of student feedback."""
    try:
        # Check request type (support both application/json and form-urlencoded)
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        # Extract fields
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        rating_raw = data.get("rating")
        experience = data.get("experience", "").strip()

        # Validation
        if not name or not email or not rating_raw or not experience:
            return jsonify({"status": "error", "message": "All fields are required."}), 400

        # Validate Email Format
        email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        if not re.match(email_regex, email):
            return jsonify({"status": "error", "message": "Invalid email address format."}), 400

        # Validate Rating
        try:
            rating = int(rating_raw)
            if rating < 1 or rating > 5:
                raise ValueError()
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "Rating must be an integer between 1 and 5."}), 400

        # Save to Database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO feedback (name, email, rating, experience) VALUES (?, ?, ?, ?)",
            (name, email, rating, experience)
        )
        conn.commit()
        conn.close()
        logger.info(f"Feedback stored in DB for student: {name}")

        # Send Telegram Bot Notification
        telegram_success, telegram_msg = send_telegram_notification(name, email, rating, experience)

        response_payload = {
            "status": "success",
            "message": "Feedback submitted and saved successfully!"
        }
        if not telegram_success:
            # We still return success as database storage was successful, but include a diagnostic note
            response_payload["warning"] = "Telegram notification could not be dispatched."
            logger.warning(f"Telegram notification skipped or failed: {telegram_msg}")

        return jsonify(response_payload), 200

    except Exception as e:
        logger.error(f"Error processing feedback submission: {e}")
        return jsonify({"status": "error", "message": "A server error occurred. Please try again later."}), 500


# --- ADMIN ROUTING HANDLERS ---

@app.route("/admin", methods=["GET"])
def admin_portal():
    """Serves the secure admin dashboard."""
    # Check if admin is authenticated
    if session.get("admin_logged_in"):
        return render_template("admin.html", logged_in=True)
    return render_template("admin.html", logged_in=False)


@app.route("/admin/login", methods=["POST"])
def admin_login():
    """Handles admin password verification."""
    password = request.form.get("password", "")
    if password == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        logger.info("Admin successfully logged in.")
        return redirect(url_for("admin_portal"))
    
    # Return with error flag
    return render_template("admin.html", logged_in=False, error="Invalid password. Please try again.")


@app.route("/admin/logout")
def admin_logout():
    """Clears the admin authentication session."""
    session.pop("admin_logged_in", None)
    logger.info("Admin logged out.")
    return redirect(url_for("admin_portal"))


@app.route("/api/feedback", methods=["GET"])
def get_feedback_api():
    """Returns stored feedback data and computed analytics as JSON. (Requires Admin authentication)"""
    if not session.get("admin_logged_in"):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    search = request.args.get("search", "").strip()
    rating_filter = request.args.get("rating", "").strip()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Build dynamic query
        query = "SELECT * FROM feedback WHERE 1=1"
        params = []

        if search:
            query += " AND (name LIKE ? OR email LIKE ? OR experience LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])

        if rating_filter:
            try:
                rating_val = int(rating_filter)
                query += " AND rating = ?"
                params.append(rating_val)
            except ValueError:
                pass

        # Order by newest submissions first
        query += " ORDER BY submitted_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Convert SQL Row objects to dict
        feedbacks = []
        for r in rows:
            feedbacks.append({
                "id": r["id"],
                "name": r["name"],
                "email": r["email"],
                "rating": r["rating"],
                "experience": r["experience"],
                "submitted_at": r["submitted_at"]
            })

        # Calculate Analytics on ALL feedbacks in DB
        cursor.execute("SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating")
        counts = cursor.fetchall()
        
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_feedback = 0
        sum_rating = 0

        for c in counts:
            rating_val = c["rating"]
            rating_cnt = c["count"]
            if 1 <= rating_val <= 5:
                distribution[rating_val] = rating_cnt
                total_feedback += rating_cnt
                sum_rating += (rating_val * rating_cnt)

        avg_rating = round(sum_rating / total_feedback, 2) if total_feedback > 0 else 0.0

        conn.close()

        analytics = {
            "total_count": total_feedback,
            "average_rating": avg_rating,
            "distribution": distribution
        }

        return jsonify({
            "status": "success",
            "feedbacks": feedbacks,
            "analytics": analytics
        })

    except Exception as e:
        logger.error(f"Error retrieving feedback API: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch feedback."}), 500


@app.route("/api/export", methods=["GET"])
def export_feedback_csv():
    """Generates a downloadable CSV containing all feedback. (Requires Admin authentication)"""
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_portal"))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, rating, experience, submitted_at FROM feedback ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()

        # Prepare string buffer
        si = io.StringIO()
        cw = csv.writer(si)
        
        # Write Headers
        cw.writerow(["Feedback ID", "Student Name", "Email ID", "Rating (1-5)", "Experience/Feedback", "Submitted Time"])
        
        # Write Data Rows
        for r in rows:
            cw.writerow([
                r["id"],
                r["name"],
                r["email"],
                r["rating"],
                r["experience"],
                r["submitted_at"]
            ])

        # Return CSV response
        output = si.getvalue()
        return Response(
            output,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=student_feedback_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )

    except Exception as e:
        logger.error(f"Error generating CSV export: {e}")
        return "Failed to generate CSV", 500


if __name__ == "__main__":
    # Start the Flask development server on port 8080
    app.run(host="0.0.0.0", port=8080, debug=True)
