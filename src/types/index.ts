// Core application types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PipelineStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'parsing' | 'processing' | 'delivery' | 'analytics';
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  title: string;
  description?: string;
}