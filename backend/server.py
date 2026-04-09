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
import re
import io
import base64
from urllib.parse import quote

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

groq_client = Groq(api_key=os.environ['GROQ_API_KEY'])

app = FastAPI()
api_router = APIRouter(prefix="/api")

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

class Clause(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str
    type: str
    severity: str
    score: int
    explanation: str

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

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    role: str
    content: str
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

class Lawyer(BaseModel):
    id: str
    name: str
    specialty: str
    email: str
    image_url: str

mock_lawyers = [
    # Property Lawyers (lease)
    {"id": "1", "name": "Rajesh Sharma", "title": "Property Lawyer", "specialty": "lease", "phone": "919876543210", "image_url": "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400"},
    {"id": "2", "name": "Ananya Iyer", "title": "Property Lawyer", "specialty": "lease", "phone": "919876543211", "image_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400"},
    
    # HR Lawyers (employment)
    {"id": "3", "name": "Vikram Mehta", "title": "HR Lawyer", "specialty": "employment", "phone": "919876543212", "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"},
    {"id": "4", "name": "Neha Kapoor", "title": "HR Lawyer", "specialty": "employment", "phone": "919876543213", "image_url": "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400"},
    
    # Corporate Lawyers (contract)
    {"id": "5", "name": "Arjun Rao", "title": "Corporate Lawyer", "specialty": "contract", "phone": "919876543214", "image_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"},
    {"id": "6", "name": "Sneha Reddy", "title": "Corporate Lawyer", "specialty": "contract", "phone": "919876543215", "image_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"},
    
    # Business Lawyers (nda)
    {"id": "7", "name": "Karan Verma", "title": "Business Lawyer", "specialty": "nda", "phone": "919876543216", "image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"},
    {"id": "8", "name": "Pooja Nair", "title": "Business Lawyer", "specialty": "nda", "phone": "919876543217", "image_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400"},
]

def create_whatsapp_link(lawyer_phone: str, message: str) -> str:
    """Create WhatsApp redirect link with pre-filled message"""
    encoded_message = quote(message)
    whatsapp_link = f"https://wa.me/{lawyer_phone}?text={encoded_message}"
    return whatsapp_link

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def detect_document_type(text: str) -> str:
    prompt = f"""Analyze this legal document and classify it as ONE of these types: contract, lease, employment, NDA.
Return ONLY the type, nothing else.

Document text:
{text[:2000]}"""
    
    response = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.1
    )
    doc_type = response.choices[0].message.content.strip().lower()
    if doc_type not in ["contract", "lease", "employment", "nda"]:
        doc_type = "contract"
    return doc_type

def simplify_document(text: str, user_level: str) -> str:
    level_prompts = {
        "beginner": "Explain this legal document as if you're talking to a 15-year-old. Use NO legal jargon whatsoever. Use everyday simple language, short sentences, and bullet points. Make it easy to understand.",
        "intermediate": "Explain this legal document in moderate detail. You can use some legal terms but explain them clearly in simple words. Use bullet points.",
        "advanced": "Provide a detailed legal analysis of this document. Include legal terminology, deeper insights, and comprehensive explanations. Use bullet points for structure."
    }
    
    prompt = f"""{level_prompts.get(user_level, level_prompts['beginner'])}

Document text:
{text[:3000]}

Provide a clear explanation in bullet points."""
    
    response = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.3
    )
    return response.choices[0].message.content

def extract_clauses(text: str, user_level: str = "beginner") -> tuple:
    prompt = f"""Analyze this legal document and extract 10-20 key clauses.

FOCUS ONLY ON these critical areas:
- Payment terms and obligations
- Liability and indemnification
- Termination conditions
- Penalties and damages

For each clause, provide:
- text: the actual clause text (keep it concise, max 150 chars)
- type: MUST be one of: payment, liability, termination, penalty
- severity: low, medium, or high (be conservative - only mark truly risky items as high)
- score: risk score 0-100 (0-30: low, 31-60: medium, 61-100: high)
- explanation: brief explanation of the risk in {"simple everyday language" if user_level == "beginner" else "moderate detail" if user_level == "intermediate" else "legal terminology"}

Return ONLY a valid JSON array of objects. No markdown, no extra text.

Document:
{text[:4000]}"""
    
    response = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.2
    )
    
    content = response.choices[0].message.content.strip()
    content = content.replace('```json', '').replace('```', '').strip()
    
    try:
        clauses = json.loads(content)
        
        # Filter to only include priority types
        priority_types = ['payment', 'liability', 'termination', 'penalty']
        clauses = [c for c in clauses if c.get('type', '').lower() in priority_types]
        
        # Limit to 10-20 clauses
        if len(clauses) > 20:
            clauses = sorted(clauses, key=lambda x: x.get('score', 0), reverse=True)[:20]
        elif len(clauses) < 10 and len(clauses) > 0:
            # If less than 10, keep what we have
            pass
        
        # Calculate average risk score and clamp 0-100
        if clauses:
            total_score = sum(c.get('score', 0) for c in clauses)
            risk_score = int(total_score / len(clauses))
            risk_score = max(0, min(100, risk_score))  # Clamp 0-100
        else:
            risk_score = 0
        
        return clauses, risk_score
    except Exception as e:
        logging.error(f"Clause extraction error: {e}")
        return [], 0

