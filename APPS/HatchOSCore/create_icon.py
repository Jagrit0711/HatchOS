from PIL import Image, ImageDraw, ImageFont

# Create icon
size = 1024
img = Image.new('RGB', (size, size), color='#000000')
draw = ImageDraw.Draw(img)

# Draw circle background
circle_color = '#FF6B00'
padding = 100
draw.ellipse([padding, padding, size-padding, size-padding], fill=circle_color)

# Draw shield emoji/icon representation
shield_color = '#FFFFFF'
points = [
    (size//2, padding + 150),  # top
    (padding + 200, padding + 250),  # left
    (padding + 200, size - padding - 250),  # bottom left
    (size//2, size - padding - 150),  # bottom center
    (size - padding - 200, size - padding - 250),  # bottom right
    (size - padding - 200, padding + 250),  # right
]
draw.polygon(points, fill=shield_color)

# Save as different sizes
img.save('assets/icon.png')
img.save('assets/adaptive-icon.png')
img.save('assets/splash-icon.png')

# Create favicon (smaller)
favicon = img.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save('assets/favicon.png')

print("✅ Icons created successfully!")
