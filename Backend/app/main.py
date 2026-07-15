from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.features.auth.router import router as auth_router
from app.features.listings.router import router as listings_router
from app.features.posts.router import router as posts_router
from app.features.bookings.router import router as bookings_router
from app.features.panic.router import router as panic_router
from app.features.admin.router import router as admin_router

app = FastAPI(
    title="Hosting for Shabbat API",
    description="Backend API for managing host and guest matchmaking for Shabbat",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all feature routers
app.include_router(auth_router, prefix="/api")
app.include_router(listings_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(bookings_router, prefix="/api")
app.include_router(panic_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Hosting for Shabbat API is running"}
