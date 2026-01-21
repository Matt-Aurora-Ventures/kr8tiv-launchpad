#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 *
 * This script generates placeholder PNG icons for the PWA manifest.
 * In production, replace these with professionally designed icons.
 *
 * Prerequisites:
 * - npm install sharp (for PNG generation)
 *
 * Usage:
 * - node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG template for the icon
const generateSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>

  <!-- K Letter/Logo -->
  <g transform="translate(${size * 0.25}, ${size * 0.2})">
    <path
      d="M0 0 L0 ${size * 0.6} M0 ${size * 0.3} L${size * 0.3} 0 M0 ${size * 0.3} L${size * 0.3} ${size * 0.6}"
      stroke="white"
      stroke-width="${size * 0.1}"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </g>
</svg>`;

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate SVG icons as fallback
console.log('Generating SVG placeholder icons...\n');

SIZES.forEach((size) => {
  const svgContent = generateSVG(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`  Created: ${filename}`);
});

// Create a simple HTML file to visualize icons
const previewHTML = `<!DOCTYPE html>
<html>
<head>
  <title>PWA Icons Preview</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #1a1a1a; color: #fff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 2rem; }
    .icon-card { text-align: center; }
    .icon-card img { max-width: 100%; border-radius: 20%; background: #333; }
    .icon-card p { margin-top: 0.5rem; font-size: 0.875rem; color: #999; }
  </style>
</head>
<body>
  <h1>KR8TIV PWA Icons</h1>
  <p style="color: #999;">Replace these SVG placeholders with PNG icons for production.</p>
  <div class="grid">
    ${SIZES.map(size => `
    <div class="icon-card">
      <img src="icon-${size}.svg" alt="${size}x${size}" width="${Math.min(size, 192)}" />
      <p>${size}x${size}</p>
    </div>
    `).join('')}
  </div>

  <h2 style="margin-top: 2rem;">To Generate PNGs:</h2>
  <pre style="background: #333; padding: 1rem; border-radius: 8px; overflow-x: auto;">
# Install sharp for PNG conversion
npm install sharp

# Then uncomment PNG generation in this script
# Or use an online SVG to PNG converter
  </pre>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'preview.html'), previewHTML);
console.log('\n  Created: preview.html (open in browser to see icons)');

console.log(`
Done! Icons saved to: ${OUTPUT_DIR}

Note: These are SVG placeholders. For production:
1. Replace with properly designed PNG icons
2. Use a tool like realfavicongenerator.net
3. Or convert these SVGs to PNGs using sharp/imagemagick

The manifest.json expects PNG files, so either:
- Convert these SVGs to PNGs
- Update manifest.json to use .svg extensions
`);
