/**
 * Rate Limiting Middleware for Socket.io
 * Prevents spam by limiting message frequency per user
 */

import { Socket } from 'socket.io';
import { RateLimiter } from 'limiter';
import { SERVER_EVENTS } from '../events';

// Store rate limiters per user
const limiters = new Map<string, RateLimiter>();

/**
 * Rate limit configuration
 * 5 messages per 10 seconds per user
 */
const TOKENS_PER_INTERVAL = 5;
const INTERVAL_MS = 10000; // 10 seconds

/**
 * Get or create rate limiter for a user
 */
function getRateLimiter(userId: string): RateLimiter {
  if (!limiters.has(userId)) {
    limiters.set(
      userId,
      new RateLimiter({
        tokensPerInterval: TOKENS_PER_INTERVAL,
        interval: INTERVAL_MS,
      })
    );
  }
  return limiters.get(userId)!;
}

/**
 * Cleanup old rate limiters (call periodically to prevent memory leaks)
 */
function cleanupLimiters() {
  // Clear all limiters every hour
  // In a production system, you'd want more sophisticated cleanup
  limiters.clear();
}

// Cleanup every hour
setInterval(cleanupLimiters, 60 * 60 * 1000);

/**
 * Rate limit wrapper for event handlers
 * Usage: socket.on('event', rateLimitMiddleware(handler))
 */
export function rateLimitMiddleware<T extends any[]>(
  handler: (socket: Socket, ...args: T) => Promise<void> | void
): (socket: Socket, ...args: T) => Promise<void> {
  return async (socket: Socket, ...args: T) => {
    const userId = socket.data.userId;

    if (!userId) {
      socket.emit(SERVER_EVENTS.ERROR, {
        message: 'Authentication required',
      });
      return;
    }

    // Get rate limiter for user
    const limiter = getRateLimiter(userId);

    // Try to remove a token
    const remainingRequests = await limiter.removeTokens(1);

    if (remainingRequests < 0) {
      // Rate limit exceeded
      console.warn(`[Rate Limit] User ${userId} exceeded rate limit`);

      socket.emit(SERVER_EVENTS.MESSAGE_ERROR, {
        message: 'Rate limit exceeded. Please slow down (max 5 messages per 10 seconds).',
        code: 'RATE_LIMIT_EXCEEDED',
      });

      return;
    }

    // Allow the request
    try {
      await handler(socket, ...args);
    } catch (error) {
      console.error('[Rate Limit] Handler error:', error);
      socket.emit(SERVER_EVENTS.ERROR, {
        message: 'An error occurred processing your request',
      });
    }
  };
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string): {
  hasLimiter: boolean;
  remainingTokens: number;
} {
  const limiter = limiters.get(userId);

  if (!limiter) {
    return {
      hasLimiter: false,
      remainingTokens: TOKENS_PER_INTERVAL,
    };
  }

  return {
    hasLimiter: true,
    remainingTokens: limiter.getTokensRemaining(),
  };
}
