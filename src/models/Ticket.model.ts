import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ITicket,
  TicketCategory,
  TicketPriority,
  TicketStatus
} from '../types/index.js';

export interface ITicketDocument extends Omit<ITicket, '_id'>, Document {}

const TicketSchema = new Schema<ITicketDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Ticket: Model<ITicketDocument> =
  (mongoose.models.Ticket as Model<ITicketDocument>) ||
  mongoose.model<ITicketDocument>('Ticket', TicketSchema);

export default Ticket;
