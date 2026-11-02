
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import jwt
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from pwdlib import PasswordHash


# ----------------------------------------
# ENVIRONMENT AND DATABASE
# ----------------------------------------

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "tripmate")
JWT_SECRET = os.getenv("JWT_SECRET", "")

if not MONGODB_URI or "PASTE_YOUR_" in MONGODB_URI:
    raise RuntimeError("Set MONGODB_URI in your backend .env file.")

if not JWT_SECRET or "replace_with" in JWT_SECRET:
    raise RuntimeError("Set a private JWT_SECRET in your backend .env file.")

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)

db = client[DATABASE_NAME]
users = db["users"]
trips = db["trips"]

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    client.admin.command("ping")
    users.create_index("email", unique=True)
    yield
    client.close()


app = FastAPI(title="TripMate API", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://tripmate-frontend-zi6d.onrender.com",
    "https://frontend-plum-one-27.vercel.app"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------
# REQUEST MODELS
# ----------------------------------------

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TripCreate(BaseModel):
    destination: str
    start_date: str
    end_date: str
    travellers: int = Field(default=1, ge=1)
    budget: float = Field(default=0, ge=0)


class ItineraryActivity(BaseModel):
    time: str = ""
    activity: str = ""
    notes: str = ""


class ItineraryDay(BaseModel):
    day: int
    activities: list[ItineraryActivity]


class ItineraryUpdate(BaseModel):
    days: list[ItineraryDay]


# ----------------------------------------
# HELPER FUNCTIONS
# ----------------------------------------

def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at"),
    }


def serialize_trip(trip):
    return {
        "id": str(trip["_id"]),
        "destination": trip.get("destination", ""),
        "start_date": trip.get("start_date", ""),
        "end_date": trip.get("end_date", ""),
        "travellers": trip.get("travellers", 1),
        "budget": trip.get("budget", 0),
        "status": trip.get("status", "Upcoming"),
        "user_id": trip.get("user_id", ""),
        "itinerary": trip.get("itinerary", []),
        "created_at": trip.get("created_at"),
    }


def create_token(user):
    payload = {
        "sub": str(user["_id"]),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm="HS256",
    )


# ----------------------------------------
# AUTHENTICATION
# ----------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=["HS256"],
        )

        user_id = payload.get("sub")

        if not user_id or not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=401,
                detail="Invalid token.",
            )

        user = users.find_one({"_id": ObjectId(user_id)})

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired. Please log in again.",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token.",
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    return user


