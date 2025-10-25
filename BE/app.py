import os, datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId
from pydantic import BaseModel

load_dotenv()

# app.py
from fastapi import FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True
)

# 1) Kết nối Mongo
client = AsyncIOMotorClient(os.environ["URI"])
db = client['chatbotdb']  # Specify database name

# 2) Healthcheck
@app.get("/health")
async def health():
    await db.command("ping")
    return {"ok": True}

# Pydantic models
class ThreadCreate(BaseModel):
    title: str

class MessageCreate(BaseModel):
    threadId: str
    role: str
    content: str

# 3) Tạo thread
@app.post("/threads")
async def create_thread(thread_data: ThreadCreate):
    now = datetime.datetime.utcnow()
    res = await db.threads.insert_one({
        "title": thread_data.title,
        "tags": [], "archived": False,
        "createdAt": now, "updatedAt": now,
        "messagesCount": 1  # Bắt đầu với 1 message chào mừng
    })
    
    thread_id = res.inserted_id
    
    # Thêm tin nhắn chào mừng của AI
    welcome_message = {
        "threadId": thread_id,
        "role": "assistant",
        "content": "Xin chào 👋\nMình là AI Assistant. Hãy hỏi mình điều gì đó!",
        "createdAt": now
    }
    await db.messages.insert_one(welcome_message)
    
    return {"id": str(thread_id)}

# 4) Thêm message (user/assistant đều dùng)
@app.post("/messages")
async def add_message(message_data: MessageCreate):
    try:
        tid = ObjectId(message_data.threadId)
    except Exception:
        raise HTTPException(400, "Invalid threadId")
    now = datetime.datetime.utcnow()
    await db.messages.insert_one({
        "threadId": tid,
        "role": message_data.role,
        "content": message_data.content,
        "createdAt": now
    })
    
    # Nếu là message đầu tiên của user, đổi tên thread
    if message_data.role == "user":
        # Kiểm tra xem đây có phải message đầu tiên của user không
        user_messages_count = await db.messages.count_documents({
            "threadId": tid,
            "role": "user"
        })
        
        if user_messages_count == 1:  # Message đầu tiên của user (sau tin nhắn chào mừng)
            # Tạo title từ nội dung message (giới hạn 50 ký tự)
            title = message_data.content[:50].strip()
            if len(message_data.content) > 50:
                title += "..."
            
            await db.threads.update_one(
                {"_id": tid},
                {"$set": {"title": title}}
            )
    
    await db.threads.update_one(
        {"_id": tid},
        {"$inc": {"messagesCount": 1},
         "$set": {"updatedAt": now, "lastMessageAt": now}}
    )
    return {"ok": True}

# 5) Lấy tất cả threads
@app.get("/threads")
async def get_all_threads():
    threads = []
    async for thread in db.threads.find().sort("updatedAt", -1):
        threads.append({
            "id": str(thread["_id"]),
            "title": thread["title"],
            "updatedAt": thread["updatedAt"].isoformat(),
            "messagesCount": thread.get("messagesCount", 0)
        })
    return threads

# 6) Cập nhật tên thread
@app.put("/threads/{thread_id}")
async def update_thread_title(thread_id: str, title_data: dict):
    try:
        tid = ObjectId(thread_id)
    except Exception:
        raise HTTPException(400, "Invalid threadId")
    
    await db.threads.update_one(
        {"_id": tid},
        {"$set": {"title": title_data["title"], "updatedAt": datetime.datetime.utcnow()}}
    )
    return {"ok": True}

# 6) Lấy messages của 1 thread (cursor theo _id)
@app.get("/threads/{thread_id}/messages")
async def get_messages(thread_id: str, before_id: str | None = None, limit: int = 50):
    try:
        tid = ObjectId(thread_id)
    except Exception:
        raise HTTPException(400, "Invalid threadId")
    q = {"threadId": tid}
    if before_id:
        q["_id"] = {"$lt": ObjectId(before_id)}
    cur = db.messages.find(q).sort([("_id", -1)]).limit(limit)
    items = []
    async for m in cur:
        items.append({
            "id": str(m["_id"]),
            "role": m["role"],
            "content": m["content"],
            "createdAt": m["createdAt"].isoformat()
        })
    return items
