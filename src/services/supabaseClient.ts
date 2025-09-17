import type { PostgrestError, PostgrestMaybeSingleResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export class SupabaseServiceError extends Error {
  public readonly causeError: PostgrestError;

  constructor(context: string, error: PostgrestError) {
    const message = error.message || 'Unexpected Supabase error';
    super(`${context}: ${message}`);
    this.name = 'SupabaseServiceError';
    this.causeError = error;
    if (error.details) {
      this.message += ` — ${error.details}`;
    }
    if (error.hint) {
      this.message += ` (hint: ${error.hint})`;
    }
  }
}

export const ensureSingle = <T>(
  response: PostgrestSingleResponse<T>,
  context: string,
): T => {
  if (response.error) {
    throw new SupabaseServiceError(context, response.error);
  }

  if (!response.data) {
    throw new Error(`${context}: request completed without data.`);
  }

  return response.data;
};

export const ensureMaybeSingle = <T>(
  response: PostgrestMaybeSingleResponse<T>,
  context: string,
): T | null => {
  if (response.error) {
    throw new SupabaseServiceError(context, response.error);
  }

  return response.data ?? null;
};

export const pruneUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => pruneUndefined(item)) as unknown as T;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .reduce((acc, [key, entryValue]) => {
        acc[key as keyof T] = pruneUndefined(entryValue) as T[keyof T];
        return acc;
      }, {} as Record<keyof T, T[keyof T]>) as T;
  }

  return value;
};