def generate_graph_data(clauses: List[Dict]) -> Dict:
    nodes = []
    edges = []
    
    # Sort by risk score and take top 6-8 highest risk clauses
    sorted_clauses = sorted(clauses, key=lambda x: x.get('score', 0), reverse=True)
    top_clauses = sorted_clauses[:8]  # Max 8 nodes
    
    clause_keywords = ['payment', 'liability', 'termination', 'penalty']
    
    for i, clause in enumerate(top_clauses):
        severity = clause.get('severity', 'low')
        color_map = {'high': '#DC2626', 'medium': '#F59E0B', 'low': '#16A34A'}
        
        # Create short, meaningful label (max 3-4 words)
        clause_type = clause.get('type', 'clause').title()
        short_label = f"{clause_type} Clause"
        
        nodes.append({
            'id': i,
            'name': short_label,
            'fullText': clause.get('text', ''),
            'explanation': clause.get('explanation', ''),
            'score': clause.get('score', 0),
            'severity': severity,
            'val': 15 if severity == 'high' else 12 if severity == 'medium' else 10,
            'color': color_map.get(severity, '#16A34A')
        })
    
    # Create edges only for clearly related clauses (avoid clutter)
    for i, clause_i in enumerate(top_clauses):
        for j, clause_j in enumerate(top_clauses):
            if i < j:
                # Only connect if same type (clear relationship)
                if clause_i.get('type') == clause_j.get('type'):
                    edges.append({'source': i, 'target': j})
    
    return {'nodes': nodes, 'links': edges}

