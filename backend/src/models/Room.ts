import { Schema, model, Document } from 'mongoose';
import type { SupportedLanguage } from '@collabcode/shared';

interface IFile {
  id: string;
  name: string;
  content: string;
  language: SupportedLanguage;
  createdAt: Date;
  updatedAt: Date;
}

interface IParticipant {
  userId: string;
  username: string;
  color: string;
  joinedAt: Date;
  isHost: boolean;
}

export interface IRoom extends Document {
  roomCode: string;
  hostId: string;
  language: SupportedLanguage;
  files: IFile[];
  participants: IParticipant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, default: '' },
  language: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ParticipantSchema = new Schema<IParticipant>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  color: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  isHost: { type: Boolean, default: false },
});

const RoomSchema = new Schema<IRoom>(
  {
    roomCode: { type: String, required: true, unique: true, index: true },
    hostId: { type: String, required: true },
    language: { type: String, required: true, default: 'javascript' },
    files: [FileSchema],
    participants: [ParticipantSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Room = model<IRoom>('Room', RoomSchema);
