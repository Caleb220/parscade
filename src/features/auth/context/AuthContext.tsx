import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { AuthState, AuthContextType, User } from '../types/authTypes';
import { supabase } from '../../../lib/supabase';
import type { AuthError, AuthApiError } from '@supabase/supabase-js';
import { logger } from '../../../services/logger';
import type { TypedSupabaseUser } from '../../../types/supabase';

const AuthContext = createContext<AuthContextType | null>(null);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { readonly user: User; readonly isEmailConfirmed: boolean } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_SIGNOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isEmailConfirmed: action.payload.isEmailConfirmed,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isEmailConfirmed: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_SIGNOUT':
      return {
        user: null,
        isAuthenticated: false,
        isEmailConfirmed: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      // Exhaustive check to ensure all action types are handled
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isEmailConfirmed: false,
  isLoading: true,
  error: null,
};

interface AuthProviderProps {
  readonly children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.warn('Failed to get initial auth session', {
            context: { feature: 'auth', action: 'getInitialSession' },
            error,
          });
          dispatch({ type: 'AUTH_ERROR', payload: error.message });
          return;
        }

        if (session?.user) {
          const typedUser = session.user as TypedSupabaseUser;
          const isEmailConfirmed = Boolean(session.user.email_confirmed_at);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: typedUser,
              isEmailConfirmed,
            },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (initError) {
        logger.error('Critical error in auth initialization', {
          context: { feature: 'auth', action: 'initialization' },
          error: initError instanceof Error ? initError : new Error(String(initError)),
        });
        const errorMessage = initError instanceof Error ? initError.message : 'Failed to initialize authentication';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      }
    };

    void getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session): Promise<void> => {
        if (event === 'SIGNED_IN' && session?.user) {
          const typedUser = session.user as TypedSupabaseUser;
          const isEmailConfirmed = Boolean(session.user.email_confirmed_at);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: typedUser,
              isEmailConfirmed,
            },
          });
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'AUTH_SIGNOUT' });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const typedUser = session.user as TypedSupabaseUser;
          const isEmailConfirmed = Boolean(session.user.email_confirmed_at);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: typedUser,
              isEmailConfirmed,
            },
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const typedUser = data.user as TypedSupabaseUser;
        const isEmailConfirmed = Boolean(data.user.email_confirmed_at);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: typedUser,
            isEmailConfirmed,
          },
        });
      }
      
      // Set user context in Sentry
      logger.setUserContext({
        id: typedUser.id,
        email: typedUser.email || undefined,
        username: typedUser.user_metadata?.full_name || undefined,
      });
    } catch (authError) {
      const message = authError instanceof AuthError
        ? getAuthErrorMessage(authError)
        : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw authError;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const typedUser = data.user as TypedSupabaseUser;
        const isEmailConfirmed = Boolean(data.user.email_confirmed_at);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: typedUser,
            isEmailConfirmed,
          },
        });
      }
      
      // Set user context in Sentry
      logger.setUserContext({
        id: typedUser.id,
        email: typedUser.email || undefined,
        username: typedUser.user_metadata?.full_name || undefined,
      });
    } catch (signUpError) {
      const message = signUpError instanceof AuthError
        ? getAuthErrorMessage(signUpError)
        : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw signUpError;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    logger.info('Starting user logout process', {
      context: { feature: 'auth', action: 'signOut' },
    });
    
    // Update UI immediately for smooth user experience
    dispatch({ type: 'AUTH_SIGNOUT' });
    logger.addBreadcrumb('UI updated for logout', 'auth');
    
    // Comprehensive session cleanup
    try {
      logger.debug('Signing out from Supabase');
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn('Supabase signout warning', {
          context: { feature: 'auth', action: 'supabaseSignOut' },
          error,
        });
      } else {
        logger.debug('Supabase signout completed successfully');
      }
      
      // Clear all local storage items related to auth
      logger.debug('Clearing auth-related localStorage items');
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('token') ||
        key.includes('session')
      );
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (storageError) {
          logger.warn('Could not clear localStorage item', {
            context: { feature: 'auth', action: 'clearStorage' },
            metadata: { key },
            error: storageError instanceof Error ? storageError : new Error(String(storageError)),
          });
        }
      });
      
      logger.debug(`Cleared ${keysToRemove.length} localStorage items`);
      
      // Clear user context from Sentry
      logger.clearUserContext();
      
    } catch (signOutError) {
      logger.warn('Background signout error occurred', {
        context: { feature: 'auth', action: 'backgroundSignout' },
        error: signOutError instanceof Error ? signOutError : new Error(String(signOutError)),
      });
    }
    
    logger.info('User logout process completed', {
      context: { feature: 'auth', action: 'signOutComplete' },
    });
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      logger.info('Attempting password reset', {
        context: { 
          feature: 'auth', 
          action: 'resetPassword',
          userEmail: email.toLowerCase(),
        },
        metadata: {
          currentOrigin: window.location.origin,
          hostname: window.location.hostname,
        },
      });
      
      // Use parscade.com as the primary domain for redirects
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/reset-password`
        : 'https://parscade.com/reset-password';
      
      logger.debug(`Using redirect URL: ${redirectUrl}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        logger.error('Supabase reset password error', {
          context: { 
            feature: 'auth', 
            action: 'resetPasswordAPI',
            userEmail: email.toLowerCase(),
          },
          error,
          metadata: {
            errorName: error.name,
            status: 'status' in error ? error.status : 'N/A',
            code: 'code' in error ? error.code : 'N/A',
          },
        });
        
        // Add specific context for 500 errors
        if ('status' in error && error.status === 500) {
          logger.error('500 ERROR - Supabase email configuration issue', {
            context: { feature: 'auth', action: 'resetPasswordConfig' },
            metadata: {
              troubleshooting: [
                'Check Supabase email template uses {{ .ConfirmationURL }}',
                'Verify SMTP configuration in Supabase',
                'Ensure Site URL matches domain exactly',
              ],
            },
          });
        }
        
        throw new Error(getPasswordResetErrorMessage(error));
      }
      
      logger.info('Password reset email request completed successfully', {
        context: { 
          feature: 'auth', 
          action: 'resetPasswordSuccess',
          userEmail: email.toLowerCase(),
        },
      });
    } catch (resetError) {
      logger.error('Reset password function error', {
        context: { feature: 'auth', action: 'resetPasswordError' },
        error: resetError instanceof Error ? resetError : new Error(String(resetError)),
      });
      
      const message = resetError instanceof Error 
        ? resetError.message 
        : 'Failed to send reset email. Please try again.';
      throw new Error(message);
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        throw error;
      }
    } catch (resendError) {
      const message = resendError instanceof AuthError
        ? getAuthErrorMessage(resendError)
        : 'Failed to resend confirmation email';
      throw new Error(message);
    }
  }, []);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = useMemo<AuthContextType>(() => ({
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    clearError,
  }), [state, signIn, signUp, signOut, resetPassword, resendConfirmationEmail, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Converts Supabase password reset errors to user-friendly messages.
 * 
 * @param error - The AuthError from Supabase
 * @returns User-friendly error message
 */
const getPasswordResetErrorMessage = (error: AuthError | AuthApiError): string => {
  logger.debug('Analyzing password reset error', {
    metadata: { 
      name: error.name, 
      message: error.message,
      status: 'status' in error ? error.status : 'N/A',
    },
  });
  
  // Handle different error types
  if ('status' in error && error.status) {
    switch (error.status) {
      case 500:
        return 'Email service configuration error. Please check your Supabase email settings or contact support.';
      case 429:
        return 'Too many password reset requests. Please wait a few minutes before trying again.';
      case 422:
        return 'Invalid email address format. Please check and try again.';
      case 400:
        return 'Unable to send password reset email. Please verify your email address.';
      case 404:
        return 'Email service not configured. Please contact support.';
      default:
        break;
    }
  }

  // Handle specific error messages
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('internal server error') || message.includes('500')) {
    return 'Email service is currently unavailable. Please check your Supabase configuration or try again later.';
  }
  
  if (message.includes('smtp') || message.includes('email service')) {
    return 'Email service configuration error. Please check your Supabase SMTP settings.';
  }
  
  if (message.includes('rate limit')) {
    return 'Too many password reset requests. Please wait 5 minutes before trying again.';
  }
  
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address first, then try resetting your password.';
  }
  
  if (message.includes('user not found')) {
    return 'If an account with this email exists, you will receive a password reset link.';
  }
  
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  

  // Generic fallback
  return `Email service error: ${error.message || 'Please check your Supabase configuration or contact support.'}`;
};

/**
 * Converts Supabase auth errors to user-friendly messages.
 * Provides consistent error messaging across the application.
 * 
 * @param error - The AuthError from Supabase
 * @returns User-friendly error message
 */
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link before signing in.';
    case 'User already registered':
      return 'An account with this email already exists. Try signing in instead.';
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters long.';
    case 'Signup is disabled':
      return 'New account registration is currently disabled. Please contact support.';
    case 'Email rate limit exceeded':
      return 'Too many requests. Please wait a moment before trying again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Custom hook to access the auth context.
 * Throws an error if used outside of AuthProvider.
 * 
 * @returns The auth context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
