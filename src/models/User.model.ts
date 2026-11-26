import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser, UserRole } from '../types/index.js';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    }
  },
  {
    timestamps: true
  }
);

export const User: Model<IUserDocument> =
  (mongoose.models.User as Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', UserSchema);

export default User;
