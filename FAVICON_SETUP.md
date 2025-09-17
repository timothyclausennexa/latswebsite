# Favicon Setup Instructions

## You need to create the following favicon files from your brain logo image:

1. **Save your brain logo image in these formats in the `public` folder:**
   - `favicon.ico` - 32x32 pixels (ICO format)
   - `favicon-16x16.png` - 16x16 pixels
   - `favicon-32x32.png` - 32x32 pixels
   - `favicon-192x192.png` - 192x192 pixels (for Android)
   - `favicon-512x512.png` - 512x512 pixels (for PWA)
   - `apple-touch-icon.png` - 180x180 pixels (for iOS)
   - `og-image.png` - 1200x630 pixels (for social media previews)
   - `twitter-card.png` - 1200x600 pixels (for Twitter)

## How to create these files:

### Option 1: Using an online tool (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload your brain logo image
3. Customize the settings
4. Download the package
5. Extract the files to your `public` folder

### Option 2: Using image editing software
1. Open your brain logo in Photoshop, GIMP, or any image editor
2. Resize to each required size
3. Save as PNG with transparent background
4. For the ICO file, use an online converter like https://convertio.co/png-ico/

### Option 3: Using ImageMagick (Command line)
```bash
# If you have ImageMagick installed:
convert brain-logo.png -resize 16x16 favicon-16x16.png
convert brain-logo.png -resize 32x32 favicon-32x32.png
convert brain-logo.png -resize 180x180 apple-touch-icon.png
convert brain-logo.png -resize 192x192 favicon-192x192.png
convert brain-logo.png -resize 512x512 favicon-512x512.png

# For ICO format:
convert brain-logo.png -resize 32x32 favicon.ico
```

## Social Media Images:
For the best appearance when shared on social media, create:
- `og-image.png` - 1200x630px with your logo and site name
- `twitter-card.png` - 1200x600px optimized for Twitter

## After adding the files:
1. Clear your browser cache
2. Refresh the page
3. The favicon should appear in the browser tab
4. The title will show: "LATS - Break Free or Die Trying | #FreeLats"

## Browser Tab Appearance:
- The page title is now more engaging and descriptive
- The theme color is set to pink (#FF1493) to match your brand
- The site will work as a Progressive Web App (PWA) on mobile devices