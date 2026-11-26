import { Router } from 'express';
import { addComment, getCommentsByTicket } from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCommentSchema } from '../validators/comment.validator.js';

// MergeParams: true to access :id / :ticketId from parent routers
const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(createCommentSchema), addComment);
router.get('/', getCommentsByTicket);

export { router as commentRoutes };
export default router;
