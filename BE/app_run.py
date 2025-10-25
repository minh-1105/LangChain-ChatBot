from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"], 
    allow_credentials=True
)

# Health check without MongoDB
@app.get("/health")
async def health():
    return {"ok": True, "message": "Backend is running"}

# Test endpoint
@app.get("/test")
async def test():
    return {"message": "Backend connected successfully", "timestamp": datetime.datetime.now().isoformat()}

# Mock thread creation
@app.post("/threads")
async def create_thread(title: str):
    return {"id": "mock-thread-id", "title": title, "status": "created"}

# Mock message creation
@app.post("/messages")
async def add_message(threadId: str, role: str, content: str):
    return {"ok": True, "message": "Message added successfully"}

# Mock get messages
@app.get("/threads/{thread_id}/messages")
async def get_messages(thread_id: str, before_id: str = None, limit: int = 50):
    return [
        {
            "id": "msg-1",
            "role": "user",
            "content": "Hello!",
            "createdAt": datetime.datetime.now().isoformat()
        },
        {
            "id": "msg-2", 
            "role": "assistant",
            "content": "Hi there! How can I help you?",
            "createdAt": datetime.datetime.now().isoformat()
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
