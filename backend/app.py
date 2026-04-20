from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import close_pool, init_db

from .routes import router

init_db()

app = FastAPI(title="ChatBot AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("shutdown")
def shutdown_event():
    close_pool()
    print("Database connection pool closed.")
