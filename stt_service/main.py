from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import logging
from transcriber import Transcriber

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Justice AI STT Service")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

async def verify_token(authorization: str = Header(None)):
    """
    Basic token presence check. 
    In a real production system, verify this against the auth provider/DB.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    # For now, we accept any bearer token as valid since we share the token from frontend
    return authorization

@app.post("/api/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """
    Receives an audio file, saves it momentarily, and returns the transcription.
    """
    # Generate unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(TEMP_DIR, filename)
    
    try:
        logger.info(f"Receiving file: {file.filename}")
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"File saved to {file_path}. Starting transcription...")
        
        # Transcribe
        text, language = Transcriber.transcribe(file_path)
        
        logger.info(f"Transcription complete. Language: {language}")
        
        return {
            "text": text,
            "language": language,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup temp file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to delete temp file: {cleanup_error}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "stt-service"}

if __name__ == "__main__":
    import uvicorn
    # process.env.PORT or 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
