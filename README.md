# 🎓 Student Feedback & Analytics System

An elegant, modern, responsive full-stack web application designed for collecting, managing, and analyzing student feedback in real-time. Built with a Flask backend, an interactive CSS/JS vanilla frontend, SQLite for persistent storage, and integrated with Telegram Bot API for real-time notification alerts, this system features a secure admin portal with analytical charts, full-text search, filters, and CSV export functionality.

---

## 🚀 Key Features

* **Interactive Student Feedback Form**: A premium, responsive, glassmorphic UI layout featuring smooth micro-animations, real-time input validation (with custom email regex checking), and five-star rating systems.
* **Instant Telegram Notifications**: Instant delivery of feedback details (Student Name, Email, Star-Rating, and Written Experience) to a designated Telegram Chat/Channel using a custom Telegram Bot integration.
* **Persistent SQLite Database**: Automatic schema initialization on startup. Seamless storage and retrieval of student reviews.
* **Secure Admin Portal**: Authenticated admin dashboard equipped with a password protection layer to review and manage all collected feedback.
* **Real-time Search & Multi-criteria Filtering**: Fully-featured dashboard with instantaneous frontend-to-backend search query matching and rating-based filtering.
* **Interactive Analytics & Metrics**: Immediate evaluation of key metrics including:
  * Total submissions count.
  * Average rating score.
  * Star-rating distribution breakdown (1-star to 5-stars).
* **One-Click CSV Export**: Download a structured, formatted `.csv` summary of all recorded student entries with accurate timestamps for offline reporting.

---

## 🛠️ Technology Stack

* **Backend**: Python 3 (Flask framework)
* **Frontend**: HTML5, Vanilla CSS3 (Custom Responsive Layouts & Gradients), Modern Vanilla JavaScript (Fetch API, Async/Await)
* **Database**: SQLite3 (Self-initializing, file-based)
* **Notification Integration**: Telegram Bot API (via HTTPS Requests)
* **Production Server Support**: Gunicorn

---

## 📂 Directory Structure

```text
StudentFeedback/
├── .env.example              # Template configuration for environment variables
├── .gitignore.txt            # Git untracked files pattern definitions
├── Procfile                  # Production server execution settings (for Gunicorn)
├── app.py                    # Main Flask server entrypoint (Routes, Database & Telegram handler)
├── feedback.db               # SQLite database file (automatically generated on startup)
├── requirements.txt          # Python dependencies list
├── test_telegram_ascii.py    # Standalone utility script to test Telegram credentials
├── static/
│   ├── script.js             # Modern JavaScript for AJAX submission and dashboard mechanics
│   └── style.css             # High-quality responsive styling & glassmorphic styling system
├── templates/
│   ├── index.html            # Main Feedback Form web page
│   └── admin.html            # Password login & analytical Admin Dashboard web page
└── venv/                     # Local python virtual environment (git ignored)
```

---

## ⚙️ Installation & Local Setup

### 1. Clone the Repository
Navigate to your working directory and clone/extract the workspace:
```bash
cd StudentFeedback
```

### 2. Set Up a Virtual Environment
Create and activate a isolated Python virtual environment:
* **Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
* **macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Install Dependencies
Install all required libraries using pip:
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to a new file named `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in the required values:
```ini
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_random_secure_session_key

# Telegram Configuration (See Setup Instructions below)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Admin Portal Configuration
ADMIN_PASSWORD=your_desired_admin_dashboard_password
```

---

## 🤖 Configuring the Telegram Bot

To receive instant notification alerts in Telegram when a student submits feedback, configure a Telegram Bot as follows:

1. **Create a Bot via BotFather**:
   * Open Telegram and search for the user `@BotFather`.
   * Send the command `/newbot` and follow the instructions to set a name and username for your bot.
   * Copy the generated **HTTP API Access Token** and paste it into `.env` as `TELEGRAM_BOT_TOKEN`.

2. **Retrieve your Chat ID**:
   * Start a conversation with your newly created bot by searching for its username and clicking **Start** (or typing `/start`).
   * Search for `@userinfobot` or `@RawDataBot` on Telegram and send a message. It will reply with your personal `id` value.
   * Paste this numeric value into `.env` as `TELEGRAM_CHAT_ID`.
   * *(Alternative: Send a message to your bot, then open `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in your browser to locate the `"chat":{"id":...}` parameter).*

3. **Verify the Integration**:
   Run the included validation script to test your credentials:
   ```bash
   python test_telegram_ascii.py
   ```
   If configured correctly, you will receive a stylized test notification in your Telegram app!

---

## 🔌 API Reference

### Student Routes
* **`GET /`**
  * **Description**: Renders the main homepage and Student Feedback Submission form.
* **`POST /submit`**
  * **Description**: Receives and processes submitted student forms. Supports JSON payload as well as URL-encoded forms.
  * **Validation**: Checks for missing fields, parses rating integer ranges (1-5), and runs email pattern verification.
  * **Response**:
    ```json
    {
      "status": "success",
      "message": "Feedback submitted and saved successfully!"
    }
    ```

### Admin Portal Routes
* **`GET /admin`**
  * **Description**: Renders the admin portal. Renders a secure Login Panel if unauthenticated, or the Analytics Dashboard if logged in.
* **`POST /admin/login`**
  * **Description**: Standard session password login validation.
* **`GET /admin/logout`**
  * **Description**: Destroys the admin session cookie and redirects to the login screen.
* **`GET /api/feedback`** *(Requires Admin Authentication)*
  * **Description**: Returns all collected feedbacks along with live aggregate metrics.
  * **Query Parameters**:
    * `search` (Optional) - Performs case-insensitive matching across Name, Email, or Experience fields.
    * `rating` (Optional) - Filters results by specific star-ratings (1 to 5).
* **`GET /api/export`** *(Requires Admin Authentication)*
  * **Description**: Triggers a `.csv` export file download containing every stored response sorted chronologically.

---

## 🗄️ Database Schema

The system uses an embedded, lightweight **SQLite3** database (`feedback.db`). The `feedback` table is automatically initialized upon starting the Flask server.

### Schema Definition:
```sql
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    rating INTEGER NOT NULL,
    experience TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🏃 Running the Application

### Running Locally (Development Mode)
Start the application locally by executing:
```bash
python app.py
```
The server will boot on **`http://localhost:8080`**. Open this URL in your browser to view the interactive student feedback interface.

### Running in Production
For production environments, run the application using **Gunicorn** (already included in `requirements.txt` and specified in the `Procfile`):
```bash
gunicorn app:app --bind 0.0.0.0:8080
```

---

## 🛡️ Security Best Practices Included
* **Inputs Escaping**: The feedback input fields are escaped via Python's `html.escape` helper before transmission to Telegram, eliminating injection vulnerabilities or layout breakage.
* **Prepared SQL Queries**: Database inserts and search operations utilize parameterized query markers (`?`), safeguarding the database from SQL Injection (SQLi) attacks.
* **Session Management**: Session authentication tokens are kept secure using cryptographically-signed session cookies powered by Flask's `secret_key`.
