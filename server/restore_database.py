import os
import sys
from bson import json_util
from app.database import get_database

def run_restore(backup_dir):
    if not os.path.exists(backup_dir):
        print(f"Backup directory does not exist: {backup_dir}")
        return
    
    db = get_database()
    print(f"Restoring to database: '{db.name}' from: {backup_dir}")
    files = [f for f in os.listdir(backup_dir) if f.endswith(".json")]
    
    for f in sorted(files):
        coll_name = f[:-5]
        file_path = os.path.join(backup_dir, f)
        with open(file_path, "r", encoding="utf-8") as fp:
            data = json_util.loads(fp.read())
        
        if data:
            db[coll_name].delete_many({})
            db[coll_name].insert_many(data)
            print(f"  ✓ Restored {coll_name:25}: {len(data)} documents")
        else:
            print(f"  - Empty {coll_name:27}: 0 documents")
    
    print("\nRestore completed successfully.")

if __name__ == "__main__":
    bdir = sys.argv[1] if len(sys.argv) > 1 else "/www/wwwroot/nari_pehnawa/server/db_backups/backup_NariPehnawa_20260918_174247"
    run_restore(bdir)
