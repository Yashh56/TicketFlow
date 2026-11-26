import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware factory that validates req.body against a Zod schema.
 */
export const validate = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = result.error as any;
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors ?? error.issues
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

export default validate;
