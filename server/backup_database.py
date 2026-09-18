import os
import sys
from datetime import datetime
from bson import json_util
from app.database import get_database

def run_backup():
    db = get_database()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"/www/wwwroot/nari_pehnawa/server/db_backups/backup_NariPehnawa_{timestamp}"
    os.makedirs(backup_dir, exist_ok=True)
    
    print(f"Starting FULL backup for database: '{db.name}' into: {backup_dir}")
    collections = sorted(db.list_collection_names())
    total_docs = 0
    
    for coll_name in collections:
        coll = db[coll_name]
        docs = list(coll.find({}))
        doc_count = len(docs)
        total_docs += doc_count
        
        file_path = os.path.join(backup_dir, f"{coll_name}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(json_util.dumps(docs, indent=2))
        
        print(f"  ✓ Backed up {coll_name:25}: {doc_count} documents")
    
    print(f"\nSuccessfully backed up {total_docs} total documents across {len(collections)} collections.")
    print(f"Backup saved at: {backup_dir}")
    return backup_dir

if __name__ == "__main__":
    run_backup()
