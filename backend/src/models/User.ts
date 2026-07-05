import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  guestToken: string;
  color: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, maxlength: 32 },
    guestToken: { type: String, required: true, unique: true, index: true },
    color: { type: String, required: true, default: '#7C3AED' },
    avatar: { type: String },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
