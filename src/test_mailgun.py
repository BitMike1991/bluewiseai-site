import os
import requests

def send_simple_message():
    return requests.post(
        f"https://api.mailgun.net/v3/{os.getenv('MAILGUN_DOMAIN')}/messages",
        auth=("api", os.getenv('MAILGUN_API_KEY')),          # <-- updated!
        data={
            "from":    f"Mailgun Sandbox <postmaster@{os.getenv('MAILGUN_DOMAIN')}>",
            "to":      os.getenv('MAILGUN_TO'),
            "subject": "Hello from Mailgun Sandbox",
            "text":    "Congratulations—you’ve sent a test email via Mailgun!"
        }
    )

if __name__ == "__main__":
    resp = send_simple_message()
    print(resp.status_code, resp.text)
