import jwt from 'jsonwebtoken';
import { AuthPayload, UserRole } from '../types/index.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'ticketflow-secret-key-fallback';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as any;

/**
 * Generates a signed JWT token containing the AuthPayload.
 */
export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verifies a JWT token and returns the decoded AuthPayload.
 */
export const verifyToken = (token: string): AuthPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role as UserRole
  };
};

export default {
  generateToken,
  verifyToken
};
