import re

def update_profile():
    filepath = "/www/wwwroot/nari_pehnawa/client/src/user/Profile.jsx"
    with open(filepath, "r") as f:
        content = f.read()
        
    # Replace the gold/yellow color codes
    content = content.replace("#d4af37", "#0891b2")
    content = content.replace("#c9a961", "#06b6d4")
    
    # Locate and remove the Account Stats block at the bottom
    # Look for the section:
    #             {/* Account Stats */}
    #             <div className="grid grid-cols-1 ...
    #             ...
    #             </div>
    #         </div>
    #     );
    # };
    
    pattern = r'\{\/\*\s*Account Stats\s*\*\/\}.*?<\/div>\s*<\/div>\s*\);\s*\};\s*export default Profile;'
    # We want to replace it to just have the closing </div> of the main div:
    replacement = '</div>\n    );\n};\n\nexport default Profile;'
    
    updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(filepath, "w") as f:
        f.write(updated_content)
    print("Profile.jsx updated successfully!")

if __name__ == "__main__":
    update_profile()
