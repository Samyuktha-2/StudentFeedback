import requests

BOT_TOKEN = TELEGRAM_BOT_TOKEN
CHAT_ID = TELEGRAM_CHAT_ID

def test_telegram():
    print("Testing Telegram Integration...")
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    
    formatted_msg = (
        "📩 <b>New Student Feedback (Test Verification)</b>\n\n"
        "👤 <b>Name:</b> Test Student\n"
        "📧 <b>Email:</b> test@student.com\n"
        "⭐ <b>Rating:</b> ⭐⭐⭐⭐⭐ (5/5)\n\n"
        "📝 <b>Experience:</b>\n"
        "<i>This is a validation message sent from the development environment to confirm the credentials! Everything is working beautifully.</i>"
    )
    
    payload = {
        "chat_id": CHAT_ID,
        "text": formatted_msg,
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=8)
        result = response.json()
        if response.status_code == 200 and result.get("ok"):
            print("SUCCESS! Telegram message dispatched successfully.")
            print(f"Message ID: {result['result']['message_id']}")
        else:
            print("FAILURE! Telegram API returned an error:")
            print(result)
    except Exception as e:
        print(f"CONNECTION FAILURE! Error details: {e}")

if __name__ == "__main__":
    test_telegram()
