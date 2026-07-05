import { Schema, model, Document } from 'mongoose';
import type { SupportedLanguage } from '@collabcode/shared';

export interface IExecutionLog extends Document {
  roomId: string;
  language: SupportedLanguage;
  code: string;
  output: string;
  error: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsageMb: number;
  createdAt: Date;
}

const ExecutionLogSchema = new Schema<IExecutionLog>({
  roomId: { type: String, required: true, index: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  output: { type: String, default: '' },
  error: { type: String, default: '' },
  exitCode: { type: Number, default: 0 },
  executionTimeMs: { type: Number, default: 0 },
  memoryUsageMb: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const ExecutionLog = model<IExecutionLog>('ExecutionLog', ExecutionLogSchema);
