import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const executionRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, error: 'Too many execution requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
