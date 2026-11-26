import mongoose, { Schema, Document, Model } from 'mongoose';
import { INotification } from '../types/index.js';

export interface INotificationDocument extends Omit<INotification, '_id'>, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

export const Notification: Model<INotificationDocument> =
  (mongoose.models.Notification as Model<INotificationDocument>) ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default Notification;
