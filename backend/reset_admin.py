
import os
from getpass import getpass

from dotenv import load_dotenv
from pymongo import MongoClient
from pwdlib import PasswordHash

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "tripmate")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is missing from .env")

email = "admin@email.com"

new_password = getpass("Enter your new admin password: ")
confirm_password = getpass("Confirm your new password: ")

if len(new_password) < 8:
    raise ValueError("Password must contain at least 8 characters.")

if new_password != confirm_password:
    raise ValueError("Passwords do not match.")

client = MongoClient(MONGODB_URI)

try:
    db = client[DATABASE_NAME]
    users = db["users"]

    admin = users.find_one({
        "email": email,
        "role": "admin"
    })

    if not admin:
        raise RuntimeError("Admin account was not found.")

    password_hash = PasswordHash.recommended()

    users.update_one(
        {"_id": admin["_id"]},
        {
            "$set": {
                "password_hash": password_hash.hash(new_password)
            }
        }
    )

    print("Admin password reset successfully!")
    print("Admin role and account have been preserved.")

finally:
    client.close()
