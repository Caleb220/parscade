import { z } from 'zod';
import {
  nonEmptyTextSchema,
  booleanSchema,
} from '../common';

/**
 * Password reset form data schema with strict validation rules.
 * Ensures passwords meet enterprise security requirements.
 */
export const passwordResetFormSchema = z
  .object({
    password: nonEmptyTextSchema('New password', 128)
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
      .regex(/^(?!.*(.)\1{2,})/, 'Password cannot contain more than 2 consecutive identical characters')
      .refine(
        (password) => !/123|abc|qwe|password|admin|user|test|12345678/i.test(password),
        'Password cannot contain common patterns or dictionary words'
      ),
    confirmPassword: nonEmptyTextSchema('Confirm password', 128),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

/**
 * Password reset request state for managing the reset flow.
 */
export const passwordResetStateSchema = z
  .object({
    isLoading: booleanSchema,
    isComplete: booleanSchema,
    error: z.string().nullable(),
    attempts: z.number().min(0).max(5).default(0),
    lastAttempt: z.date().nullable().default(null),
  })
  .strict();

/**
 * URL query parameters for password reset flow.
 */
export const passwordResetQuerySchema = z
  .object({
    access_token: z.string().min(10, 'Access token is required'),
    refresh_token: z.string().min(10, 'Refresh token is required'),
    expires_in: z.coerce.number().positive(),
    token_type: z.literal('bearer'),
    type: z.enum(['recovery', 'signup']).default('recovery'),
  })
  .strict();

export type PasswordResetForm = z.infer<typeof passwordResetFormSchema>;
export type PasswordResetState = z.infer<typeof passwordResetStateSchema>;
export type PasswordResetQuery = z.infer<typeof passwordResetQuerySchema>;