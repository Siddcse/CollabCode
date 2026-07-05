import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { env } from './config/env';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { errorHandler } from './middlewares/error.middleware';
import { initializeSocket } from './socket';

import roomRoutes from './routes/room.routes';
import codeRoutes from './routes/code.routes';
import historyRoutes from './routes/history.routes';

async function bootstrap(): Promise<void> {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression() as any);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      db: process.env.DB_STATUS ?? 'pending',
    });
  });

  app.use('/api/room', roomRoutes);
  app.use('/api/code', codeRoutes);
  app.use('/api/history', historyRoutes);

  app.use(errorHandler);

  initializeSocket(io);

  // ── Start HTTP server FIRST — don't block on DB ──
  httpServer.listen(env.PORT, () => {
    console.log(`🚀 CollabCode backend  →  http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log('   Connecting to MongoDB and Redis in background…');
  });

  // ── DB / Redis connect in background (non-blocking) ──
  connectDB().catch(() => {
    console.warn('⚠️  Running in memory-only mode — data will not persist');
  });
  connectRedis().catch(() => {
    console.warn('⚠️  Redis unavailable — real-time OT state stored in memory');
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
