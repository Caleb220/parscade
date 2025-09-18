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
import type { AuthError, AuthApiError } from '@supabase/supabase-js';

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
  // Handle both new and legacy URL formats from Supabase
  const rawParams: any = {};
  
  console.log('🔍 All query parameters:', Object.fromEntries(queryParams.entries()));
  
  // Check for direct access_token first (after successful Supabase redirect)
  if (queryParams.get('access_token')) {
    console.log('📋 Using standard format (access_token found)');
    rawParams.access_token = queryParams.get('access_token');
    rawParams.refresh_token = queryParams.get('refresh_token');
    rawParams.expires_in = queryParams.get('expires_in');
    rawParams.token_type = queryParams.get('token_type');
    rawParams.type = queryParams.get('type');
  }
  // Check for token parameter (some Supabase configurations)
  else if (queryParams.get('token')) {
    console.log('📋 Using token parameter format');
    const token = queryParams.get('token');
    rawParams.access_token = token;
    rawParams.refresh_token = token;
    rawParams.expires_in = '3600';
    rawParams.token_type = 'bearer';
    rawParams.type = queryParams.get('type') || 'recovery';
  }
  // Legacy format (direct token hash)
  else {
    console.log('📋 Checking for legacy format...');
    const tokenHash = Array.from(queryParams.keys()).find(key => 
      key.length > 20 && !['type', 'redirect_to'].includes(key)
    );
    
    if (tokenHash) {
      console.log('📋 Using legacy format (token hash found)');
      rawParams.access_token = tokenHash;
      rawParams.refresh_token = tokenHash; // Use same token for both
      rawParams.expires_in = '3600';
      rawParams.token_type = 'bearer';
      rawParams.type = queryParams.get('type') || 'recovery';
    } else {
      console.log('❌ No valid token format found');
      console.log('🔍 Available keys:', Array.from(queryParams.keys()));
      console.log('🔍 Keys with length > 20:', Array.from(queryParams.keys()).filter(key => key.length > 20));
    }
  }

  console.log('🔍 Parsing query params:', Object.fromEntries(queryParams.entries()));
  console.log('🔍 Raw params for validation:', rawParams);

  const result = passwordResetQuerySchema.safeParse(rawParams);
  if (!result.success) {
    console.error('❌ Query validation failed:', result.error.issues);
    console.error('❌ Validation errors:', result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      received: issue.code === 'invalid_type' ? (issue as any).received : undefined
    })));
    logWarn('Password reset: invalid query parameters');
    return null;
  }

  console.log('✅ Query validation successful');
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
    console.log('🔄 Setting session with tokens...');
    console.log('🔍 Token info:', {
      access_token_length: tokens.access_token.length,
      refresh_token_length: tokens.refresh_token.length,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      type: tokens.type
    });
    
    const { error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (error) {
      console.error('❌ Supabase setSession error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        status: 'status' in error ? error.status : 'N/A'
      });
      
      throw new SupabaseServiceError(
        getSessionErrorMessage(error),
        error,
        'exchangeRecoverySession'
      );
    }
    
    console.log('✅ Session established successfully');
    
    // Verify the session was set correctly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Failed to verify session:', sessionError);
      throw new SupabaseServiceError(
        'Session was set but could not be verified',
        sessionError,
        'exchangeRecoverySession'
      );
    }
    
    if (!session) {
      console.error('❌ No session found after setting tokens');
      throw new Error('Failed to establish recovery session');
    }
    
    console.log('✅ Session verified successfully');
  } catch (err) {
    console.error('❌ Exchange recovery session failed:', err);
    logError('Password reset: failed to exchange recovery session');
    throw err instanceof SupabaseServiceError ? err : new Error('Session exchange failed');
  }
};

/**
 * Converts session establishment errors to user-friendly messages.
 */
const getSessionErrorMessage = (error: AuthError | AuthApiError): string => {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('invalid') && message.includes('token')) {
    return 'This password reset link is invalid. Please request a new one.';
  }
  
  if (message.includes('expired')) {
    return 'This password reset link has expired. Please request a new one.';
  }
  
  if (message.includes('malformed')) {
    return 'The password reset link is malformed. Please request a new one.';
  }
  
  if ('status' in error && error.status === 401) {
    return 'This password reset link is no longer valid. Please request a new one.';
  }
  
  return 'Failed to establish recovery session. Please request a new password reset link.';
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
 * @param error - Supabase AuthError or AuthApiError
 * @returns User-friendly error message
 */
const getPasswordUpdateErrorMessage = (error: AuthError | AuthApiError): string => {
  const message = error.message?.toLowerCase() || '';
  
  // Handle specific error patterns
  if (message.includes('password should be at least')) {
    return 'Password must be at least 12 characters long for security.';
  }
  
  if (message.includes('auth session missing') || message.includes('session')) {
    return 'Your password reset link has expired. Please request a new one.';
  }
  
  if (message.includes('invalid recovery token') || message.includes('token')) {
    return 'This password reset link is invalid or has expired. Please request a new one.';
  }
  
  if (message.includes('expired')) {
    return 'Your password reset link has expired. Please request a new password reset.';
  }
  
  // Handle HTTP status codes if available
  if ('status' in error && error.status) {
    switch (error.status) {
      case 401:
        return 'Your password reset session has expired. Please request a new reset link.';
      case 422:
        return 'Password does not meet security requirements. Please choose a stronger password.';
      case 429:
        return 'Too many password reset attempts. Please wait before trying again.';
      default:
        break;
    }
  }
  
  // Legacy message handling for backward compatibility
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