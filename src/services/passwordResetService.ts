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

  canAttempt(sessionId: string): boolean {
    const record = this.attempts.get(sessionId);
    if (!record) return true;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - record.lastAttempt.getTime();

    if (timeSinceLastAttempt > this.windowMs) {
      this.attempts.delete(sessionId);
      return true;
    }

    return record.count < this.maxAttempts;
  }

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

  getRemainingAttempts(sessionId: string): number {
    const record = this.attempts.get(sessionId);
    if (!record) return this.maxAttempts;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - record.lastAttempt.getTime();

    if (timeSinceLastAttempt > this.windowMs) {
      this.attempts.delete(sessionId);
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - record.count);
  }
}

const rateLimiter = new PasswordResetRateLimiter();

/**
 * Extracts password reset tokens from URL (hash or search params).
 * Returns null if no valid tokens are found.
 */
export const extractResetTokens = (): PasswordResetQuery | null => {
  try {
    console.log('🔍 Extracting reset tokens from URL...');
    console.log('🔍 Current URL:', window.location.href);
    
    const rawParams: any = {};
    
    // First, check URL hash (most common for Supabase)
    if (window.location.hash) {
      console.log('🔍 Found URL hash:', window.location.hash);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      if (hashParams.get('access_token')) {
        console.log('✅ Found tokens in URL hash');
        rawParams.access_token = hashParams.get('access_token');
        rawParams.refresh_token = hashParams.get('refresh_token') || hashParams.get('access_token');
        rawParams.expires_in = hashParams.get('expires_in') || '3600';
        rawParams.token_type = hashParams.get('token_type') || 'bearer';
        rawParams.type = hashParams.get('type') || 'recovery';
      }
    }
    
    // Fallback: check search params
    if (!rawParams.access_token) {
      const searchParams = new URLSearchParams(window.location.search);
      
      if (searchParams.get('access_token')) {
        console.log('✅ Found tokens in search params');
        rawParams.access_token = searchParams.get('access_token');
        rawParams.refresh_token = searchParams.get('refresh_token');
        rawParams.expires_in = searchParams.get('expires_in');
        rawParams.token_type = searchParams.get('token_type');
        rawParams.type = searchParams.get('type');
      }
    }
    
    // Legacy format check
    if (!rawParams.access_token) {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenHash = Array.from(searchParams.keys()).find(key => 
        key.length > 20 && !['type', 'redirect_to'].includes(key)
      );
      
      if (tokenHash) {
        console.log('✅ Found legacy token format');
        rawParams.access_token = tokenHash;
        rawParams.refresh_token = tokenHash;
        rawParams.expires_in = '3600';
        rawParams.token_type = 'bearer';
        rawParams.type = searchParams.get('type') || 'recovery';
      }
    }
    
    if (!rawParams.access_token) {
      console.log('❌ No reset tokens found in URL');
      return null;
    }
    
    // Validate the extracted tokens
    const result = passwordResetQuerySchema.safeParse(rawParams);
    if (!result.success) {
      console.error('❌ Token validation failed:', result.error.issues);
      return null;
    }
    
    console.log('✅ Reset tokens extracted and validated successfully');
    return result.data;
    
  } catch (error) {
    console.error('❌ Error extracting reset tokens:', error);
    return null;
  }
};

/**
 * Establishes a recovery session using validated tokens.
 */
export const establishRecoverySession = async (tokens: PasswordResetQuery): Promise<void> => {
  try {
    console.log('🔄 Establishing recovery session...');
    
    const { error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (error) {
      throw new SupabaseServiceError(
        getSessionErrorMessage(error),
        error,
        'establishRecoverySession'
      );
    }
    
    // Verify the session was set correctly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new SupabaseServiceError(
        'Session was set but could not be verified',
        sessionError,
        'establishRecoverySession'
      );
    }
    
    if (!session) {
      throw new Error('Failed to establish recovery session');
    }
    
    console.log('✅ Recovery session established successfully');
  } catch (err) {
    console.error('❌ Failed to establish recovery session:', err);
    logError('Password reset: failed to establish recovery session');
    throw err instanceof SupabaseServiceError ? err : new Error('Session establishment failed');
  }
};

/**
 * Updates user password with enterprise-grade validation and security.
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

    // Check if user has an active recovery session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active recovery session found. Please request a new password reset link.');
    }

    console.log('🔄 Updating password for authenticated user');
    
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

    console.log('✅ Password updated successfully');
  } catch (err) {
    logError('Password reset: update operation failed');
    
    if (err instanceof SupabaseServiceError) {
      throw err;
    }
    
    throw new Error(extractErrorMessage(err));
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
 * Converts Supabase password update errors to user-friendly messages.
 */
const getPasswordUpdateErrorMessage = (error: AuthError | AuthApiError): string => {
  const message = error.message?.toLowerCase() || '';
  
  // Handle specific error patterns
  if (message.includes('password should be at least')) {
    return 'Password must be at least 8 characters long for security.';
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
  
  return `Failed to update password: ${error.message}`;
};

/**
 * Generates a unique session identifier for rate limiting.
 */
export const generateSessionId = (): string => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  return btoa(`${userAgent}-${timestamp}-${random}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

/**
 * Securely signs out any existing session.
 * Returns immediately for UX, handles errors gracefully.
 */
export const secureSignOut = async (): Promise<void> => {
  try {
    console.log('🔒 Signing out existing session for security...');
    await supabase.auth.signOut();
    console.log('✅ Secure signout completed');
  } catch (error) {
    console.warn('⚠️ Signout warning (non-critical):', error);
  }
};