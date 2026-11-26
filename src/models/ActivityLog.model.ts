import mongoose, { Schema, Document, Model } from 'mongoose';
import { IActivityLog, EventAction } from '../types/index.js';

export interface IActivityLogDocument extends Omit<IActivityLog, '_id'>, Document {}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: Object.values(EventAction),
      required: true
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
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

export const ActivityLog: Model<IActivityLogDocument> =
  (mongoose.models.ActivityLog as Model<IActivityLogDocument>) ||
  mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);

export default ActivityLog;