@api_router.post("/auth/signin")
async def signin(request: SignInRequest):
    existing = await db.users.find_one({"email": request.email}, {"_id": 0})
    if existing:
        if isinstance(existing.get('created_at'), str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        return existing
    
    user = User(name=request.name, email=request.email)
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user

@api_router.post("/survey")
async def submit_survey(request: SurveyRequest):
    await db.users.update_one(
        {"id": request.user_id},
        {"$set": {"user_level": request.user_level, "survey_score": request.score}}
    )
    return {"success": True, "user_level": request.user_level}

@api_router.post("/upload")
async def upload_document(file: UploadFile = File(...), user_id: str = "", user_level: str = "beginner"):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files allowed")
    
    pdf_bytes = await file.read()
    text = extract_text_from_pdf(pdf_bytes)
    
    if not text.strip():
        raise HTTPException(400, "Could not extract text from PDF")
    
    doc_type = detect_document_type(text)
    simplified = simplify_document(text, user_level)
    clauses, risk_score = extract_clauses(text, user_level)
    
    document = Document(
        user_id=user_id,
        filename=file.filename,
        doc_type=doc_type,
        simplified_text=simplified,
        clauses=clauses,
        risk_score=risk_score
    )
    
    doc_dict = document.model_dump()
    doc_dict['created_at'] = doc_dict['created_at'].isoformat()
    await db.documents.insert_one(doc_dict)
    
    return {"document_id": document.id, "doc_type": doc_type, "risk_score": risk_score}

@api_router.get("/document/{doc_id}")
async def get_document(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc

@api_router.get("/graph/{doc_id}")
async def get_graph(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0, "clauses": 1})
    if not doc:
        raise HTTPException(404, "Document not found")
    graph_data = generate_graph_data(doc.get('clauses', []))
    return graph_data

@api_router.post("/consultation/book")
async def book_consultation(request: ConsultationRequest):
    doc = await db.documents.find_one({"id": request.document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    doc_type = doc['doc_type']
    risk_score = doc.get('risk_score', 0)
    
    # Get all lawyers matching this specialty
    matching_lawyers = [l for l in mock_lawyers if l['specialty'] == doc_type.lower()]
    # Pick first one or fallback to first lawyer
    lawyer = matching_lawyers[0] if matching_lawyers else mock_lawyers[0]
    
    # Build WhatsApp confirmation message for USER
    whatsapp_message = f"""Hello {request.user_name},

Your legal consultation has been successfully booked.

Lawyer: {lawyer['name']}
Document Type: {doc_type.upper()}

Date: {request.preferred_date}
Time: {request.preferred_time}

Please be available at the scheduled time."""
    
    # Create WhatsApp link with USER's phone number
    whatsapp_link = create_whatsapp_link(request.user_phone, whatsapp_message)
    
    logging.info(f"=== Booking Appointment for {request.user_name} ===")
    logging.info(f"✓ WhatsApp confirmation link generated for user ({request.user_phone})")
    logging.info(f"✓ Assigned lawyer: {lawyer['name']} ({lawyer['title']})")
    
    # Return WhatsApp link and appointment details
    return {
        "success": True,
        "lawyer": lawyer,
        "whatsapp_link": whatsapp_link,
        "appointment": {
            "date": request.preferred_date,
            "time": request.preferred_time,
            "lawyer_name": lawyer['name'],
            "lawyer_title": lawyer['title']
        }
    }

# Alias endpoint for simpler URL
@api_router.post("/book-lawyer")
async def book_lawyer_alias(request: ConsultationRequest):
    return await book_consultation(request)

@api_router.post("/chat")
async def chat(request: ChatRequest):
    doc = await db.documents.find_one({"id": request.document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    # Get user info for personalization
    user = await db.users.find_one({"id": doc.get('user_id')}, {"_id": 0, "user_level": 1})
    user_level = user.get('user_level', 'beginner') if user else 'beginner'
    
    history = await db.chat_messages.find(
        {"document_id": request.document_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(20)
    
    # Build detailed context from document
    clauses_text = "\n".join([
        f"- {c.get('type', 'unknown').upper()}: {c.get('text', '')} (Risk: {c.get('score', 0)}/100, Severity: {c.get('severity', 'low')})"
        for c in doc['clauses'][:10]
    ])
    
    level_instructions = {
        "beginner": "Explain everything in very simple, everyday language. Avoid all legal jargon. Use short sentences.",
        "intermediate": "You can use some legal terms but explain them clearly. Provide moderate detail.",
        "advanced": "Use proper legal terminology and provide detailed analysis."
    }
    
    system_prompt = f"""You are a helpful legal document assistant analyzing a {doc['doc_type'].upper()} document.

DOCUMENT CONTEXT:
Document Type: {doc['doc_type']}
Overall Risk Score: {doc.get('risk_score', 0)}/100
Total Clauses Analyzed: {len(doc.get('clauses', []))}

KEY CLAUSES IN THIS DOCUMENT:
{clauses_text}

DOCUMENT SUMMARY:
{doc['simplified_text'][:600]}

RESPONSE GUIDELINES:
- {level_instructions.get(user_level, level_instructions['beginner'])}
- Always reference specific clauses from the document when answering
- Provide guidance based on the document content, NOT generic legal advice
- If asked about something not in the document, clearly state that
- Focus on helping the user understand THIS specific document
- Do NOT provide legal advice or tell users what to do
- Suggest consulting the lawyer button if risk score is high

Your role: Help users understand what's IN their document, not provide legal counsel."""
    
    messages = [{"role": "system", "content": system_prompt}]
    
    for h in history[-10:]:
        messages.append({"role": h['role'], "content": h['content']})
    
    messages.append({"role": "user", "content": request.message})
    
    response = groq_client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
        temperature=0.5
    )
    
    assistant_message = response.choices[0].message.content
    
    user_msg = ChatMessage(document_id=request.document_id, role="user", content=request.message)
    assistant_msg = ChatMessage(document_id=request.document_id, role="assistant", content=assistant_message)
    
    user_dict = user_msg.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    assistant_dict = assistant_msg.model_dump()
    assistant_dict['created_at'] = assistant_dict['created_at'].isoformat()
    
    await db.chat_messages.insert_many([user_dict, assistant_dict])
    
    return {"response": assistant_message}

@api_router.get("/lawyers")
async def get_lawyers():
    return mock_lawyers

@api_router.get("/lawyer-for-document/{doc_id}")
async def get_lawyer_for_document(doc_id: str):
    """Get the appropriate lawyer for a document based on its type"""
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0, "doc_type": 1})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    doc_type = doc['doc_type'].lower()
    matching_lawyers = [l for l in mock_lawyers if l['specialty'] == doc_type]
    lawyer = matching_lawyers[0] if matching_lawyers else mock_lawyers[0]
    
    return lawyer

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()