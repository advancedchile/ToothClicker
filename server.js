const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the current directory
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to save external templates
app.post('/api/save-template', (req, res) => {
  try {
    const { filePath, content } = req.body;
    
    if (!filePath || !content) {
      return res.status(400).json({ ok: false, error: 'Missing parameters' });
    }
    
    // Security check: only allow saving to the templates folder
    if (!filePath.startsWith('templates/') && !filePath.startsWith('./templates/')) {
      return res.status(403).json({ ok: false, error: 'Access denied: can only save to templates folder' });
    }

    const fullPath = path.join(__dirname, filePath);
    
    // Ensure the directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
    console.log(`[Server] Guardado exitoso: ${filePath}`);
    
    res.json({ ok: true });
  } catch (err) {
    console.error(`[Server] Error al guardar plantilla:`, err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 Servidor Local activo en http://localhost:${PORT}`);
  console.log(`==============================================\n`);
  console.log(`Este servidor reemplaza a 'npx serve' y añade`);
  console.log(`soporte para guardado automático de plantillas.\n`);
});
