from PIL import Image, ImageDraw, ImageFont

# Create main icon
img = Image.new('RGB', (1024, 1024), '#667eea')
draw = ImageDraw.Draw(img)

# Gradient circles
draw.ellipse([100, 100, 924, 924], fill='#764ba2')
draw.ellipse([200, 200, 824, 824], fill='#667eea')

# Draw MC text instead of emoji
try:
    font = ImageFont.truetype('arial.ttf', 300)
except:
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 300)

draw.text((512, 512), 'MC', fill='white', anchor='mm', font=font)

# Save different sizes
img.save('assets/icon.png')
img.resize((192, 192)).save('assets/adaptive-icon.png')
img.resize((48, 48)).save('assets/favicon.png')
img.save('assets/splash-icon.png')

print('App icons created successfully!')
