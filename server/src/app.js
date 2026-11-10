const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_DIR } = require('./middleware/upload');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

// Evidence images are only visible to logged-in users (the browser fetches them with a token
// through the API below), so they are NOT served as a public static folder.
app.get('/api/evidence/:file', requireAuth, (req, res, next) => {
  const file = path.basename(req.params.file); // strips any ../ tricks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.join(UPLOAD_DIR, file), (err) => err && next());
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/citizen', require('./routes/citizen'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
