function issueToken(user) {
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

function decodeToken(token) {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function authRequired(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ error: 'no token' });
  const token = hdr.split(' ')[1];
  const user = decodeToken(token);
  if (!user) return res.status(401).json({ error: 'invalid token' });
  req.user = user;
  next();
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
    next();
  });
}

module.exports = { issueToken, authRequired, adminRequired };
