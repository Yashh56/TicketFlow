import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Comment, Ticket } from '../models/index.js';
import { AuthenticatedRequest, UserRole, TicketStatus } from '../types/index.js';
import { eventBus } from '../events/index.js';

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param) : '';
};

/**
 * Add a comment to a ticket.
 * Users can comment on their own tickets.
 * Admins can comment on any ticket.
 * POST /api/tickets/:ticketId/comments
 */
export const addComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const ticketId = getParamId(req.params.ticketId || req.params.id);
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const creatorId = ticket.createdBy.toString();
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isAdmin && creatorId !== user?.userId) {
      res.status(403).json({ error: 'Forbidden: You cannot comment on this ticket' });
      return;
    }

    if (ticket.status === TicketStatus.CLOSED) {
      res.status(400).json({ error: 'Cannot comment on a closed ticket' });
      return;
    }

    const comment = await Comment.create({
      ticketId,
      userId: user?.userId,
      content
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email role')
      .lean();

    // Trigger event-driven workflow
    eventBus.emitCommentAdded({
      ticket,
      comment: populatedComment,
      performedBy: user?.userId || ''
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all comments associated with a ticket.
 * GET /api/tickets/:ticketId/comments
 */
export const getCommentsByTicket = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const ticketId = getParamId(req.params.ticketId || req.params.id);

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }

    const ticket = await Ticket.findById(ticketId).lean();
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const creatorId =
      ticket.createdBy && typeof ticket.createdBy === 'object'
        ? (ticket.createdBy as any)._id?.toString()
        : ticket.createdBy?.toString();

    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isAdmin && creatorId !== user?.userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this ticket' });
      return;
    }

    const comments = await Comment.find({ ticketId })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};
