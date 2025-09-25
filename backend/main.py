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
    """Serve static files (CSS, JS, images, etc.)"""
    file_location = os.path.join(static_dir, file_path)
    
    if os.path.exists(file_location) and os.path.isfile(file_location):
        return FileResponse(file_location)
    
    # If file not found, serve 404 or redirect to index
    return FileResponse(os.path.join(static_dir, "index.html"))

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