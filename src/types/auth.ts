import { User as SupabaseUser } from '@supabase/supabase-js';

export type User = SupabaseUser & {
  user_metadata: SupabaseUser['user_metadata'] & {
    full_name?: string;
    avatar_url?: string;
  };
};

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isEmailConfirmed: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, captchaToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  clearError: () => void;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  general?: string;
}
