from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import fitz
from groq import Groq
import json
from urllib.parse import quote

# -------------------- LOAD ENV --------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# -------------------- SAFE ENV LOAD --------------------
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# -------------------- INIT APP --------------------
app = FastAPI()
api_router = APIRouter(prefix="/api")

# -------------------- HEALTH CHECK --------------------
@app.get("/")
def root():
    return {"status": "running"}

# -------------------- DB (SAFE INIT) --------------------
db = None
client = None

if MONGO_URL and DB_NAME:
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        print("✅ MongoDB connected")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

# -------------------- GROQ --------------------
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except:
        print("❌ Groq init failed")

# -------------------- MODELS --------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    user_level: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SignInRequest(BaseModel):
    name: str
    email: str

class SurveyRequest(BaseModel):
    user_id: str
    score: int
    user_level: str

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    filename: str
    doc_type: str
    simplified_text: str
    clauses: List[Dict[str, Any]]
    risk_score: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    document_id: str
    message: str

class ConsultationRequest(BaseModel):
    document_id: str
    user_name: str
    user_phone: str
    preferred_date: str
    preferred_time: str
    message: Optional[str] = ""

# -------------------- MOCK DATA --------------------
mock_lawyers = [
    {"id": "1", "name": "Rajesh Sharma", "specialty": "lease", "phone": "919876543210"},
    {"id": "2", "name": "Ananya Iyer", "specialty": "lease", "phone": "919876543211"},
]

# -------------------- HELPERS --------------------
def create_whatsapp_link(phone: str, message: str):
    return f"https://wa.me/{phone}?text={quote(message)}"

# -------------------- ROUTES --------------------

@api_router.get("/lawyers")
async def get_lawyers():
    return mock_lawyers

@api_router.post("/auth/signin")
async def signin(request: SignInRequest):
    if not db:
        return {"error": "DB not connected"}

    existing = await db.users.find_one({"email": request.email}, {"_id": 0})
    if existing:
        return existing

    user = User(name=request.name, email=request.email)
    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)
    return user

@api_router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files allowed")

    pdf_bytes = await file.read()
    text = fitz.open(stream=pdf_bytes, filetype="pdf")[0].get_text()

    return {"message": "PDF processed", "length": len(text)}

@api_router.post("/consultation/book")
async def book(request: ConsultationRequest):
    lawyer = mock_lawyers[0]
    link = create_whatsapp_link(request.user_phone, "Consultation booked")

    return {
        "success": True,
        "lawyer": lawyer,
        "whatsapp_link": link
    }

# -------------------- FINAL SETUP --------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    if client:
        client.close()
