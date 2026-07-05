import { Schema, model, Document } from 'mongoose';

export interface IVersion extends Document {
  roomId: string;
  fileId: string;
  content: string;
  savedAt: Date;
  savedBy: string;
  label?: string;
}

const VersionSchema = new Schema<IVersion>({
  roomId: { type: String, required: true, index: true },
  fileId: { type: String, required: true },
  content: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: String, required: true },
  label: { type: String },
});

VersionSchema.index({ roomId: 1, fileId: 1, savedAt: -1 });

export const Version = model<IVersion>('Version', VersionSchema);
