/**
 * Enterprise-grade password reset service with security features.
 * Handles Supabase password reset flow with rate limiting and validation.
 */

import { supabase } from '../lib/supabase';
import {
  passwordResetFormSchema,
  passwordResetQuerySchema,
  type PasswordResetForm,
  type PasswordResetQuery,
} from '../schemas/auth/passwordReset';
import { extractErrorMessage, SupabaseServiceError } from './supabaseClient';
import { logWarn, logError } from '../utils/log';
import type { AuthError } from '@supabase/supabase-js';

/**
 * Rate limiter for password reset attempts.
 * Prevents abuse by limiting attempts per session.
 */
class PasswordResetRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  /**
   * Check if a session can make another reset attempt.
   * 
   * @param sessionId - Unique session identifier
   * @returns True if attempt is allowed
   */
  canAttempt(sessionId: string): boolean {
    const record = this.attempts.get(sessionId);
    if (!record) return true;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - record.lastAttempt.getTime();

    // Reset counter if window has passed
    if (timeSinceLastAttempt > this.windowMs) {
      this.attempts.delete(sessionId);
      return true;
    }

    return record.count < this.maxAttempts;
  }

  /**
   * Record a reset attempt for rate limiting.
   * 
   * @param sessionId - Unique session identifier
   */
  recordAttempt(sessionId: string): void {
    const now = new Date();
    const record = this.attempts.get(sessionId);

    if (record) {
      record.count += 1;
      record.lastAttempt = now;
    } else {
      this.attempts.set(sessionId, { count: 1, lastAttempt: now });
    }
  }

  /**
   * Get remaining attempts for a session.
   * 
   * @param sessionId - Unique session identifier
   * @returns Number of attempts remaining
   */
  getRemainingAttempts(sessionId: string): number {
    const record = this.attempts.get(sessionId);
    if (!record) return this.maxAttempts;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - record.lastAttempt.getTime();

    // Reset counter if window has passed
    if (timeSinceLastAttempt > this.windowMs) {
      this.attempts.delete(sessionId);
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - record.count);
  }
}

const rateLimiter = new PasswordResetRateLimiter();

/**
 * Validates password reset query parameters from URL.
 * 
 * @param queryParams - URL search parameters
 * @returns Validated query parameters or null if invalid
 */
export const validateResetQuery = (queryParams: URLSearchParams): PasswordResetQuery | null => {
  const rawParams = {
    access_token: queryParams.get('access_token'),
    refresh_token: queryParams.get('refresh_token'),
    expires_in: queryParams.get('expires_in'),
    token_type: queryParams.get('token_type'),
    type: queryParams.get('type'),
  };

  const result = passwordResetQuerySchema.safeParse(rawParams);
  if (!result.success) {
    logWarn('Password reset: invalid query parameters');
    return null;
  }

  return result.data;
};

/**
 * Exchanges recovery session for authenticated session.
 * This is required to update the user's password.
 * 
 * @param tokens - Recovery tokens from email link
 * @returns Success status
 */
export const exchangeRecoverySession = async (tokens: PasswordResetQuery): Promise<void> => {
  try {
    const { error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (error) {
      throw new SupabaseServiceError(
        'Failed to establish recovery session',
        error,
        'exchangeRecoverySession'
      );
    }
  } catch (err) {
    logError('Password reset: failed to exchange recovery session');
    throw err instanceof SupabaseServiceError ? err : new Error('Session exchange failed');
  }
};

/**
 * Updates user password with enterprise-grade validation and security.
 * 
 * @param formData - Validated password form data
 * @param sessionId - Unique session identifier for rate limiting
 * @returns Success status
 */
export const updateUserPassword = async (
  formData: PasswordResetForm,
  sessionId: string = 'default'
): Promise<void> => {
  // Rate limiting check
  if (!rateLimiter.canAttempt(sessionId)) {
    const remaining = rateLimiter.getRemainingAttempts(sessionId);
    throw new Error(
      `Too many password reset attempts. ${remaining} attempts remaining. Please try again in 15 minutes.`
    );
  }

  // Validate form data
  const validation = passwordResetFormSchema.safeParse(formData);
  if (!validation.success) {
    const errors = validation.error.issues.map(issue => issue.message).join('; ');
    throw new Error(`Invalid password: ${errors}`);
  }

  const { password } = validation.data;

  try {
    // Record attempt for rate limiting
    rateLimiter.recordAttempt(sessionId);

    // Update password via Supabase
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      logWarn('Password reset: failed to update password');
      throw new SupabaseServiceError(
        getPasswordUpdateErrorMessage(error),
        error,
        'updateUserPassword'
      );
    }

    logWarn('Password reset: password updated successfully');
  } catch (err) {
    logError('Password reset: update operation failed');
    
    if (err instanceof SupabaseServiceError) {
      throw err;
    }
    
    throw new Error(extractErrorMessage(err));
  }
};

/**
 * Converts Supabase password update errors to user-friendly messages.
 * 
 * @param error - Supabase AuthError
 * @returns User-friendly error message
 */
const getPasswordUpdateErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case 'Password should be at least 6 characters':
      return 'Password must be at least 12 characters long for security.';
    case 'Auth session missing!':
      return 'Your password reset link has expired. Please request a new one.';
    case 'Invalid recovery token':
      return 'This password reset link is invalid or has expired. Please request a new one.';
    case 'Token has expired':
      return 'Your password reset link has expired. Please request a new password reset.';
    default:
      return `Failed to update password: ${error.message}`;
  }
};

/**
 * Generates a unique session identifier for rate limiting.
 * Uses a combination of user agent and timestamp for uniqueness.
 * 
 * @returns Unique session identifier
 */
export const generateSessionId = (): string => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  return btoa(`${userAgent}-${timestamp}-${random}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};