from fastapi import APIRouter, HTTPException
from model.messages import create_message
from mongo import db

router = APIRouter(prefix="/mongo/threads", tags=["Mongo Messages"])


messages = db["messages"]

@router.post("/{thread_id}/messages")
def api_create_message(thread_id: str, role: str, content: str):
  
    try:
        msg_id = create_message(thread_id, role, content)
        return {"message_id": msg_id, "message": "Message created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{thread_id}/messages")
def api_get_messages(thread_id: str):
  
    try:
        cursor = messages.find({"thread_id": thread_id}).sort("created_at", 1)
        data = []
        for msg in cursor:
            msg["_id"] = str(msg["_id"])
            data.append(msg)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
