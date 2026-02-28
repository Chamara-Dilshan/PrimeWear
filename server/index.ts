/**
 * Socket.io Server for Real-time Chat
 * Runs on port 3001 (separate from Next.js)
 * Environment variables loaded via tsx --env-file flag
 */

import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { authMiddleware } from './socket/middleware/authMiddleware';
import { CLIENT_EVENTS, SERVER_EVENTS } from './socket/events';
import { registerChatHandlers } from './socket/handlers/chatHandler';
import { registerRoomHandlers, autoJoinUserRooms, handleUserDisconnect } from './socket/handlers/roomHandler';
import { registerTypingHandlers } from './socket/handlers/typingHandler';
import { registerNotificationHandlers } from './socket/handlers/notificationHandler';
import { startTrackingPoller } from './services/trackingPoller';

// Environment variables
const PORT = process.env.SOCKET_PORT || 3001;
const REDIS_URL = process.env.REDIS_URL;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!REDIS_URL) {
  console.error('REDIS_URL environment variable is not set');
  process.exit(1);
}

/**
 * Bootstrap Socket.io server
 */
async function bootstrap() {
  try {
    // Create HTTP server
    const httpServer = createServer();

    // Create Socket.io server
    const io = new Server(httpServer, {
      cors: {
        origin: NEXT_PUBLIC_APP_URL,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Set up Redis Pub/Sub adapter for horizontal scaling
    console.log('[Socket.io] Connecting to Redis...');

    // Create Redis clients with proper configuration
    const pubClient = new Redis(REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    const subClient = new Redis(REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    // Add error handlers to prevent unhandled 'error' warnings
    pubClient.on('error', (err) => {
      console.error('[Redis Pub] Connection error:', err.message);
    });

    subClient.on('error', (err) => {
      console.error('[Redis Sub] Connection error:', err.message);
    });

    // Wait for Redis connections
    await Promise.all([
      new Promise((resolve) => pubClient.once('connect', resolve)),
      new Promise((resolve) => subClient.once('connect', resolve)),
    ]);

    console.log('[Socket.io] Redis connected, setting up adapter...');
    io.adapter(createAdapter(pubClient, subClient));

    // Make io instance available for notifications
    const { setSocketIoInstance } = await import('../src/lib/notifications/notificationBroadcast');
    setSocketIoInstance(io);

    // Authentication middleware (runs on connection)
    io.use(authMiddleware);

    // Connection handler
    io.on('connection', async (socket: Socket) => {
      const { userId, role, email } = socket.data;
      console.log(`[Socket.io] User connected: ${email} (${role})`);

      // Auto-join user's chat rooms
      await autoJoinUserRooms(io, socket);

      // Register event handlers
      registerChatHandlers(io, socket);
      registerRoomHandlers(io, socket);
      registerTypingHandlers(io, socket);
      registerNotificationHandlers(io, socket);

      // Disconnect handler
      socket.on('disconnect', (reason) => {
        console.log(`[Socket.io] User disconnected: ${email} (${reason})`);
        handleUserDisconnect(io, socket);
      });

      // Error handler
      socket.on('error', (error) => {
        console.error(`[Socket.io] Socket error for ${email}:`, error);
      });
    });

    // Global error handler
    io.engine.on('connection_error', (err) => {
      console.error('[Socket.io] Connection error:', err);
    });

    // Start auto-tracking polling (disabled if AFTERSHIP_API_KEY not set)
    startTrackingPoller();

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Socket.io server running on port ${PORT}`);
      console.log(`   - WebSocket URL: ws://localhost:${PORT}`);
      console.log(`   - CORS origin: ${NEXT_PUBLIC_APP_URL}`);
      console.log(`   - Redis adapter: ${REDIS_URL ? 'enabled' : 'disabled'}\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Socket.io] SIGTERM received, closing server...');
      httpServer.close(() => {
        console.log('[Socket.io] Server closed');
        pubClient.quit();
        subClient.quit();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[Socket.io] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
bootstrap();
