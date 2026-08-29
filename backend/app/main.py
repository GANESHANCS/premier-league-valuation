from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api import health, compare, players, valuations, transfers

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Premier League Valuation Intelligence (PL ValuEdge) - powered by XGBoost ML model and real Transfermarkt-derived datasets.",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers (Mount compare before {player_id} path parameters)
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(compare.router, prefix=f"{settings.API_PREFIX}/players")
app.include_router(players.router, prefix=f"{settings.API_PREFIX}/players")
app.include_router(valuations.router, prefix=f"{settings.API_PREFIX}/players")
app.include_router(transfers.router, prefix=f"{settings.API_PREFIX}/players")

@app.get("/")
def root():
    return {
        "message": "Welcome to Premier League Valuation Intelligence API",
        "docs": f"{settings.API_PREFIX}/docs",
        "health": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
