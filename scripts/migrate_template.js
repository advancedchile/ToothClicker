const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, '../templates/plantilla-mpkhffgx829bw.json');
const outputFilePath = path.join(__dirname, '../templates/plantilla-mpkhffgx829bw_optimized.json');
const assetsDir = path.join(__dirname, '../public/assets');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

let rawData = fs.readFileSync(inputFilePath, 'utf8');
let json = JSON.parse(rawData);

function extractExtension(mimeType, isBase64) {
  if (mimeType.includes('image/png')) return '.png';
  if (mimeType.includes('image/jpeg')) return '.jpg';
  if (mimeType.includes('image/webp')) return '.webp';
  if (mimeType.includes('image/gif')) return '.gif';
  if (mimeType.includes('image/svg+xml')) return '.svg';
  if (mimeType.includes('application/octet-stream')) return '.glb';
  if (mimeType.includes('model/gltf-binary')) return '.glb';
  return '.bin';
}

function traverseAndExtract(obj, currentPath) {
  for (let key in obj) {
    if (typeof obj[key] === 'string' && obj[key].startsWith('data:')) {
      const match = obj[key].match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const ext = extractExtension(mimeType);
        
        // Determine category based on currentPath or key
        let category = 'misc';
        const lowerPath = currentPath.toLowerCase();
        const lowerKey = key.toLowerCase();
        
        if (lowerPath.includes('generators')) category = 'generators';
        else if (lowerPath.includes('upgrade')) category = 'upgrades';
        else if (lowerPath.includes('bonus')) category = 'bonuses';
        else if (lowerPath.includes('tooth')) category = 'teeth';
        else if (lowerPath.includes('branding') || lowerKey.includes('logo') || lowerKey.includes('favicon') || lowerKey.includes('bg')) category = 'branding';

        const catDir = path.join(assetsDir, category);
        if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

        const filename = `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}${ext}`;
        const filePath = path.join(catDir, filename);
        
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        
        console.log(`Saved: assets/${category}/${filename}`);
        obj[key] = `assets/${category}/${filename}`;
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      traverseAndExtract(obj[key], `${currentPath}.${key}`);
    }
  }
}

console.log('Starting extraction...');
traverseAndExtract(json, 'root');
console.log('Extraction complete.');

fs.writeFileSync(outputFilePath, JSON.stringify(json, null, 2), 'utf8');
console.log(`Saved optimized template to: ${outputFilePath}`);
