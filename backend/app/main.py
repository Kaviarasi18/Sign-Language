import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.predict import router as predict_router
from app.services.isl_adapter import isl_adapter

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    isl_adapter.load()
    yield


app = FastAPI(
    title="SignBridge ISL Inference Backend",
    description="FastAPI inference service for Indian Sign Language temporal sequence recognition.",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(health_router)
app.include_router(predict_router)
