import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: string;
  userId: string;
  username: string;
  color: string;
  content: string;
  type: 'text' | 'system';
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  roomId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  color: { type: String, required: true },
  content: { type: String, required: true, maxlength: 2000 },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  timestamp: { type: Date, default: Date.now },
});

MessageSchema.index({ roomId: 1, timestamp: -1 });

export const Message = model<IMessage>('Message', MessageSchema);
