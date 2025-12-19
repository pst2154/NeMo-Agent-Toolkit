"""
Main FastAPI application for the Visual Agent Builder.

This module serves as the entry point for the Visual Agent Builder backend API.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import workflows, components, validation, export, testing
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("🚀 Starting Visual Agent Builder Backend...")

    # Initialize database
    init_db()

    print("✅ Backend started successfully!")

    yield

    # Shutdown
    print("🛑 Shutting down Visual Agent Builder Backend...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance.
    """
    app = FastAPI(
        title="Visual Agent Builder API",
        description="A modern, no-code visual interface for building AI agent workflows using NeMo-Agent-Toolkit",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
    app.include_router(components.router, prefix="/api/components", tags=["components"])
    app.include_router(validation.router, prefix="/api/validation", tags=["validation"])
    app.include_router(export.router, prefix="/api/export", tags=["export"])
    app.include_router(testing.router, prefix="/api/testing", tags=["testing"])

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "service": "visual-agent-builder-backend",
            "version": "1.0.0"
        }

    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return {
            "message": "Visual Agent Builder API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health"
        }

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
