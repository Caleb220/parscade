import { ZodError, ZodIssue } from 'zod';

export const isZodError = (err: unknown): err is ZodError => !!err && typeof err === 'object' && 'issues' in (err as any);

const formatPath = (issue: ZodIssue): string => {
  if (!issue.path || issue.path.length === 0) return '';
  return String(issue.path.join('.'));
};

export const extractZodMessages = (error: ZodError, max = 5): string[] => {
  const messages: string[] = [];
  for (const issue of error.issues) {
    const path = formatPath(issue);
    const msg = path ? `${path}: ${issue.message}` : issue.message;
    if (!messages.includes(msg)) {
      messages.push(msg);
    }
    if (messages.length >= max) break;
  }
  return messages.length > 0 ? messages : [error.message];
};

export const toFieldErrors = (error: ZodError): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = formatPath(issue) || '_global';
    if (!map[key]) {
      map[key] = issue.message;
    }
  }
  return map;
};

const stripErrorNamePrefix = (message: string): string => {
  // Remove leading `ErrorName: ` prefixes to avoid exposing technical names
  const stripped = message.replace(/^[A-Za-z_][\w.\s]*:\s*/, '');
  return stripped.trim() || message;
};

export const formatErrorForUser = (
  err: unknown,
  fallback = 'Validation failed. Please review your input and try again.',
): string => {
  if (isZodError(err)) {
    const parts = extractZodMessages(err, 3);
    return parts.length === 1 ? parts[0] : `Please fix the following: ${parts.join('; ')}`;
  }
  if (err instanceof Error) {
    const cleaned = stripErrorNamePrefix(err.message);
    return cleaned || fallback;
  }
  return fallback;
};
