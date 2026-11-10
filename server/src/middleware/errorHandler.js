const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Central error handler: every error becomes a clean JSON response.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.status && err.message) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (maximum 5 MB)' : 'Upload failed';
    return res.status(400).json({ error: message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err.code === 'P2002') {
    // Prisma unique-constraint violation
    return res.status(409).json({ error: 'A record with these details already exists' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
