#thread = conversation + ngày và nội dung
from datetime import datetime
from mongo import db
#ket noi voi db thread
threads = db['threads']
#cau truc cuua thread
#Để tạo một record / document bạn cần kết nôí đến một collection trong database . Và sử dụng hàm insert_one() .
# Hàm insert_one() chấp nhập một object có name(s) và value(s) cho mỗi field trong document mà bạn muốn insert 
# Hàm insert_one() sẽ trả ra một object InsertOneResult . Object đó có thuộc tính inserted_id . Nó chính là id của document vừa mới insert vào. ko điền id thì mongo sẽ tự tạo id cho doc
def create_thread(first_message): #firstmesdùng để phân biệt đoạn chat 
    title = first_message[:40]
    thread = {
        'title':title,
        'created_at': datetime.utcnow()
    }
    record = threads.insert_one(thread)
    return str(record.inserted_id)

def get_all_threads(page = 1, threads_limit = 3):
    # nếu user nhập page nhỏ hơn 1 thì mặc định là một
    if page < 1:
        page = 1 
    # tính số lượng trang cần bỏ qua
    page_skipped = (page - 1) * threads_limit
    
    #  find trả vè toàn bộ threads, sort theo thread mới nhất
    cursor = threads.find().sort('created_at', - 1).skip(page_skipped).limit(threads_limit)
    # chuyển từ dạng cursor của mongo sang list
    data = list(cursor)
    # tổng số thread của databsae
    total = threads.count_documents({})
    
    return {
        "page": page,              # số trang hiện tại
        "limit": threads_limit,    # số lượng thread mỗi trang
        "total_threads": total,    # tổng số thread trong DB
        "threads": data            # danh sách các thread của trang hiện tại
    }
    
     
    
    


    