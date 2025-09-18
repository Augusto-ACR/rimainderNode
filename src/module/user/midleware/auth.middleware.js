// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';

/**
 * Middleware que exige Authorization: Bearer <token>
 * y coloca req.user = { id, username, role }
 */
export function authGuard(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const [, token] = hdr.split(" ");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const payload = jwt.verify(token, secret);
    // payload: { id, username, role }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}
