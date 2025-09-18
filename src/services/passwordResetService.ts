/**
 * Enterprise-grade password reset service.
 * Handles secure password reset flow with comprehensive validation and error handling.
 */

import { supabase } from '../lib/supabase';
import { logger } from './logger';
import type { AuthError, AuthApiError } from '@supabase/supabase-js';

export interface PasswordResetTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: 'bearer';
  readonly type: 'recovery';
}

export interface PasswordResetForm {
  readonly password: string;
  readonly confirmPassword: string;
}

/**
 * Rate limiter for password reset attempts.
 */
class PasswordResetRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly maxAttempts = 3;
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
 * Validates password strength according to enterprise security requirements.
 */
const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain more than 2 consecutive identical characters');
  }

  if (/123|abc|qwe|password|admin|user|test/i.test(password)) {
    errors.push('Password cannot contain common patterns or dictionary words');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates password reset form data.
 */
const validatePasswordResetForm = (formData: PasswordResetForm): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!formData.password) {
    errors.password = 'Password is required';
  } else {
    const strengthValidation = validatePasswordStrength(formData.password);
    if (!strengthValidation.isValid) {
      errors.password = strengthValidation.errors[0] || 'Password does not meet security requirements';
    }
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Password confirmation is required';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Checks if current URL indicates recovery mode from Supabase.
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
 * Extracts password reset tokens from URL.
 */
export const extractResetTokens = (): PasswordResetTokens | null => {
  try {
    const rawParams: Record<string, string> = {};
    
    // Check URL hash first (most common for Supabase)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      if (hashParams.get('access_token')) {
        rawParams.access_token = hashParams.get('access_token')!;
        rawParams.refresh_token = hashParams.get('refresh_token') || hashParams.get('access_token')!;
        rawParams.expires_in = hashParams.get('expires_in') || '3600';
        rawParams.token_type = hashParams.get('token_type') || 'bearer';
        rawParams.type = hashParams.get('type') || 'recovery';
      }
    }
    
    // Fallback: check search params
    if (!rawParams.access_token) {
      const searchParams = new URLSearchParams(window.location.search);
      
      if (searchParams.get('access_token')) {
        rawParams.access_token = searchParams.get('access_token')!;
        rawParams.refresh_token = searchParams.get('refresh_token') || searchParams.get('access_token')!;
        rawParams.expires_in = searchParams.get('expires_in') || '3600';
        rawParams.token_type = searchParams.get('token_type') || 'bearer';
        rawParams.type = searchParams.get('type') || 'recovery';
      }
    }
    
    if (!rawParams.access_token) {
      return null;
    }
    
    // Validate extracted tokens
    const expiresIn = parseInt(rawParams.expires_in, 10);
    if (isNaN(expiresIn) || expiresIn <= 0) {
      throw new Error('Invalid token expiration');
    }
    
    if (rawParams.token_type !== 'bearer') {
      throw new Error('Invalid token type');
    }
    
    if (rawParams.type !== 'recovery') {
      throw new Error('Invalid reset type');
    }
    
    return {
      accessToken: rawParams.access_token,
      refreshToken: rawParams.refresh_token,
      expiresIn,
      tokenType: 'bearer',
      type: 'recovery',
    };
    
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
export const establishRecoverySession = async (tokens: PasswordResetTokens): Promise<void> => {
  try {
    logger.info('Establishing recovery session', {
      context: { feature: 'password-reset', action: 'establishSession' },
    });
    
    const { error } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    if (error) {
      throw new Error(getSessionErrorMessage(error));
    }
    
    // Verify the session was set correctly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Failed to establish recovery session');
    }
    
    logger.info('Recovery session established successfully', {
      context: { feature: 'password-reset', action: 'sessionEstablished' },
    });
  } catch (err) {
    logger.error('Failed to establish recovery session', {
      context: { feature: 'password-reset', action: 'establishSession' },
      error: err instanceof Error ? err : new Error(String(err)),
    });
    throw err;
  }
};

/**
 * Updates user password with comprehensive validation.
 */
export const updateUserPassword = async (formData: PasswordResetForm, sessionId: string): Promise<void> => {
  // Rate limiting check
  if (!rateLimiter.canAttempt(sessionId)) {
    const remaining = rateLimiter.getRemainingAttempts(sessionId);
    throw new Error(
      `Too many password reset attempts. ${remaining} attempts remaining. Please try again in 15 minutes.`
    );
  }

  // Validate form data
  const validation = validatePasswordResetForm(formData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || 'Invalid password data');
  }

  try {
    // Record attempt for rate limiting
    rateLimiter.recordAttempt(sessionId);

    // Verify active recovery session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active recovery session found. Please request a new password reset link.');
    }

    logger.info('Updating password for authenticated user', {
      context: { feature: 'password-reset', action: 'updatePassword' },
    });
    
    // Update password via Supabase
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      throw new Error(getPasswordUpdateErrorMessage(error));
    }

    logger.info('Password updated successfully', {
      context: { feature: 'password-reset', action: 'passwordUpdateSuccess' },
    });
  } catch (err) {
    logger.error('Password update failed', {
      context: { feature: 'password-reset', action: 'updateOperation' },
      error: err instanceof Error ? err : new Error(String(err)),
    });
    throw err;
  }
};

/**
 * Completes the recovery flow after successful password reset.
 */
export const completeRecoveryFlow = async (): Promise<void> => {
  try {
    logger.info('Completing recovery flow', {
      context: { feature: 'password-reset', action: 'completeRecovery' },
    });

    // Clear URL fragments to prevent reuse
    window.history.replaceState({}, document.title, window.location.pathname);

    // Sign out for security (force fresh login with new password)
    await supabase.auth.signOut();
    
    // Redirect to home page
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
 * Generates a unique session identifier for rate limiting.
 */
export const generateSessionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return btoa(`${timestamp}-${random}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
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
 * Converts password update errors to user-friendly messages.
 */
const getPasswordUpdateErrorMessage = (error: AuthError | AuthApiError): string => {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('password should be at least')) {
    return 'Password must be at least 12 characters long for security.';
  }
  
  if (message.includes('auth session missing') || message.includes('session')) {
    return 'Your password reset session has expired. Please request a new reset link.';
  }
  
  if (message.includes('invalid recovery token') || message.includes('token')) {
    return 'This password reset link is invalid or has expired. Please request a new one.';
  }
  
  if (message.includes('expired')) {
    return 'Your password reset link has expired. Please request a new password reset.';
  }
  
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

export { validatePasswordStrength, validatePasswordResetForm };