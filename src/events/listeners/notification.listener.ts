import {
  eventBus,
  TicketEventData,
  StatusChangeEventData,
  CommentEventData
} from '../eventBus.js';
import { Notification, User } from '../../models/index.js';
import { EventAction, UserRole } from '../../types/index.js';

export const registerNotificationListeners = (): void => {
  // When a ticket is created, notify admins
  eventBus.on(EventAction.TICKET_CREATED, async (data: TicketEventData) => {
    try {
      const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
      const notifications = admins.map((admin) => ({
        recipientId: admin._id,
        ticketId: data.ticket._id,
        title: 'New Support Ticket Raised',
        message: `Ticket "${data.ticket.title}" [${data.ticket.priority}] was raised in ${data.ticket.category}.`
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (err) {
      console.error('Failed to dispatch TICKET_CREATED notifications:', err);
    }
  });

  // When status changes, notify the ticket creator
  eventBus.on(EventAction.STATUS_CHANGED, async (data: StatusChangeEventData) => {
    try {
      const creatorId =
        data.ticket.createdBy?._id?.toString() || data.ticket.createdBy?.toString();

      // Avoid notifying creator if they changed it themselves
      if (creatorId && creatorId !== data.performedBy) {
        await Notification.create({
          recipientId: creatorId,
          ticketId: data.ticket._id,
          title: 'Ticket Status Updated',
          message: `Your ticket "${data.ticket.title}" status changed to ${data.ticket.status}.`
        });
      }
    } catch (err) {
      console.error('Failed to dispatch STATUS_CHANGED notification:', err);
    }
  });

  // When ticket is marked as resolved, notify the creator specifically
  eventBus.on(EventAction.TICKET_RESOLVED, async (data: TicketEventData) => {
    try {
      const creatorId =
        data.ticket.createdBy?._id?.toString() || data.ticket.createdBy?.toString();

      if (creatorId) {
        await Notification.create({
          recipientId: creatorId,
          ticketId: data.ticket._id,
          title: 'Support Ticket Resolved',
          message: `Great news! Your ticket "${data.ticket.title}" has been marked as resolved.`
        });
      }
    } catch (err) {
      console.error('Failed to dispatch TICKET_RESOLVED notification:', err);
    }
  });

  // When a comment is added, notify the other party
  eventBus.on(EventAction.COMMENT_ADDED, async (data: CommentEventData) => {
    try {
      const creatorId =
        data.ticket.createdBy?._id?.toString() || data.ticket.createdBy?.toString();

      if (data.performedBy === creatorId) {
        // Comment was added by the user -> notify assigned admin or all admins
        if (data.ticket.assignedTo) {
          const assigneeId =
            data.ticket.assignedTo?._id?.toString() || data.ticket.assignedTo?.toString();
          await Notification.create({
            recipientId: assigneeId,
            ticketId: data.ticket._id,
            title: 'New Comment on Ticket',
            message: `User commented on ticket "${data.ticket.title}".`
          });
        } else {
          const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
          const notifications = admins.map((admin) => ({
            recipientId: admin._id,
            ticketId: data.ticket._id,
            title: 'New Comment on Ticket',
            message: `User commented on ticket "${data.ticket.title}".`
          }));
          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
          }
        }
      } else {
        // Comment was added by an admin -> notify the user creator
        if (creatorId) {
          await Notification.create({
            recipientId: creatorId,
            ticketId: data.ticket._id,
            title: 'Support Replied to Your Ticket',
            message: `A support agent commented on your ticket "${data.ticket.title}".`
          });
        }
      }
    } catch (err) {
      console.error('Failed to dispatch COMMENT_ADDED notification:', err);
    }
  });
};
