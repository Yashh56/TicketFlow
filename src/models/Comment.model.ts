import mongoose, { Schema, Document, Model } from 'mongoose';
import { IComment } from '../types/index.js';

export interface ICommentDocument extends Omit<IComment, '_id'>, Document {}

const CommentSchema = new Schema<ICommentDocument>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const Comment: Model<ICommentDocument> =
  (mongoose.models.Comment as Model<ICommentDocument>) ||
  mongoose.model<ICommentDocument>('Comment', CommentSchema);

export default Comment;
