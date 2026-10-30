from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import os
import PyPDF2
import docx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# 1. Define the JSON structure Python expects to receive from your Node.js server
class SimilarityRequest(BaseModel):
    new_file_path: str
    existing_file_paths: List[str]

# 2. Helper function to extract raw text from PDFs and Word docs
def extract_text(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    text = ""
    ext = file_path.lower().split('.')[-1]

    try:
        if ext == 'pdf':
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + " "
        elif ext in ['doc', 'docx']:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + " "
        else:
            raise ValueError("Unsupported format. Only PDF and DOCX are allowed.")
    except Exception as e:
        print(f"Error reading file {file_path}: {str(e)}")
        
    return text.strip()

# 3. The Main AI Route
@app.post("/check-similarity")
def check_similarity(request: SimilarityRequest):
    try:
        best_score = 0.0
        best_match_file = None
        
        # Extract text from the student's newly uploaded assignment
        new_text = extract_text(request.new_file_path)
        
        # EDGE CASE: If the PDF was just images and no text was found, or if it's the first submission
        if not new_text:
            raise HTTPException(status_code=422, detail='No readable text found; scanned PDFs need OCR')
        if not request.existing_file_paths:
            return {
                "similarity_percentage": 0.0, 
                "is_flagged": False, 
                "highest_match_file": None
            }

        # Extract text from all older submissions for comparison
        documents = [new_text]
        for path in request.existing_file_paths:
            documents.append(extract_text(path))

        # AI Processing: Convert text into mathematical vectors (TF-IDF)
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)

        # Calculate Cosine Similarity (comparing the first document to all the rest)
        similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        # NEW LOGIC: Loop through scores to find the highest one AND remember its file path
        for index, score in enumerate(similarity_scores):
            if score > best_score:
                best_score = float(score)
                best_match_file = request.existing_file_paths[index] # Grab the matching file!
        
        # Convert it to a percentage (0 to 100)
        max_similarity = best_score * 100
        
        # Flag the assignment if it hits 75% or higher
        is_flagged = max_similarity >= 75.0 

        # Return everything to Node.js!
        return {
            "similarity_percentage": round(max_similarity, 2),
            "is_flagged": is_flagged,
            "highest_match_file": best_match_file # This is sent back to your Node.js controller!
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. A quick test route to check if the server is alive
@app.get("/")
def read_root():
    return {"message": "AI Similarity Engine is awake and ready!"}
# Exact matching word sequences provide inspectable evidence rather than a verdict.
import re
from difflib import SequenceMatcher

@app.post('/compare-passages')
def compare_passages(request: SimilarityRequest):
    try:
        text = extract_text(request.new_file_path)
        if not text:
            raise HTTPException(status_code=422, detail='No readable text found; scanned PDFs need OCR')
        tokens = list(re.finditer(r'\b\w+\b', text))
        words = [t.group().casefold() for t in tokens]
        matches = []
        for file_path in request.existing_file_paths:
            source = extract_text(file_path)
            source_tokens = list(re.finditer(r'\b\w+\b', source))
            source_words = [t.group().casefold() for t in source_tokens]
            passages = []
            for block in SequenceMatcher(None, words, source_words, autojunk=False).get_matching_blocks():
                if block.size < 8:
                    continue
                start, end = tokens[block.a].start(), tokens[block.a + block.size - 1].end()
                source_start, source_end = source_tokens[block.b].start(), source_tokens[block.b + block.size - 1].end()
                passages.append({'start':len(text[:start].encode('utf-16-le'))//2,'end':len(text[:end].encode('utf-16-le'))//2,'text':text[start:end],'sourceText':source[source_start:source_end],'wordCount':block.size})
            if passages:
                matches.append({'file':file_path,'passages':passages})
        return {'text':text,'matches':matches,'minimumWords':8}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
