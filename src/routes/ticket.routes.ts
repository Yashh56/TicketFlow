import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  adminUpdateTicketStatus,
  deleteTicket
} from '../controllers/ticket.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { UserRole } from '../types/index.js';
import {
  createTicketSchema,
  updateTicketSchema,
  adminUpdateTicketSchema
} from '../validators/ticket.validator.js';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// Create ticket & List tickets
router.post('/', validate(createTicketSchema), createTicket);
router.get('/', getTickets);

// Single ticket operations
router.get('/:id', getTicketById);
router.put('/:id', validate(updateTicketSchema), updateTicket);
router.delete('/:id', deleteTicket);

// Admin-only status & priority update
router.patch(
  '/:id/status',
  authorize(UserRole.ADMIN),
  validate(adminUpdateTicketSchema),
  adminUpdateTicketStatus
);

export { router as ticketRoutes };
export default router;
