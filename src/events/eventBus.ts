import { EventEmitter } from 'events';
import { EventAction, TicketStatus, TicketPriority } from '../types/index.js';

export interface TicketEventData {
  ticket: any;
  performedBy: string;
  details?: Record<string, any>;
}

export interface StatusChangeEventData extends TicketEventData {
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
}

export interface PriorityChangeEventData extends TicketEventData {
  previousPriority: TicketPriority;
  newPriority: TicketPriority;
}

export interface CommentEventData {
  ticket: any;
  comment: any;
  performedBy: string;
  details?: Record<string, any>;
}

export interface DeleteEventData {
  ticketId: string;
  performedBy: string;
  details?: Record<string, any>;
}

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow ample listeners without warning
    this.setMaxListeners(20);
  }

  emitTicketCreated(data: TicketEventData): boolean {
    return this.emit(EventAction.TICKET_CREATED, data);
  }

  emitTicketUpdated(data: TicketEventData): boolean {
    return this.emit(EventAction.TICKET_UPDATED, data);
  }

  emitStatusChanged(data: StatusChangeEventData): boolean {
    return this.emit(EventAction.STATUS_CHANGED, data);
  }

  emitPriorityChanged(data: PriorityChangeEventData): boolean {
    return this.emit(EventAction.PRIORITY_CHANGED, data);
  }

  emitTicketResolved(data: TicketEventData): boolean {
    return this.emit(EventAction.TICKET_RESOLVED, data);
  }

  emitCommentAdded(data: CommentEventData): boolean {
    return this.emit(EventAction.COMMENT_ADDED, data);
  }

  emitTicketDeleted(data: DeleteEventData): boolean {
    return this.emit(EventAction.TICKET_DELETED, data);
  }
}

export const eventBus = new AppEventBus();
export default eventBus;