def get_admin_user(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return user


# ----------------------------------------
# HOME AND HEALTH
# ----------------------------------------

@app.get("/")
def home():
    return {"message": "Welcome to TripMate API!"}


@app.get("/health")
def health_check():
    client.admin.command("ping")
    return {"status": "healthy"}


# ----------------------------------------
# DESTINATIONS
# ----------------------------------------

DESTINATIONS = [
    {
        "id": 1,
        "name": "Hyderabad",
        "country": "India",
        "category": "City",
        "price": 12000,
        "description": "Explore historic landmarks, Charminar and vibrant city life.",
    },
    {
        "id": 2,
        "name": "Goa",
        "country": "India",
        "category": "Beach",
        "price": 18000,
        "description": "Relax on beautiful beaches and enjoy coastal adventures.",
    },
    {
        "id": 3,
        "name": "Manali",
        "country": "India",
        "category": "Adventure",
        "price": 25000,
        "description": "Enjoy mountain views, snow and Himalayan adventures.",
    },
    {
        "id": 4,
        "name": "Jaipur",
        "country": "India",
        "category": "Heritage",
        "price": 15000,
        "description": "Discover royal palaces, forts and colourful markets.",
    },
    {
        "id": 5,
        "name": "Kerala",
        "country": "India",
        "category": "Nature",
        "price": 22000,
        "description": "Experience peaceful backwaters, greenery and houseboats.",
    },
    {
        "id": 6,
        "name": "Munnar",
        "country": "India",
        "category": "Nature",
        "price": 16000,
        "description": "Explore tea gardens, misty hills and waterfalls.",
    },
    {
        "id": 7,
        "name": "Ooty",
        "country": "India",
        "category": "Nature",
        "price": 14000,
        "description": "Enjoy cool weather, scenic gardens and mountain railways.",
    },
    {
        "id": 8,
        "name": "Darjeeling",
        "country": "India",
        "category": "Adventure",
        "price": 20000,
        "description": "Discover tea estates and beautiful Himalayan views.",
    },
    {
        "id": 9,
        "name": "Agra",
        "country": "India",
        "category": "Heritage",
        "price": 11000,
        "description": "Visit the Taj Mahal and explore Mughal architecture.",
    },
    {
        "id": 10,
        "name": "Udaipur",
        "country": "India",
        "category": "Heritage",
        "price": 17000,
        "description": "Experience beautiful lakes, palaces and royal culture.",
    },
    {
        "id": 11,
        "name": "Andaman",
        "country": "India",
        "category": "Beach",
        "price": 30000,
        "description": "Enjoy island beaches, scuba diving and clear waters.",
    },
    {
        "id": 12,
        "name": "Rishikesh",
        "country": "India",
        "category": "Adventure",
        "price": 13000,
        "description": "Experience river rafting, camping and mountain views.",
    },
    {
        "id": 13,
        "name": "Pondicherry",
        "country": "India",
        "category": "Beach",
        "price": 12000,
        "description": "Explore French architecture, cafes and peaceful beaches.",
    },
    {
        "id": 14,
        "name": "Srinagar",
        "country": "India",
        "category": "Nature",
        "price": 28000,
        "description": "Enjoy Dal Lake, houseboats and beautiful valleys.",
    },
    {
        "id": 15,
        "name": "Mysore",
        "country": "India",
        "category": "Heritage",
        "price": 10000,
        "description": "Visit the grand Mysore Palace and cultural attractions.",
    },
]


@app.get("/destinations")
def get_destinations():
    return {"destinations": DESTINATIONS}


# ----------------------------------------
# SIGNUP
# ----------------------------------------

@app.post("/auth/signup", status_code=201)
def signup(data: SignupRequest):
    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters.",
        )

    if not data.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    email = str(data.email).lower()

    user = {
        "name": data.name.strip(),
        "email": email,
        "password_hash": password_hash.hash(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users.insert_one(user)

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Email already registered.",
        )

    user["_id"] = result.inserted_id

    return {
        "message": "Signup successful",
        "token": create_token(user),
        "user": serialize_user(user),
    }


# ----------------------------------------
# LOGIN
# ----------------------------------------

@app.post("/auth/login")
def login(data: LoginRequest):
    email = str(data.email).lower()
    user = users.find_one({"email": email})

    if not user or not password_hash.verify(
        data.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )

    return {
        "message": "Login successful",
        "token": create_token(user),
        "user": serialize_user(user),
    }


# ----------------------------------------
# CURRENT USER PROFILE
# ----------------------------------------

@app.get("/auth/me")
def my_profile(user=Depends(get_current_user)):
    return serialize_user(user)


# ----------------------------------------
# USER DASHBOARD
# ----------------------------------------

@app.get("/user/dashboard")
def user_dashboard(user=Depends(get_current_user)):
    user_id = str(user["_id"])

    user_trips = list(
        trips.find({"user_id": user_id}).sort("created_at", -1)
    )

    now = datetime.now(timezone.utc).date()

    upcoming = []
    completed = []

    for trip in user_trips:
        item = serialize_trip(trip)

        try:
            end_date = datetime.strptime(
                item["end_date"], "%Y-%m-%d"
            ).date()

            if end_date < now:
                completed.append(item)
            else:
                upcoming.append(item)

        except (ValueError, TypeError):
            upcoming.append(item)

    return {
        "user": serialize_user(user),
        "total_trips": len(user_trips),
        "upcoming_trips": len(upcoming),
        "completed_trips": len(completed),
        "trips": [serialize_trip(t) for t in user_trips],
    }


# ----------------------------------------
# CREATE TRIP
# ----------------------------------------

@app.post("/trips", status_code=201)
def create_trip(
    data: TripCreate,
    user=Depends(get_current_user),
):
    trip = {
        "user_id": str(user["_id"]),
        "destination": data.destination,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "travellers": data.travellers,
        "budget": data.budget,
        "status": "Upcoming",
        "itinerary": [],
        "created_at": datetime.now(timezone.utc),
    }

    result = trips.insert_one(trip)
    trip["_id"] = result.inserted_id

    return {
        "message": "Trip created successfully",
        "trip": serialize_trip(trip),
    }


# ----------------------------------------
# GET LOGGED-IN USER'S TRIPS
# ----------------------------------------

@app.get("/trips")
def get_my_trips(user=Depends(get_current_user)):
    user_id = str(user["_id"])

    user_trips = list(
        trips.find({"user_id": user_id}).sort("created_at", -1)
    )

    return {
        "trips": [serialize_trip(trip) for trip in user_trips]
    }


# ----------------------------------------
# SAVE ITINERARY
# ----------------------------------------

@app.put("/trips/{trip_id}/itinerary")
def update_itinerary(
    trip_id: str,
    data: ItineraryUpdate,
    user=Depends(get_current_user),
):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID.")

    trip = trips.find_one({
        "_id": ObjectId(trip_id),
        "user_id": str(user["_id"]),
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    days = [
        day.model_dump()
        for day in data.days
    ]

    trips.update_one(
        {"_id": trip["_id"]},
        {"$set": {"itinerary": days}},
    )

    return {
        "message": "Itinerary saved successfully",
        "itinerary": days,
    }


# ----------------------------------------
# GET ITINERARY
# ----------------------------------------

@app.get("/trips/{trip_id}/itinerary")
def get_itinerary(
    trip_id: str,
    user=Depends(get_current_user),
):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID.")

    trip = trips.find_one({
        "_id": ObjectId(trip_id),
        "user_id": str(user["_id"]),
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    return {
        "trip_id": trip_id,
        "itinerary": trip.get("itinerary", []),
    }


# ----------------------------------------
# ADMIN DASHBOARD
# ----------------------------------------

@app.get("/admin/dashboard")
def admin_dashboard(admin=Depends(get_admin_user)):
    total_users = users.count_documents({"role": "user"})
    total_admins = users.count_documents({"role": "admin"})
    total_trips = trips.count_documents({})

    recent_trips = list(
        trips.find().sort("created_at", -1).limit(5)
    )

    return {
        "message": "Welcome to the TripMate Admin Dashboard",
        "admin": serialize_user(admin),
        "total_users": total_users,
        "total_admins": total_admins,
        "total_trips": total_trips,
        "total_destinations": len(DESTINATIONS),
        "recent_trips": [
            serialize_trip(trip) for trip in recent_trips
        ],
    }


# ----------------------------------------
# ADMIN: VIEW ALL USERS
# ----------------------------------------

@app.get("/admin/users")
def admin_get_users(admin=Depends(get_admin_user)):
    all_users = list(
        users.find().sort("created_at", -1)
    )

    return {
        "total": len(all_users),
        "users": [
            serialize_user(user) for user in all_users
        ],
    }


# ----------------------------------------
# ADMIN: VIEW ALL TRIPS
# ----------------------------------------

@app.get("/admin/trips")
def admin_get_trips(admin=Depends(get_admin_user)):
    all_trips = list(
        trips.find().sort("created_at", -1)
    )

    return {
        "total": len(all_trips),
        "trips": [
            serialize_trip(trip) for trip in all_trips
        ],
    }
