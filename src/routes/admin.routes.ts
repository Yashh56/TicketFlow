import { Router } from 'express';
import {
  getDashboardStats,
  getActivityLogs,
  getUserTickets
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/stats', getDashboardStats);
router.get('/activities', getActivityLogs);
router.get('/users/:userId/tickets', getUserTickets);

export { router as adminRoutes };
export default router;
