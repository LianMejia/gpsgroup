const express = require('express');
const session = require('cookie-session');
const path = require('path');
const { PORT, SERVER_SESSION_SECRET } = require('./config.js');

let app = express();
app.use(express.static('wwwroot'));
app.use(session({ secret: SERVER_SESSION_SECRET, maxAge: 24 * 60 * 60 * 1000 }));
app.use(require('./routes/auth.js'));
app.use(require('./routes/hubs.js'));
// Servir archivos estáticos desde wwwroot
app.use(express.static(path.join(__dirname, 'wwwroot')));

// Manejo de rutas desconocidas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'wwwroot', 'index.html'));
});
app.use('/pdfs', express.static('public/pdfs'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
