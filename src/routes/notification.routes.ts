import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationAsRead
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationAsRead);

export { router as notificationRoutes };
export default router;
