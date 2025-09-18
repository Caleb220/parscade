import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
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
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_INITIALIZED' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
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
    case 'SET_INITIALIZED':
      return { ...state, isLoading: false };
    default:
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
  const initializationRef = useRef(false);
  const authStateChangeRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Memoized auth state change handler to prevent recreation on every render
  const handleAuthStateChange = useCallback(
    async (event: string, session: any): Promise<void> => {
      // Prevent processing during initial load to avoid double-processing
      if (!initializationRef.current) {
        return;
      }

      logger.debug('Auth state change event', {
        context: { feature: 'auth', action: 'stateChange' },
        metadata: { event, hasSession: !!session },
      });

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

        // Set user context for logging
        logger.setUserContext({
          id: typedUser.id,
          email: typedUser.email || undefined,
          username: typedUser.user_metadata?.full_name || undefined,
        });
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'AUTH_SIGNOUT' });
        logger.clearUserContext();
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
    },
    []
  );

  // Initialize auth state once on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        logger.debug('Initializing auth state');
        
        const { data: { session }, error } = await supabase.auth.getSession();

        // Check if component is still mounted
        if (!isMounted) return;

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

          // Set user context for logging
          logger.setUserContext({
            id: typedUser.id,
            email: typedUser.email || undefined,
            username: typedUser.user_metadata?.full_name || undefined,
          });
        } else {
          dispatch({ type: 'SET_INITIALIZED' });
        }

        // Mark initialization as complete
        initializationRef.current = true;

        // Set up auth state change listener after initialization
        if (isMounted) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
          authStateChangeRef.current = subscription;
        }
      } catch (initError) {
        if (!isMounted) return;
        
        logger.error('Critical error in auth initialization', {
          context: { feature: 'auth', action: 'initialization' },
          error: initError instanceof Error ? initError : new Error(String(initError)),
        });
        const errorMessage = initError instanceof Error ? initError.message : 'Failed to initialize authentication';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      if (authStateChangeRef.current) {
        authStateChangeRef.current.unsubscribe();
        authStateChangeRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

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

      // Success state will be handled by auth state change listener
      // No need to dispatch here to avoid double state updates
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

      // Success state will be handled by auth state change listener
      // No need to dispatch here to avoid double state updates
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
    
    try {
      // Update UI immediately for smooth user experience
      dispatch({ type: 'AUTH_SIGNOUT' });
      
      // Clear user context immediately
      logger.clearUserContext();
      
      // Sign out from Supabase (this will trigger auth state change)
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn('Supabase signout warning', {
          context: { feature: 'auth', action: 'supabaseSignOut' },
          error,
        });
      }
      
      // Clear auth-related localStorage items
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
      
      // Use current origin for redirects to avoid domain mismatches
      const redirectUrl = `${window.location.origin}/reset-password`;
      
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

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
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
 */
const getPasswordResetErrorMessage = (error: AuthError | AuthApiError): string => {
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

  return `Email service error: ${error.message || 'Please check your Supabase configuration or contact support.'}`;
};

/**
 * Converts Supabase auth errors to user-friendly messages.
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
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};