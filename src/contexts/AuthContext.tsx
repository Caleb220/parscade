import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, User } from '../types/auth';
import { supabase } from '../lib/supabase';
import { AuthError } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; isEmailConfirmed: boolean } }
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          dispatch({ type: 'AUTH_ERROR', payload: error.message });
          return;
        }

        if (session?.user) {
          const isEmailConfirmed = !!session.user.email_confirmed_at;
          dispatch({ 
            type: 'AUTH_SUCCESS', 
            payload: { 
              user: session.user as User, 
              isEmailConfirmed 
            } 
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to initialize authentication' });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const isEmailConfirmed = !!session.user.email_confirmed_at;
          dispatch({ 
            type: 'AUTH_SUCCESS', 
            payload: { 
              user: session.user as User, 
              isEmailConfirmed 
            } 
          });
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'AUTH_SIGNOUT' });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const isEmailConfirmed = !!session.user.email_confirmed_at;
          dispatch({ 
            type: 'AUTH_SUCCESS', 
            payload: { 
              user: session.user as User, 
              isEmailConfirmed 
            } 
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
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
        const isEmailConfirmed = !!data.user.email_confirmed_at;
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: data.user as User, 
            isEmailConfirmed 
          } 
        });
      }
    } catch (error) {
      const message = error instanceof AuthError 
        ? getAuthErrorMessage(error)
        : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
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
        const isEmailConfirmed = !!data.user.email_confirmed_at;
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: data.user as User, 
            isEmailConfirmed 
          } 
        });
      }
    } catch (error) {
      const message = error instanceof AuthError 
        ? getAuthErrorMessage(error)
        : 'An unexpected error occurred';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      dispatch({ type: 'AUTH_SIGNOUT' });
    } catch (error) {
      const message = error instanceof AuthError 
        ? getAuthErrorMessage(error)
        : 'Failed to sign out';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof AuthError 
        ? getAuthErrorMessage(error)
        : 'Failed to send reset email';
      throw new Error(message);
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof AuthError 
        ? getAuthErrorMessage(error)
        : 'Failed to resend confirmation email';
      throw new Error(message);
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Helper function to convert Supabase auth errors to user-friendly messages
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link before signing in.';
    case 'User already registered':
      return 'An account with this email already exists. Try signing in instead.';
    case 'Password should be at least 6 characters':
      return 'Password must be at least 12 characters long.';
    case 'Signup is disabled':
      return 'New account registration is currently disabled. Please contact support.';
    case 'Email rate limit exceeded':
      return 'Too many requests. Please wait a moment before trying again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};