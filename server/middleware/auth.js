import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'glucotrack_jwt_secret_key_2026_clinical';

export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please log in or provide a valid JWT token.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired JWT authentication token.',
    });
  }
}
