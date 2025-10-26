from fastapi import APIRouter, HTTPException, Query
from model.threads import create_thread, get_all_threads 

router = APIRouter(prefix="/mongo/threads", tags=["Mongo Threads"])

@router.post("/")
def api_create_thread(first_message: str):
    
    try:
        thread_id = create_thread(first_message)
        return {"thread_id": thread_id, "message": "Thread created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def api_get_threads(page: int = Query(1, ge=1), threads_limit: int = Query(5, ge=1)):
 
    try:
        result = get_all_threads(page=page, threads_limit=threads_limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
