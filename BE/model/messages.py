from datetime import datetime
from mongo import db

# Chọn collection messages
messages = db["messages"]

def create_message(thread_id, role, content):
    # Thêm một tin nhắn mới vào MongoDB.role: 'user' hoặc 'assistant'
    message = {
        "thread_id": thread_id,
        "role": role,
        "content": content,
        "created_at": datetime.utcnow()
    }
    result = messages.insert_one(message)
    return str(result.inserted_id)


