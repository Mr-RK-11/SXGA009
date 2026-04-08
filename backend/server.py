from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal
import uuid
from datetime import datetime, timezone
import fitz
from groq import Groq
import json
import re
from fastapi.responses import FileResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Groq client
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Define Models
class Clause(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    text: str
    type: Literal["risk", "obligation", "right"]
    severity: Literal["low", "medium", "high"]
    score: float = Field(ge=0, le=100)
    explanation: str

class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    clauses: List[Clause]
    risk_score: float = Field(ge=0, le=100)
    highlighted_file: str
    document_name: str

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF"""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def extract_clauses_with_llm(text: str) -> dict:
    """Use Groq LLM to extract clauses from legal text"""
    
    prompt = f"""You are a legal document analyzer. Extract important clauses from the following legal document text. 

For each clause, provide:
- text: The exact clause text (keep it concise, 1-3 sentences)
- type: Either "risk", "obligation", or "right"
- severity: Either "low", "medium", or "high"
- score: A risk score from 0-100 (higher = more risky)
- explanation: Brief explanation of why this clause matters

Extract as many relevant clauses as you find (typically 8-15). Focus on the most important legal terms.

Return ONLY a valid JSON object in this exact format:
{{
  "clauses": [
    {{
      "text": "clause text here",
      "type": "risk",
      "severity": "high",
      "score": 85,
      "explanation": "explanation here"
    }}
  ]
}}

Document text:
{text[:8000]}
"""
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a legal document analyzer that returns structured JSON data."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=4000
        )
        
        response_text = chat_completion.choices[0].message.content
        
        # Try to extract JSON from the response
        # Sometimes LLM wraps JSON in markdown code blocks
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            json_str = json_match.group(0)
            result = json.loads(json_str)
            return result
        else:
            # Fallback: try to parse the entire response
            return json.loads(response_text)
            
    except Exception as e:
        logging.error(f"Error extracting clauses with LLM: {e}")
        # Return a default structure if LLM fails
        return {
            "clauses": [
                {
                    "text": "Unable to extract clauses from document",
                    "type": "risk",
                    "severity": "medium",
                    "score": 50,
                    "explanation": "LLM processing encountered an error"
                }
            ]
        }

def highlight_pdf(input_path: str, output_path: str, clauses: List[Clause]) -> str:
    """Highlight clauses in PDF based on severity"""
    
    doc = fitz.open(input_path)
    
    # Define colors based on severity
    colors = {
        "high": (1, 0.44, 0.44),      # Red
        "medium": (0.98, 0.75, 0.14),  # Orange
        "low": (0.2, 0.83, 0.6)        # Green
    }
    
    for clause in clauses:
        # Take first 5-8 words of the clause to search
        words = clause.text.split()[:7]
        search_text = ' '.join(words)
        
        color = colors.get(clause.severity, (1, 1, 0))
        
        # Search and highlight in all pages
        for page in doc:
            text_instances = page.search_for(search_text)
            for inst in text_instances:
                highlight = page.add_highlight_annot(inst)
                highlight.set_colors(stroke=color)
                highlight.update()
    
    doc.save(output_path)
    doc.close()
    
    return output_path

def calculate_overall_risk_score(clauses: List[Clause]) -> float:
    """Calculate overall risk score from clauses"""
    if not clauses:
        return 0.0
    
    # Weight by severity
    severity_weights = {"high": 1.5, "medium": 1.0, "low": 0.5}
    
    weighted_sum = sum(clause.score * severity_weights.get(clause.severity, 1.0) 
                       for clause in clauses)
    total_weight = sum(severity_weights.get(clause.severity, 1.0) 
                       for clause in clauses)
    
    return round(weighted_sum / total_weight, 1) if total_weight > 0 else 0.0

@api_router.get("/")
async def root():
    return {"message": "Legal Decision Intelligence System API"}

@api_router.post("/analyze", response_model=AnalysisResult)
async def analyze_document(file: UploadFile = File(...)):
    """Analyze uploaded PDF legal document"""
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    # Save uploaded file
    file_id = str(uuid.uuid4())
    input_path = UPLOADS_DIR / f"{file_id}_input.pdf"
    output_path = UPLOADS_DIR / f"{file_id}_highlighted.pdf"
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract text from PDF
        text = extract_text_from_pdf(str(input_path))
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Extract clauses using LLM
        llm_result = extract_clauses_with_llm(text)
        
        # Parse clauses
        clauses = [Clause(**clause_data) for clause_data in llm_result.get('clauses', [])]
        
        # Calculate overall risk score
        risk_score = calculate_overall_risk_score(clauses)
        
        # Highlight PDF
        highlight_pdf(str(input_path), str(output_path), clauses)
        
        # Store analysis in database
        analysis_doc = {
            "id": file_id,
            "document_name": file.filename,
            "risk_score": risk_score,
            "clauses_count": len(clauses),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.analyses.insert_one(analysis_doc)
        
        return AnalysisResult(
            clauses=clauses,
            risk_score=risk_score,
            highlighted_file=f"/api/download/{file_id}",
            document_name=file.filename
        )
        
    except Exception as e:
        logging.error(f"Error analyzing document: {e}")
        # Clean up files
        if input_path.exists():
            input_path.unlink()
        if output_path.exists():
            output_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")

@api_router.get("/download/{file_id}")
async def download_highlighted_pdf(file_id: str):
    """Download highlighted PDF"""
    output_path = UPLOADS_DIR / f"{file_id}_highlighted.pdf"
    
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=f"highlighted_{file_id}.pdf"
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
