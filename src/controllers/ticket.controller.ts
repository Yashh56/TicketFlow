import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/index.js';
import {
  AuthenticatedRequest,
  UserRole,
  TicketStatus,
  TicketPriority,
  TicketCategory
} from '../types/index.js';
import { eventBus } from '../events/index.js';

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param) : '';
};

/**
 * Create a new support ticket.
 * POST /api/tickets
 */
export const createTicket = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, description, category, priority } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority: priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      createdBy: userId
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email role')
      .lean();

    // Emit TICKET_CREATED event
    eventBus.emitTicketCreated({
      ticket: populatedTicket,
      performedBy: userId
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: populatedTicket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve tickets with search, filtering, sorting, and pagination.
 * Users get only their tickets; Admins can view all tickets.
 * GET /api/tickets
 */
export const getTickets = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    // Role-based visibility
    if (user.role !== UserRole.ADMIN) {
      filter.createdBy = user.userId;
    }

    // Filter by status
    if (req.query.status && Object.values(TicketStatus).includes(req.query.status as TicketStatus)) {
      filter.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority && Object.values(TicketPriority).includes(req.query.priority as TicketPriority)) {
      filter.priority = req.query.priority;
    }

    // Filter by category
    if (req.query.category && Object.values(TicketCategory).includes(req.query.category as TicketCategory)) {
      filter.category = req.query.category;
    }

    // Text search on title or description
    if (req.query.search && typeof req.query.search === 'string') {
      const searchTerm = req.query.search.trim();
      if (searchTerm) {
        filter.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }
    }

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter)
    ]);

    res.status(200).json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a single ticket by its ID.
 * GET /api/tickets/:id
 */
export const getTicketById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const id = getParamId(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }

    const ticket = await Ticket.findById(id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // RBAC: Non-admin users can only view their own ticket
    const creatorId =
      ticket.createdBy && typeof ticket.createdBy === 'object'
        ? (ticket.createdBy as any)._id?.toString()
        : ticket.createdBy?.toString();

    if (user?.role !== UserRole.ADMIN && creatorId !== user?.userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this ticket' });
      return;
    }

    res.status(200).json({ ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing ticket.
 * Users can update their own ticket (if not closed/resolved).
 * Admins can update any ticket, including status, priority, assignment.
 * PUT /api/tickets/:id
 */
export const updateTicket = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const id = getParamId(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const creatorId = ticket.createdBy.toString();
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isAdmin && creatorId !== user?.userId) {
      res.status(403).json({ error: 'Forbidden: You cannot modify this ticket' });
      return;
    }

    if (!isAdmin && (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED)) {
      res.status(400).json({
        error: `Cannot modify a ticket that is already ${ticket.status.toLowerCase()}`
      });
      return;
    }

    const { title, description, category, priority, status, assignedTo } = req.body;
    const previousStatus = ticket.status;
    const previousPriority = ticket.priority;

    if (title !== undefined) ticket.title = title;
    if (description !== undefined) ticket.description = description;
    if (category !== undefined) ticket.category = category;
    if (priority !== undefined) ticket.priority = priority;

    if (isAdmin) {
      if (status !== undefined) ticket.status = status;
      if (assignedTo !== undefined) {
        ticket.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null;
      }
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    // Trigger domain events
    eventBus.emitTicketUpdated({
      ticket: updatedTicket,
      performedBy: user?.userId || ''
    });

    if (status && status !== previousStatus) {
      eventBus.emitStatusChanged({
        ticket: updatedTicket,
        previousStatus,
        newStatus: status,
        performedBy: user?.userId || ''
      });

      if (status === TicketStatus.RESOLVED) {
        eventBus.emitTicketResolved({
          ticket: updatedTicket,
          performedBy: user?.userId || ''
        });
      }
    }

    if (priority && priority !== previousPriority) {
      eventBus.emitPriorityChanged({
        ticket: updatedTicket,
        previousPriority,
        newPriority: priority,
        performedBy: user?.userId || ''
      });
    }

    res.status(200).json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin update for status, priority, and assignment.
 * PATCH /api/tickets/:id/status
 */
export const adminUpdateTicketStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const { status, priority, assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const previousStatus = ticket.status;
    const previousPriority = ticket.priority;

    if (status !== undefined) ticket.status = status;
    if (priority !== undefined) ticket.priority = priority;
    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null;
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    // Trigger event handlers
    if (status && status !== previousStatus) {
      eventBus.emitStatusChanged({
        ticket: updatedTicket,
        previousStatus,
        newStatus: status,
        performedBy: req.user?.userId || ''
      });

      if (status === TicketStatus.RESOLVED) {
        eventBus.emitTicketResolved({
          ticket: updatedTicket,
          performedBy: req.user?.userId || ''
        });
      }
    }

    if (priority && priority !== previousPriority) {
      eventBus.emitPriorityChanged({
        ticket: updatedTicket,
        previousPriority,
        newPriority: priority,
        performedBy: req.user?.userId || ''
      });
    }

    res.status(200).json({
      message: 'Ticket status and priority updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a ticket.
 * User can delete their own ticket ONLY if it is still OPEN.
 * Admin can delete any ticket.
 * DELETE /api/tickets/:id
 */
export const deleteTicket = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const id = getParamId(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const creatorId = ticket.createdBy.toString();
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isAdmin && creatorId !== user?.userId) {
      res.status(403).json({ error: 'Forbidden: You cannot delete this ticket' });
      return;
    }

    if (!isAdmin && ticket.status !== TicketStatus.OPEN) {
      res.status(400).json({
        error: 'Cannot delete a ticket that is in progress or resolved. Please contact support.'
      });
      return;
    }

    await Ticket.findByIdAndDelete(id);

    // Emit TICKET_DELETED event
    eventBus.emitTicketDeleted({
      ticketId: id,
      performedBy: user?.userId || ''
    });

    res.status(200).json({
      message: 'Ticket deleted successfully',
      deletedTicketId: id
    });
  } catch (error) {
    next(error);
  }
};
