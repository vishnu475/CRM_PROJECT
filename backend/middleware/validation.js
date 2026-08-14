import { z } from 'zod';

export function validateSchema(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      next(err);
    }
  };
}

// Zod Validation Schemas
export const schemas = {
  login: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    pin: z.string().min(1, 'PIN is required')
  }),
  punchEvent: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    pin: z.string().min(1, 'PIN is required'),
    deviceId: z.string().optional(),
    source: z.string().optional()
  }),
  employeeCreate: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    department: z.string().min(1, 'Department is required'),
    designation: z.string().min(1, 'Designation is required')
  }),
  journalEntry: z.object({
    narration: z.string().min(1, 'Narration is required'),
    lines: z.array(z.object({
      accountId: z.string().min(1),
      debit: z.number().default(0),
      credit: z.number().default(0)
    })).min(2, 'At least 2 journal lines required')
  })
};
