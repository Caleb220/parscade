import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { AuthState, AuthContextType, User } from '../types/authTypes';
import { supabase } from '../../../lib/supabase';
import type { AuthError, AuthApiError } from '@supabase/supabase-js';
import { logWarn } from '../../../utils/log';
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
          logWarn('Auth: failed to get session');
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
        logWarn('Auth: error in getInitialSession');
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
    } catch (signUpError) {
      const message = signUpError instanceof AuthError
        ? getAuthErrorMessage(signUpError)
        : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw signUpError;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      dispatch({ type: 'AUTH_SIGNOUT' });
    } catch (signOutError) {
      const message = signOutError instanceof AuthError
        ? getAuthErrorMessage(signOutError)
        : 'Failed to sign out';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw signOutError;
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      console.log('🔄 Attempting password reset for:', email.toLowerCase());
      console.log('🔍 Environment check:', {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        redirectUrl: `https://parscade-o4i365.js.org/reset-password`,
        currentOrigin: window.location.origin
      });
      
      // Use the correct production URL for redirects
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/reset-password`
        : 'https://parscade-o4i365.js.org/reset-password';
      
      console.log('🔗 Using redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('❌ Supabase reset password error:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          status: 'status' in error ? error.status : 'N/A',
          code: 'code' in error ? error.code : 'N/A',
          details: 'details' in error ? error.details : 'N/A'
        });
        throw new Error(getPasswordResetErrorMessage(error));
      }
      
      console.log('✅ Password reset email request completed successfully');
    } catch (resetError) {
      console.error('❌ Reset password function error:', resetError);
      console.error('❌ Complete error object:', resetError);
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
  console.log('🔍 Analyzing error:', { 
    name: error.name, 
    message: error.message,
    status: 'status' in error ? error.status : 'N/A'
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
