import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/index.js';
import { AuthenticatedRequest } from '../types/index.js';

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param) : '';
};

/**
 * Get notifications for the authenticated user.
 * GET /api/notifications
 */
export const getMyNotifications = async (
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

    const notifications = await Notification.find({ recipientId: userId })
      .populate('ticketId', 'title status priority')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read.
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const id = getParamId(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    next(error);
  }
};
