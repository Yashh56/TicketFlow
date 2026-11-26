import { z } from 'zod';
import { TicketCategory, TicketPriority, TicketStatus } from '../types/index.js';

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(200, { message: 'Title cannot exceed 200 characters' }),
  description: z
    .string()
    .min(5, { message: 'Description must be at least 5 characters long' }),
  category: z.nativeEnum(TicketCategory, { message: 'Invalid ticket category' }),
  priority: z.nativeEnum(TicketPriority, { message: 'Invalid ticket priority' }).optional()
});

export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(200, { message: 'Title cannot exceed 200 characters' })
    .optional(),
  description: z
    .string()
    .min(5, { message: 'Description must be at least 5 characters long' })
    .optional(),
  category: z.nativeEnum(TicketCategory, { message: 'Invalid ticket category' }).optional(),
  priority: z.nativeEnum(TicketPriority, { message: 'Invalid ticket priority' }).optional(),
  status: z.nativeEnum(TicketStatus, { message: 'Invalid ticket status' }).optional(),
  assignedTo: z.string().optional().nullable()
});

export const adminUpdateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus, { message: 'Invalid ticket status' }).optional(),
  priority: z.nativeEnum(TicketPriority, { message: 'Invalid ticket priority' }).optional(),
  assignedTo: z.string().optional().nullable()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AdminUpdateTicketInput = z.infer<typeof adminUpdateTicketSchema>;
