/**
 * Socket.io Authentication Middleware
 * Verifies JWT token and attaches user data to socket
 */

import { Socket } from 'socket.io';
import { tokenUtils, TokenPayload } from '../../../src/lib/auth';

// Extend Socket data type
declare module 'socket.io' {
  interface Socket {
    data: {
      userId: string;
      role: string;
      email: string;
    };
  }
}

/**
 * Extract JWT token from socket handshake
 */
function extractToken(socket: Socket): string | null {
  // 1. Try auth.token (manual connection with token)
  const authToken = socket.handshake.auth.token;
  if (authToken && typeof authToken === 'string') {
    return authToken;
  }

  // 2. Try cookies (automatic if browser sends cookies)
  const cookies = socket.handshake.headers.cookie;
  if (!cookies) return null;

  // Parse accessToken from cookies
  const match = cookies.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Socket.io Auth Middleware
 * Verifies JWT token before allowing connection
 */
export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    // Extract token
    const token = extractToken(socket);

    if (!token) {
      console.log('[Socket Auth] No token provided');
      return next(new Error('Authentication token missing'));
    }

    // Verify JWT using existing auth utility
    const payload: TokenPayload | null = tokenUtils.verifyAccessToken(token);

    if (!payload) {
      console.log('[Socket Auth] Invalid token');
      return next(new Error('Invalid or expired token'));
    }

    // Attach user data to socket for downstream handlers
    socket.data.userId = payload.userId;
    socket.data.role = payload.role;
    socket.data.email = payload.email;

    console.log(`[Socket Auth] Authenticated user: ${payload.email} (${payload.role})`);

    // Allow connection
    next();
  } catch (error) {
    console.error('[Socket Auth] Authentication error:', error);
    next(new Error('Authentication failed'));
  }
}
