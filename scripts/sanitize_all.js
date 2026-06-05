const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

function fixPaths(obj) {
  let changed = false;
  if (typeof obj === 'string') {
    if (obj.startsWith('/assets/')) {
      return { val: obj.substring(1), changed: true };
    }
    return { val: obj, changed: false };
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const res = fixPaths(obj[i]);
      if (res.changed) { obj[i] = res.val; changed = true; }
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const k in obj) {
      const res = fixPaths(obj[k]);
      if (res.changed) { obj[k] = res.val; changed = true; }
    }
  }
  return { val: obj, changed };
}

let totalFilesFixed = 0;
for (const file of files) {
  const filePath = path.join(templatesDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const { val, changed } = fixPaths(data);
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(val, null, 2), 'utf8');
      console.log(`Fixed paths in ${file}`);
      totalFilesFixed++;
    } else {
      console.log(`${file} had no leading slashes.`);
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e.message);
  }
}
console.log(`Done. Total files fixed: ${totalFilesFixed}`);
