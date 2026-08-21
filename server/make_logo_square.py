from PIL import Image

def make_square():
    input_path = "/www/wwwroot/nari_pehnawa/client/public/logo.png"
    output_path = "/www/wwwroot/nari_pehnawa/client/public/logo_square.png"
    
    img = Image.open(input_path)
    width, height = img.size
    
    # We want a square box of max(width, height)
    max_size = max(width, height)
    
    # Create transparent square background
    new_img = Image.new("RGBA", (max_size, max_size), (0, 0, 0, 0))
    
    # Calculate position to center the image
    x = (max_size - width) // 2
    y = (max_size - height) // 2
    
    # Paste centered
    new_img.paste(img, (x, y))
    new_img.save(output_path, "PNG")
    print(f"Square logo saved to {output_path} (size: {max_size}x{max_size})")

if __name__ == "__main__":
    make_square()
