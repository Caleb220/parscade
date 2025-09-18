import { z } from 'zod';

import {
  booleanSchema,
  emailSchema,
  nonEmptyTextSchema,
  optionalEmailSchema,
  optionalHttpsUrlSchema,
  optionalTrimmedStringSchema,
  uuidSchema,
} from '../common';

/**
 * Auth provider metadata persisted with Supabase users.
 */
const authUserMetadataSchema = z
  .object({
    full_name: nonEmptyTextSchema('Full name', 120).optional(),
    avatar_url: optionalHttpsUrlSchema,
  })
  .catchall(z.unknown());

/**
 * Minimal Supabase user profile schema with runtime validation and passthrough
 * for provider-specific metadata that we do not explicitly model.
 */
export const authUserSchema = z
  .object({
    id: uuidSchema,
    email: optionalEmailSchema,
    user_metadata: authUserMetadataSchema,
  })
  .passthrough();

/**
 * Password strength metadata returned by the local validator.
 */
export const passwordStrengthSchema = z
  .object({
    score: z.number().int().min(0).max(5),
    feedback: z.array(nonEmptyTextSchema('Password feedback message', 120)).max(10),
    isValid: booleanSchema,
  })
  .strict();

/**
 * Form level validation errors surfaced in the auth experience.
 */
export const formErrorsSchema = z
  .object({
    email: optionalTrimmedStringSchema('Email error', 0, 200),
    password: optionalTrimmedStringSchema('Password error', 0, 200),
    fullName: optionalTrimmedStringSchema('Full name error', 0, 200),
    general: optionalTrimmedStringSchema('General error', 0, 200),
  })
  .strict();

/**
 * Runtime auth state consumed by the auth context provider.
 */
export const authStateSchema = z
  .object({
    user: authUserSchema.nullable(),
    isAuthenticated: booleanSchema,
    isEmailConfirmed: booleanSchema,
    isLoading: booleanSchema,
    error: optionalTrimmedStringSchema('Auth error message', 0, 300).nullable(),
  })
  .strict();

const asyncVoid = z.promise(z.void());

/** Auth sign-in function signature. */
const signInFunctionSchema = z.function({
  input: [emailSchema, nonEmptyTextSchema('Password', 128)],
  output: asyncVoid,
});

/** Auth sign-up function signature. */
const signUpFunctionSchema = z.function({
  input: [emailSchema, nonEmptyTextSchema('Password', 128), nonEmptyTextSchema('Full name', 120)],
  output: asyncVoid,
});

/** Auth sign-out function signature. */
const signOutFunctionSchema = z.function({
  input: [],
  output: asyncVoid,
});

/** Single email async function signature (reset/resend confirmation). */
const singleEmailAsyncFunctionSchema = z.function({
  input: [emailSchema],
  output: asyncVoid,
});

/** Clear error callback signature. */
const clearErrorFunctionSchema = z.function({
  input: [],
  output: z.void(),
});

/**
 * Complete auth context contract, including state and async handlers.
 */
export const authContextSchema = authStateSchema.extend({
  signIn: signInFunctionSchema,
  signUp: signUpFunctionSchema,
  signOut: signOutFunctionSchema,
  resetPassword: singleEmailAsyncFunctionSchema,
  resendConfirmationEmail: singleEmailAsyncFunctionSchema,
  clearError: clearErrorFunctionSchema,
});

export type AuthState = z.infer<typeof authStateSchema>;
export type AuthContextType = z.infer<typeof authContextSchema>;
export type PasswordStrength = z.infer<typeof passwordStrengthSchema>;
export type FormErrors = z.infer<typeof formErrorsSchema>;
export type User = z.infer<typeof authUserSchema>;
