import React from 'react';
import { z } from 'zod';

import {
  booleanSchema,
  emailSchema,
  idSchema,
  isoDateTimeSchema,
  nonEmptyTextSchema,
  slugSchema,
} from '../common';

/**
 * Application user roles.
 */
export const userRoleSchema = z.enum(['admin', 'user']);

/**
 * Canonical authenticated user schema used across the application.
 */
export const userSchema = z
  .object({
    id: idSchema,
    email: emailSchema,
    name: nonEmptyTextSchema('User name', 120),
    role: userRoleSchema,
    createdAt: z.coerce.date({ invalid_type_error: 'createdAt must be a valid date.' }),
    updatedAt: z.coerce.date({ invalid_type_error: 'updatedAt must be a valid date.' }),
  })
  .strict();

/**
 * Serialization-friendly schema for pipeline steps displayed on marketing pages.
 */
export const pipelineStepSchema = z
  .object({
    id: slugSchema,
    title: nonEmptyTextSchema('Pipeline step title', 80),
    shortTitle: nonEmptyTextSchema('Pipeline short title', 40).optional(),
    description: nonEmptyTextSchema('Pipeline description', 400),
    icon: nonEmptyTextSchema('Pipeline icon', 80),
    status: z.enum(['pending', 'processing', 'completed', 'error']),
  })
  .strict();

/**
 * Factory for API response schemas. Ensures error arrays contain sanitized text.
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      data: dataSchema,
      success: booleanSchema,
      message: nonEmptyTextSchema('Response message', 500).optional(),
      errors: z
        .array(nonEmptyTextSchema('Error message', 500))
        .min(1, 'Provide at least one error message when errors are supplied.')
        .max(20, 'Limit error messages to 20 entries.')
        .optional(),
      timestamp: isoDateTimeSchema.optional(),
    })
    .strict();

/**
 * Route configuration schema for marketing routing tables.
 */
export const routeConfigSchema = z
  .object({
    path: nonEmptyTextSchema('Route path', 120),
    element: z.custom<React.ComponentType>(
      (value) => typeof value === 'function' || (typeof value === 'object' && value != null),
      'Element must be a valid React component.',
    ),
    title: nonEmptyTextSchema('Route title', 120),
    description: nonEmptyTextSchema('Route description', 320).optional(),
  })
  .strict();

/**
 * Lightweight auth state shared across feature modules.
 */
export const coreAuthStateSchema = z
  .object({
    user: userSchema.nullable(),
    isAuthenticated: booleanSchema,
    isLoading: booleanSchema,
  })
  .strict();

export type User = z.infer<typeof userSchema>;
export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type CoreAuthState = z.infer<typeof coreAuthStateSchema>;
