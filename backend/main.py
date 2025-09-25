"""
FastAPI server for Corporate Website
Handles contact form submissions with security and GDPR compliance
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from pathlib import Path

# Import API routers
from api.contact import router as contact_router
from api.users import router as users_router

# Create FastAPI app
app = FastAPI(
    title="Corporate Website API",
    description="Secure API for corporate website with GDPR compliance",
    version="1.0.0"
)

# Configure CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(contact_router)
app.include_router(users_router, prefix="/api")

# Serve static files
static_dir = Path(__file__).parent.parent
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def serve_index():
    """Serve the main index.html"""
    return FileResponse(os.path.join(static_dir, "index.html"))

@app.get("/contact.html")
async def serve_contact():
    """Serve the contact page"""
    return FileResponse(os.path.join(static_dir, "contact.html"))

@app.get("/{file_path:path}")
async def serve_static_file(file_path: str):
    """Serve static files with security restrictions"""
    # Whitelist of allowed files mapped to safe paths
    allowed_files = {
        'style.css': 'style.css',
        'main.js': 'main.js', 
        'contact.js': 'contact.js',
        'index.html': 'index.html',
        'contact.html': 'contact.html'
    }
    
    # Extract just the filename, ignore any path components
    filename = os.path.basename(file_path)
    
    # Only serve explicitly allowed files using pre-defined safe paths
    if filename in allowed_files:
        safe_filename = allowed_files[filename]  # Get safe filename from whitelist
        safe_file_path = f"{static_dir}/{safe_filename}"  # Use string formatting instead of os.path.join
        
        # Verify file exists
        if os.path.exists(safe_file_path) and os.path.isfile(safe_file_path):
            return FileResponse(safe_file_path)
    
    # Default to index if file not found or not allowed
    index_path = f"{static_dir}/index.html"
    return FileResponse(index_path)

@app.get("/api/health")
async def health_check():
    """General health check"""
    return {
        "status": "healthy",
        "service": "corporate-website-api",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        access_log=True
    )