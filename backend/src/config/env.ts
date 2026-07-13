import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).default('dev-secret-do-not-use-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  DOCKER_SOCKET_PATH: z.string().optional(),
  EXECUTION_TIMEOUT_MS: z.coerce.number().default(10000),
  EXECUTION_MEMORY_LIMIT: z.coerce.number().default(134217728),
  EXECUTION_CPU_QUOTA: z.coerce.number().default(50000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),
});

type Env = z.infer<typeof envSchema>;

let _env: Env;

export function getEnv(): Env {
  if (!_env) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
      process.exit(1);
    }
    _env = parsed.data;
    if (_env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      console.warn('⚠️  WARNING: Using default JWT_SECRET in production! Set JWT_SECRET environment variable.');
    }
  }
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_, key: string) {
    return getEnv()[key as keyof Env];
  },
});
