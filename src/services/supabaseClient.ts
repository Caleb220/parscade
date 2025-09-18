/**
 * Supabase client utilities and error handling.
 * Provides type-safe wrappers for Supabase operations.
 */

import type { PostgrestError, PostgrestSingleResponse, PostgrestMaybeSingleResponse } from '@supabase/supabase-js';

/**
 * Custom error class for Supabase service errors.
 * Provides structured error handling with additional context.
 */
export class SupabaseServiceError extends Error {
  constructor(
    message: string,
    public readonly causeError: PostgrestError | Error,
    public readonly operation: string
  ) {
    super(message);
    this.name = 'SupabaseServiceError';
  }
}

/**
 * Ensures a single record response and handles errors properly.
 * Throws SupabaseServiceError if the response contains an error.
 * 
 * @param response - The Supabase response object
 * @param operation - Description of the operation for error context
 * @returns The data from the response
 * @throws {SupabaseServiceError} If response contains an error
 */
export function ensureSingle<T>(
  response: PostgrestSingleResponse<T>,
  operation: string
): T {
  if (response.error) {
    throw new SupabaseServiceError(
      `${operation} failed: ${response.error.message}`,
      response.error,
      operation
    );
  }
  return response.data;
}

/**
 * Ensures a maybe single record response and handles errors properly.
 * Returns null if no record is found, throws on error.
 * 
 * @param response - The Supabase response object
 * @param operation - Description of the operation for error context
 * @returns The data from the response or null
 * @throws {SupabaseServiceError} If response contains an error
 */
export function ensureMaybeSingle<T>(
  response: PostgrestMaybeSingleResponse<T>,
  operation: string
): T | null {
  if (response.error) {
    throw new SupabaseServiceError(
      `${operation} failed: ${response.error.message}`,
      response.error,
      operation
    );
  }
  return response.data;
}

/**
 * Removes undefined values from an object.
 * Useful for cleaning up data before sending to Supabase.
 * 
 * @param obj - Object to prune
 * @returns Object with undefined values removed
 */
export function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  
  return result;
}

/**
 * Type guard to check if an error is a SupabaseServiceError.
 * 
 * @param error - Error to check
 * @returns True if error is a SupabaseServiceError
 */
export function isSupabaseServiceError(error: unknown): error is SupabaseServiceError {
  return error instanceof SupabaseServiceError;
}

/**
 * Utility to safely extract error message from various error types.
 * 
 * @param error - Error object
 * @returns Human-readable error message
 */
export function extractErrorMessage(error: unknown): string {
  if (isSupabaseServiceError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}