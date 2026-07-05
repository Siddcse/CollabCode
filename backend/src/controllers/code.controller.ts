import type { Request, Response } from 'express';
import { z } from 'zod';
import { runCode, checkDockerHealth } from '../services/docker.service';
import { ExecutionLog } from '../models/ExecutionLog';

const runCodeSchema = z.object({
  roomId: z.string(),
  language: z.enum(['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust']),
  code: z.string().min(1).max(50000),
});

export async function handleRunCode(req: Request, res: Response): Promise<void> {
  const parsed = runCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
    return;
  }

  const healthy = await checkDockerHealth();
  if (!healthy) {
    res.status(503).json({
      success: false,
      error: 'Code execution service unavailable. Docker is not running.',
    });
    return;
  }

  const { roomId, language, code } = parsed.data;

  const result = await runCode(language, code);

  await ExecutionLog.create({ roomId, language, code, ...result });

  res.json({ success: true, data: result });
}
