const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Sin cache para CSS y JS (evitar versiones desactualizadas en móvil)
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js)$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Para cualquier otra ruta, servir index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
