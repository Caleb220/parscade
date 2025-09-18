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
import { logger } from './logger';
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
 * Check if current URL indicates recovery mode from Supabase.
 */
export const isRecoveryMode = (): boolean => {
  try {
    // Check URL hash for type=recovery
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('type') === 'recovery') {
        return true;
      }
    }
    
    // Check search params as fallback
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('type') === 'recovery';
  } catch (error) {
    logger.warn('Error checking recovery mode', {
      context: { feature: 'password-reset', action: 'checkRecoveryMode' },
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return false;
  }
};

/**
 * Extracts password reset tokens from URL (hash or search params).
 * Returns null if no valid tokens are found.
 */
export const extractResetTokens = (): PasswordResetQuery | null => {
  try {
    logger.debug('Extracting reset tokens from URL', {
      metadata: { currentUrl: window.location.href },
    });
    
    const rawParams: any = {};
    
    // First, check URL hash (most common for Supabase)
    if (window.location.hash) {
      logger.debug('Found URL hash with potential tokens');
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      if (hashParams.get('access_token')) {
        logger.debug('Found tokens in URL hash');
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
        logger.debug('Found tokens in search params');
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
        logger.debug('Found legacy token format');
        rawParams.access_token = tokenHash;
        rawParams.refresh_token = tokenHash;
        rawParams.expires_in = '3600';
        rawParams.token_type = 'bearer';
        rawParams.type = searchParams.get('type') || 'recovery';
      }
    }
    
    if (!rawParams.access_token) {
      logger.debug('No reset tokens found in URL');
      return null;
    }
    
    // Validate the extracted tokens
    const result = passwordResetQuerySchema.safeParse(rawParams);
    if (!result.success) {
      logger.warn('Token validation failed', {
        context: { feature: 'password-reset', action: 'tokenValidation' },
        metadata: { issues: result.error.issues },
      });
      return null;
    }
    
    logger.info('Reset tokens extracted and validated successfully', {
      context: { feature: 'password-reset', action: 'tokenExtraction' },
    });
    return result.data;
    
  } catch (error) {
    logger.error('Error extracting reset tokens', {
      context: { feature: 'password-reset', action: 'tokenExtraction' },
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
};

/**
 * Establishes a recovery session using validated tokens.
 */
export const establishRecoverySession = async (tokens: PasswordResetQuery): Promise<void> => {
  try {
    logger.info('Establishing recovery session', {
      context: { feature: 'password-reset', action: 'establishSession' },
      metadata: {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenType: tokens.token_type,
        type: tokens.type,
      },
    });
    
    const { error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (error) {
      logger.error('SetSession error', {
        context: { feature: 'password-reset', action: 'setSession' },
        error,
      });
      throw new SupabaseServiceError(
        getSessionErrorMessage(error),
        error,
        'establishRecoverySession'
      );
    }
    
    // Verify the session was set correctly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      logger.error('Session verification error', {
        context: { feature: 'password-reset', action: 'sessionVerification' },
        error: sessionError,
      });
      throw new SupabaseServiceError(
        'Session was set but could not be verified',
        sessionError,
        'establishRecoverySession'
      );
    }
    
    if (!session) {
      logger.error('No session after setSession call', {
        context: { feature: 'password-reset', action: 'sessionVerification' },
      });
      throw new Error('Failed to establish recovery session');
    }
    
    logger.info('Recovery session established successfully', {
      context: { feature: 'password-reset', action: 'sessionEstablished' },
      metadata: {
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: session.expires_at,
      },
    });
  } catch (err) {
    logger.error('Failed to establish recovery session', {
      context: { feature: 'password-reset', action: 'establishSession' },
      error: err instanceof Error ? err : new Error(String(err)),
    });
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

    logger.info('Updating password for authenticated user', {
      context: { feature: 'password-reset', action: 'updatePassword' },
    });
    
    // Update password via Supabase
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      logger.warn('Failed to update password', {
        context: { feature: 'password-reset', action: 'passwordUpdate' },
        error,
      });
      throw new SupabaseServiceError(
        getPasswordUpdateErrorMessage(error),
        error,
        'updateUserPassword'
      );
    }

    logger.info('Password updated successfully', {
      context: { feature: 'password-reset', action: 'passwordUpdateSuccess' },
    });
  } catch (err) {
    logger.error('Password reset update operation failed', {
      context: { feature: 'password-reset', action: 'updateOperation' },
      error: err instanceof Error ? err : new Error(String(err)),
    });
    
    if (err instanceof SupabaseServiceError) {
      throw err;
    }
    
    throw new Error(extractErrorMessage(err));
  }
};

/**
 * Completes the recovery flow after successful password reset.
 * Redirects user appropriately based on security preferences.
 */
export const completeRecoveryFlow = async (redirectToLogin = false): Promise<void> => {
  try {
    logger.info('Completing recovery flow', {
      context: { feature: 'password-reset', action: 'completeRecovery' },
      metadata: { redirectToLogin },
    });

    // Clear URL fragments to prevent reuse
    window.history.replaceState({}, document.title, window.location.pathname);

    // Always sign out and redirect to home for fresh login with new password
    await secureSignOut();
    
    // Small delay to ensure signout completes
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  } catch (error) {
    logger.error('Error completing recovery flow', {
      context: { feature: 'password-reset', action: 'completeRecovery' },
      error: error instanceof Error ? error : new Error(String(error)),
    });
    
    // Fallback: go to home page
    window.location.href = '/';
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
    logger.debug('Signing out existing session for security');
    await supabase.auth.signOut();
    logger.debug('Secure signout completed');
  } catch (error) {
    logger.warn('Signout warning (non-critical)', {
      context: { feature: 'password-reset', action: 'secureSignOut' },
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};