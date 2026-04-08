from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Dict, Any
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

class GraphNode(BaseModel):
    id: str
    label: str
    color: str

class GraphEdge(BaseModel):
    source: str
    target: str

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    clauses: List[Clause]
    risk_score: float = Field(ge=0, le=100)
    highlighted_file: str
    document_name: str
    graph_data: GraphData

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF"""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def get_personalized_prompt(user_type: str) -> str:
    """Generate personalized prompt based on user type"""
    
    focus_areas = {
        'student': 'penalties, fees, financial obligations, payment deadlines, late charges',
        'employee': 'work obligations, restrictions, non-compete clauses, termination conditions, confidentiality',
        'freelancer': 'payment terms, liability limitations, project deadlines, intellectual property, indemnification',
        'tenant': 'rent amounts, security deposits, termination notice periods, maintenance obligations, lease renewals'
    }
    
    impact_guidance = {
        'student': 'Explain financial impact and what penalties they might face',
        'employee': 'Explain career implications and restrictions on future work',
        'freelancer': 'Explain business impact and financial exposure',
        'tenant': 'Explain housing security and financial commitments'
    }
    
    focus = focus_areas.get(user_type, 'key terms and conditions')
    impact = impact_guidance.get(user_type, 'practical implications')
    
    return f"""You are a legal document analyzer specializing in contracts for {user_type}s.

Extract 10-20 IMPORTANT clauses from the document. Focus on:
- {focus}

ONLY include clauses about:
1. Payment terms and financial obligations
2. Liability and risk allocation  
3. Termination conditions and notice periods
4. Penalties, fees, or damages
5. Key obligations and restrictions

For each clause:
- text: Extract the exact clause (1-3 sentences, concise)
- type: "risk", "obligation", or "right"
- severity: "low", "medium", or "high" based on impact
- score: 0-100 (higher = more risky for the {user_type})
- explanation: {impact}

Return ONLY valid JSON:
{{
  "clauses": [
    {{
      "text": "exact clause text",
      "type": "risk",
      "severity": "high",
      "score": 85,
      "explanation": "brief explanation"
    }}
  ]
}}
"""

def extract_clauses_with_llm(text: str, user_type: str) -> dict:
    """Use Groq LLM to extract clauses from legal text with personalization"""
    
    personalized_prompt = get_personalized_prompt(user_type)
    
    prompt = f"""{personalized_prompt}

Document text:
{text[:8000]}
"""
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a legal document analyzer that returns structured JSON data. Return ONLY valid JSON, no markdown or extra text."
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
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            json_str = json_match.group(0)
            result = json.loads(json_str)
            return result
        else:
            return json.loads(response_text)
            
    except Exception as e:
        logging.error(f"Error extracting clauses with LLM: {e}")
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

def generate_graph(clauses: List[Clause]) -> GraphData:
    """Generate graph data with nodes and edges based on clause relationships"""
    
    # Limit to max 15 nodes
    limited_clauses = clauses[:15]
    
    # Define colors based on severity
    severity_colors = {
        'high': '#EF4444',
        'medium': '#F59E0B',
        'low': '#10B981'
    }
    
    # Create nodes
    nodes = []
    for i, clause in enumerate(limited_clauses):
        # Take first 5-6 words for label
        words = clause.text.split()[:6]
        label = ' '.join(words) + '...'
        
        nodes.append(GraphNode(
            id=f"c{i}",
            label=label,
            color=severity_colors.get(clause.severity, '#6B7280')
        ))
    
    # Create edges based on relationships
    edges = []
    edge_count = 0
    max_edges = 25
    
    # Keywords that indicate related clauses
    connection_keywords = [
        'payment', 'pay', 'fee', 'cost', 'price',
        'liability', 'liable', 'responsible', 'damages',
        'termination', 'terminate', 'end', 'cancel',
        'penalty', 'penalize', 'fine',
        'insurance', 'indemnify', 'indemnification'
    ]
    
    for i, clause1 in enumerate(limited_clauses):
        if edge_count >= max_edges:
            break
            
        for j, clause2 in enumerate(limited_clauses):
            if i >= j or edge_count >= max_edges:
                continue
            
            # Check if same type
            if clause1.type == clause2.type:
                edges.append(GraphEdge(source=f"c{i}", target=f"c{j}"))
                edge_count += 1
                continue
            
            # Check for shared keywords
            text1_lower = clause1.text.lower()
            text2_lower = clause2.text.lower()
            
            for keyword in connection_keywords:
                if keyword in text1_lower and keyword in text2_lower:
                    edges.append(GraphEdge(source=f"c{i}", target=f"c{j}"))
                    edge_count += 1
                    break
    
    return GraphData(nodes=nodes, edges=edges)

def highlight_pdf(input_path: str, output_path: str, clauses: List[Clause]) -> str:
    """Highlight clauses in PDF based on severity"""
    
    doc = fitz.open(input_path)
    
    # Define colors based on severity
    colors = {
        "high": (1, 0.44, 0.44),
        "medium": (0.98, 0.75, 0.14),
        "low": (0.2, 0.83, 0.6)
    }
    
    for clause in clauses:
        words = clause.text.split()[:7]
        search_text = ' '.join(words)
        
        color = colors.get(clause.severity, (1, 1, 0))
        
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
async def analyze_document(file: UploadFile = File(...), user_type: str = Form(...)):
    """Analyze uploaded PDF legal document with personalization"""
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    file_id = str(uuid.uuid4())
    input_path = UPLOADS_DIR / f"{file_id}_input.pdf"
    output_path = UPLOADS_DIR / f"{file_id}_highlighted.pdf"
    
    try:
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        text = extract_text_from_pdf(str(input_path))
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Extract clauses with personalization
        llm_result = extract_clauses_with_llm(text, user_type)
        
        clauses = [Clause(**clause_data) for clause_data in llm_result.get('clauses', [])]
        
        risk_score = calculate_overall_risk_score(clauses)
        
        # Generate graph data
        graph_data = generate_graph(clauses)
        
        highlight_pdf(str(input_path), str(output_path), clauses)
        
        analysis_doc = {
            "id": file_id,
            "document_name": file.filename,
            "user_type": user_type,
            "risk_score": risk_score,
            "clauses_count": len(clauses),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.analyses.insert_one(analysis_doc)
        
        return AnalysisResult(
            clauses=clauses,
            risk_score=risk_score,
            highlighted_file=f"/api/download/{file_id}",
            document_name=file.filename,
            graph_data=graph_data
        )
        
    except Exception as e:
        logging.error(f"Error analyzing document: {e}")
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
