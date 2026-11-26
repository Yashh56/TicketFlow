import type { Request } from 'express';
import type { Types } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TicketCategory {
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  GENERAL = 'GENERAL',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG = 'BUG'
}

export enum EventAction {
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_UPDATED = 'TICKET_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  TICKET_RESOLVED = 'TICKET_RESOLVED',
  TICKET_DELETED = 'TICKET_DELETED'
}

export interface IUser {
  _id?: Types.ObjectId | string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITicket {
  _id?: Types.ObjectId | string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: Types.ObjectId | IUser | string;
  assignedTo?: Types.ObjectId | IUser | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IComment {
  _id?: Types.ObjectId | string;
  ticketId: Types.ObjectId | ITicket | string;
  userId: Types.ObjectId | IUser | string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IActivityLog {
  _id?: Types.ObjectId | string;
  ticketId: Types.ObjectId | ITicket | string;
  action: EventAction;
  performedBy: Types.ObjectId | IUser | string;
  details?: Record<string, unknown> | any;
  createdAt?: Date;
}

export interface INotification {
  _id?: Types.ObjectId | string;
  recipientId: Types.ObjectId | IUser | string;
  ticketId: Types.ObjectId | ITicket | string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}
