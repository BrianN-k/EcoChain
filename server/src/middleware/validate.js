const fs = require('fs');

// validate(schema) parses req.body with a zod schema and replaces it with the clean result.
// If validation fails and a file was uploaded, the file is deleted so nothing is left behind.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      if (req.file) fs.unlink(req.file.path, () => {});
      const issues = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: issues[0]?.message || 'Invalid input', issues });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
