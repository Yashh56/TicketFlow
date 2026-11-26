import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ticket, User, Comment, ActivityLog } from '../models/index.js';
import { AuthenticatedRequest, TicketStatus, TicketPriority, TicketCategory } from '../types/index.js';

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param) : '';
};

/**
 * Get dashboard analytics & statistics for administrators.
 * GET /api/admin/stats
 */
export const getDashboardStats = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalTickets,
      statusCounts,
      priorityCounts,
      categoryCounts,
      totalUsers,
      totalComments,
      recentTickets,
      recentActivities
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      User.countDocuments(),
      Comment.countDocuments(),
      Ticket.find()
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ActivityLog.find()
        .populate('performedBy', 'name email role')
        .populate('ticketId', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    // Format status counts with defaults for all enum values
    const byStatus = Object.values(TicketStatus).reduce((acc, status) => {
      const match = statusCounts.find((item) => item._id === status);
      acc[status] = match ? match.count : 0;
      return acc;
    }, {} as Record<string, number>);

    // Format priority counts
    const byPriority = Object.values(TicketPriority).reduce((acc, priority) => {
      const match = priorityCounts.find((item) => item._id === priority);
      acc[priority] = match ? match.count : 0;
      return acc;
    }, {} as Record<string, number>);

    // Format category counts
    const byCategory = Object.values(TicketCategory).reduce((acc, category) => {
      const match = categoryCounts.find((item) => item._id === category);
      acc[category] = match ? match.count : 0;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      overview: {
        totalTickets,
        totalUsers,
        totalComments,
        resolvedTickets: byStatus[TicketStatus.RESOLVED] || 0,
        openTickets: byStatus[TicketStatus.OPEN] || 0,
        inProgressTickets: byStatus[TicketStatus.IN_PROGRESS] || 0
      },
      distribution: {
        byStatus,
        byPriority,
        byCategory
      },
      recentTickets,
      recentActivities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated activity audit logs.
 * GET /api/admin/activities
 */
export const getActivityLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (req.query.action) {
      filter.action = req.query.action;
    }

    if (req.query.ticketId && mongoose.Types.ObjectId.isValid(req.query.ticketId as string)) {
      filter.ticketId = req.query.ticketId;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('performedBy', 'name email role')
        .populate('ticketId', 'title category status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);

    res.status(200).json({
      activities: logs,
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
 * Get all tickets for a specific user (admin inspection).
 * GET /api/admin/users/:userId/tickets
 */
export const getUserTickets = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getParamId(req.params.userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const tickets = await Ticket.find({ createdBy: userId })
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      user,
      totalTickets: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};
