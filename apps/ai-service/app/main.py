from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.routes import router as api_router

app = FastAPI(title="OpenMe AI Service")

app.include_router(health_router)
app.include_router(api_router)
