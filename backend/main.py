from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import posts, categories, users, user_profiles, knowledgebases, documents, service_configs
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Admin Test API",
    description="FastAPI backend for admin test application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(user_profiles.router, prefix="/api/user-profiles", tags=["user-profiles"])
app.include_router(knowledgebases.router, prefix="/api/knowledgebases", tags=["knowledgebases"])
app.include_router(documents.router, prefix="/api/knowledgebases", tags=["documents"])
app.include_router(service_configs.router, prefix="/api/service-configs", tags=["service-configs"])

@app.get("/")
async def root():
    return {"message": "Admin Test API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
