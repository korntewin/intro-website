// create-icon.js
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create canvas for 32x32 icon
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Draw a background
ctx.fillStyle = '#2d3748';
ctx.fillRect(0, 0, 32, 32);

// Draw text 'K'
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('K', 16, 15);

// Draw accent line
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(8, 24);
ctx.lineTo(24, 24);
ctx.stroke();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'public', 'icon.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), buffer);
fs.writeFileSync(path.join(__dirname, 'public', 'apple-icon.png'), buffer);

console.log('Icons created successfully!');
