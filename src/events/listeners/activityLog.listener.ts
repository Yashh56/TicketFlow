import { eventBus, TicketEventData, StatusChangeEventData, PriorityChangeEventData, CommentEventData, DeleteEventData } from '../eventBus.js';
import { ActivityLog } from '../../models/index.js';
import { EventAction } from '../../types/index.js';

export const registerActivityLogListeners = (): void => {
  eventBus.on(EventAction.TICKET_CREATED, async (data: TicketEventData) => {
    try {
      await ActivityLog.create({
        ticketId: data.ticket._id,
        action: EventAction.TICKET_CREATED,
        performedBy: data.performedBy,
        details: {
          title: data.ticket.title,
          category: data.ticket.category,
          priority: data.ticket.priority,
          status: data.ticket.status,
          ...(data.details || {})
        }
      });
    } catch (err) {
      console.error('Failed to log TICKET_CREATED activity:', err);
    }
  });

  eventBus.on(EventAction.TICKET_UPDATED, async (data: TicketEventData) => {
    try {
      await ActivityLog.create({
        ticketId: data.ticket._id,
        action: EventAction.TICKET_UPDATED,
        performedBy: data.performedBy,
        details: data.details || {}
      });
    } catch (err) {
      console.error('Failed to log TICKET_UPDATED activity:', err);
    }
  });

  eventBus.on(EventAction.STATUS_CHANGED, async (data: StatusChangeEventData) => {
    try {
      await ActivityLog.create({
        ticketId: data.ticket._id,
        action: EventAction.STATUS_CHANGED,
        performedBy: data.performedBy,
        details: {
          previousStatus: data.previousStatus,
          newStatus: data.newStatus,
          ...(data.details || {})
        }
      });
    } catch (err) {
      console.error('Failed to log STATUS_CHANGED activity:', err);
    }
  });

  eventBus.on(EventAction.PRIORITY_CHANGED, async (data: PriorityChangeEventData) => {
    try {
      await ActivityLog.create({
        ticketId: data.ticket._id,
        action: EventAction.PRIORITY_CHANGED,
        performedBy: data.performedBy,
        details: {
          previousPriority: data.previousPriority,
          newPriority: data.newPriority,
          ...(data.details || {})
        }
      });
    } catch (err) {
      console.error('Failed to log PRIORITY_CHANGED activity:', err);
    }
  });

  eventBus.on(EventAction.TICKET_RESOLVED, async (data: TicketEventData) => {
    try {
      await ActivityLog.create({
        ticketId: data.ticket._id,
        action: EventAction.TICKET_RESOLVED,
        performedBy: data.performedBy,
        details: {
          resolvedAt: new Date(),
          ...(data.details || {})
        }
      });
    } catch (err) {
      console.error('Failed to log TICKET_RESOLVED activity:', err);
    }
  });

  eventBus.on(EventAction.COMMENT_ADDED, async (data: CommentEventData) => {
    try {
      await ActivityLog.create({
        ticketId: data.ticket._id,
        action: EventAction.COMMENT_ADDED,
        performedBy: data.performedBy,
        details: {
          commentId: data.comment._id,
          contentExcerpt: (data.comment.content || '').substring(0, 100),
          ...(data.details || {})
        }
      });
    } catch (err) {
      console.error('Failed to log COMMENT_ADDED activity:', err);
    }
  });

  eventBus.on(EventAction.TICKET_DELETED, async (data: DeleteEventData) => {
    try {
      await ActivityLog.create({
        ticketId: data.ticketId,
        action: EventAction.TICKET_DELETED,
        performedBy: data.performedBy,
        details: data.details || {}
      });
    } catch (err) {
      console.error('Failed to log TICKET_DELETED activity:', err);
    }
  });
};
