import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from './auth-service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify and decode token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Token invalid, but continue without user
    next();
  }
}

/**
 * Get user ID from request
 * Throws error if user not authenticated
 */
export function getUserId(req: Request): string {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user.userId;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}
