import { z } from 'zod';

import {
  idSchema,
  nonEmptyTextSchema,
  optionalEmailSchema,
} from './common';

/**
 * Supported analytics property value types.
 */
const analyticsPropertyValueSchema: z.ZodType<unknown> = z.union([
  z.string().trim(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.unknown()),
  z.record(z.unknown()),
]);

/**
 * Optional analytics property bag limited to 50 entries to avoid payload bloat.
 */
const analyticsPropertiesSchema = z
  .record(analyticsPropertyValueSchema)
  .superRefine((properties, ctx) => {
    if (Object.keys(properties).length > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Limit analytics properties to 50 fields to avoid payload bloat.',
      });
    }
  })
  .optional();

/**
 * Strict analytics event payload schema with optional contextual properties.
 */
export const analyticsEventSchema = z
  .object({
    name: nonEmptyTextSchema('Event name', 80),
    properties: analyticsPropertiesSchema,
  })
  .strict();

/**
 * Analytics user identification schema. Additional metadata keys are allowed
 * to preserve compatibility with analytics providers.
 */
export const analyticsUserSchema = z
  .object({
    id: idSchema,
    email: optionalEmailSchema,
    name: nonEmptyTextSchema('User name', 120).optional(),
  })
  .passthrough();

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsUser = z.infer<typeof analyticsUserSchema>;
