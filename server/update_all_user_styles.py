import os

def update_all():
    target_dir = "/www/wwwroot/nari_pehnawa/client/src/user"
    for filename in os.listdir(target_dir):
        if filename.endswith(".jsx"):
            filepath = os.path.join(target_dir, filename)
            with open(filepath, "r") as f:
                content = f.read()
            
            # Replace gold/yellow with cyan/teal brand colors
            # We also handle border-yellow-50 / bg-yellow-50, etc.
            updated = content.replace("#d4af37", "#0891b2")
            updated = updated.replace("#c9a961", "#06b6d4")
            updated = updated.replace("text-[#d4af37]", "text-[#0891b2]")
            updated = updated.replace("border-[#d4af37]", "border-[#0891b2]")
            updated = updated.replace("bg-[#d4af37]", "bg-[#0891b2]")
            updated = updated.replace("bg-yellow-50/30", "bg-cyan-50/30")
            updated = updated.replace("hover:bg-yellow-50", "hover:bg-cyan-50/50")
            
            with open(filepath, "w") as f:
                f.write(updated)
            print(f"Updated styles in {filename}")

if __name__ == "__main__":
    update_all()
