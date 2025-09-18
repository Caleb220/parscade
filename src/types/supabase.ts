/**
 * Type definitions for Supabase integration.
 * Ensures type safety for all Supabase operations.
 */

import type { User as SupabaseUser, AuthError, Session } from '@supabase/supabase-js';

/**
 * Extended Supabase user type with application-specific metadata.
 * Ensures type safety for user metadata access.
 */
export interface TypedSupabaseUser extends SupabaseUser {
  readonly user_metadata: {
    readonly full_name?: string;
    readonly avatar_url?: string;
  } & Record<string, unknown>;
}

/**
 * Supabase auth session with typed user.
 * Provides type safety for session handling.
 */
export interface TypedSession extends Omit<Session, 'user'> {
  readonly user: TypedSupabaseUser;
}

/**
 * Standard Supabase response wrapper.
 * Ensures consistent error handling across all Supabase operations.
 */
export interface SupabaseResponse<T> {
  readonly data: T | null;
  readonly error: AuthError | null;
}

/**
 * Supabase query response with additional metadata.
 * Used for operations that return multiple records.
 */
export interface SupabaseQueryResponse<T> {
  readonly data: T[] | null;
  readonly error: AuthError | null;
  readonly count?: number | null;
}

/**
 * Type for Supabase RLS policy context.
 * Ensures proper typing for row-level security operations.
 */
export interface RLSContext {
  readonly userId: string;
  readonly role: 'authenticated' | 'anon';
}

/**
 * Generic database row type with common fields.
 * Provides base structure for all database entities.
 */
export interface BaseDBRow {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Type for Supabase real-time subscription payload.
 * Ensures type safety for real-time event handling.
 */
export interface RealtimePayload<T = Record<string, unknown>> {
  readonly schema: string;
  readonly table: string;
  readonly commit_timestamp: string;
  readonly eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  readonly new: T | null;
  readonly old: T | null;
}

/**
 * Type for Supabase storage file metadata.
 * Ensures type safety for file operations.
 */
export interface FileMetadata {
  readonly name: string;
  readonly id: string;
  readonly updated_at: string;
  readonly created_at: string;
  readonly last_accessed_at: string;
  readonly metadata: Record<string, unknown>;
}