import { z, type ZodTypeAny } from 'zod';

/**
 * Shared regular expressions applied across primitive schemas.
 */
const identifierRegex = /^[A-Za-z0-9_-]{3,64}$/;
const slugRegex = /^[A-Za-z0-9_-]+$/;
const keywordBlocklistPattern = /[,;]/;
const time24HourRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const dropTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, ' ');

const blankToUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const optionalize = <T extends ZodTypeAny>(
  schema: T,
  normalise: (value: unknown) => unknown = blankToUndefined,
) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      const normalised = normalise(value);
      return normalised === undefined ? undefined : normalised;
    }, z.union([schema, z.undefined()]))
    .transform((value) => (value === undefined ? undefined : (value as z.infer<T>)));

/**
 * Alphanumeric identifier allowing underscores and hyphens (3-64 chars).
 */
export const idSchema = z
  .string({ required_error: 'Identifier is required.' })
  .trim()
  .regex(identifierRegex, 'Identifier must be 3-64 characters (letters, numbers, underscore, hyphen).');

/**
 * URL-safe slug using letters, numbers, underscores, and hyphens.
 */
export const slugSchema = z
  .string({ required_error: 'Slug is required.' })
  .trim()
  .regex(slugRegex, 'Slug may only contain letters, numbers, underscores, and hyphens.');

/**
 * Standard UUID v4 string schema.
 */
export const uuidSchema = z
  .string({ required_error: 'UUID is required.' })
  .trim()
  .uuid('Value must be a valid UUID.');

/**
 * Email schema with lower-casing normalisation.
 */
export const emailSchema = z
  .string({ required_error: 'Email is required.' })
  .trim()
  .email('Enter a valid email address.')
  .transform((value) => value.toLowerCase());

/** Optional email where blank inputs resolve to undefined. */
export const optionalEmailSchema = optionalize(emailSchema);

/**
 * Human-friendly person name schema with whitespace trimming.
 */
export const personNameSchema = z
  .string({ required_error: 'Name is required.' })
  .trim()
  .min(2, 'Name must be at least 2 characters long.')
  .max(120, 'Name must be 120 characters or less.');

/**
 * International phone number schema with loose punctuation support.
 */
export const phoneSchema = z
  .string({ required_error: 'Phone number is required.' })
  .transform((value) => normalizeSpaces(value.trim()))

/** Optional phone string that normalises whitespace and blanks to undefined. */
export const optionalPhoneSchema = optionalize(phoneSchema, (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return normalizeSpaces(trimmed);
});

/**
 * Locale string schema (e.g., en-US, fr) with length constraints.
 */
export const localeSchema = z
  .string({ required_error: 'Locale is required.' })
  .trim()
  .min(2, 'Locale must be at least 2 characters.')
  .max(10, 'Locale must be 10 characters or less.');

/**
 * IANA timezone name schema with trimming and length safeguards.
 */
export const timezoneSchema = z
  .string({ required_error: 'Timezone is required.' })
  .trim()
  .min(3, 'Timezone must be at least 3 characters.')
  .max(80, 'Timezone must be 80 characters or less.');

/**
 * HTTPS URL schema that rejects insecure protocols and strips trailing slashes.
 */
export const httpsUrlSchema = z
  .string({ required_error: 'URL is required.' })
  .trim()
  .url('Provide a valid URL.')
  .refine((value) => {
    try {
      const u = new URL(value);
      if (u.protocol === 'https:') return true;
      const host = u.hostname.toLowerCase();
      // Allow HTTP for localhost-style development targets
      if (u.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local'))) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, 'URL must use HTTPS (HTTP allowed for localhost).')
  .max(2048, 'URL must be 2048 characters or less.')
  .transform(dropTrailingSlashes);

/** Optional HTTPS URL schema that tolerates blank strings. */
export const optionalHttpsUrlSchema = optionalize(httpsUrlSchema);

const imagePathSchema = z
  .string({ invalid_type_error: 'Image path must be a string.' })
  .trim()
  .refine((value) => {
    if (value.startsWith('/')) return true; // root-relative
    try {
      const u = new URL(value);
      if (u.protocol === 'https:') return true;
      const host = u.hostname.toLowerCase();
      if (u.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local'))) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, 'Image must be HTTPS, root-relative, or HTTP on localhost during development.')
  .max(2048, 'Image path must be 2048 characters or less.');

/** Optional HTTPS image URL or root-relative path schema. */
export const optionalImagePathSchema = optionalize(imagePathSchema);

/**
 * Single keyword schema that blocks punctuation used for list separators.
 */
export const keywordSchema = z
  .string({ required_error: 'Keyword is required.' })
  .trim()
  .min(2, 'Keyword must be at least 2 characters.')
  .max(60, 'Keyword must be at most 60 characters.')
  .refine((value) => !keywordBlocklistPattern.test(value), 'Keyword cannot contain commas or semicolons.');

/**
 * ISO-8601 datetime schema expecting timezone offset information.
 */
export const isoDateTimeSchema = z
  .string({ required_error: 'Date is required.' })
  .trim()
  .datetime({ offset: true, message: 'Provide an ISO-8601 timestamp with timezone.' });

/** Optional ISO datetime schema that tolerates blank values. */
export const optionalIsoDateTimeSchema = optionalize(isoDateTimeSchema);

/** Strict boolean schema for runtime validation. */
export const booleanSchema = z.boolean({ required_error: 'Value must be boolean.' });

/** Percentage schema constrained between 0 and 100 inclusive. */
export const percentageSchema = z
  .number({ required_error: 'Percentage is required.' })
  .min(0, 'Percentage must be at least 0.')
  .max(100, 'Percentage must be at most 100.');

/** Positive integer schema including zero. */
export const positiveIntegerSchema = z
  .number({ required_error: 'Value is required.' })
  .int('Value must be an integer.')
  .nonnegative('Value must be zero or greater.');

/**
 * Generic pagination params used for list queries.
 */
export const paginationParamsSchema = z
  .object({
    page: z
      .coerce
      .number({ invalid_type_error: 'Page must be a number.' })
      .int('Page must be an integer.')
      .min(1, 'Page must be at least 1.')
      .default(1),
    pageSize: z
      .coerce
      .number({ invalid_type_error: 'Page size must be a number.' })
      .int('Page size must be an integer.')
      .min(1, 'Page size must be at least 1.')
      .max(100, 'Page size must be at most 100.')
      .default(20),
  })
  .strict();

/**
 * 24-hour time string schema (HH:MM) used by quiet-hours and scheduling features.
 */
export const time24HourStringSchema = z
  .string({ required_error: 'Time is required.' })
  .trim()
  .regex(time24HourRegex, 'Time must be formatted HH:MM (24h).');

/** Optional 24-hour time schema that tolerates blank inputs. */
export const optionalTime24HourStringSchema = optionalize(time24HourStringSchema);

/**
 * Optional trimmed string enforcing minimum/maximum length when supplied.
 */
export const optionalStringSchema = (label: string, max = 255) =>
  optionalize(
    z
      .string({ invalid_type_error: `${label} must be a string.` })
      .trim()
      .min(1, `${label} is required.`)
      .max(max, `${label} must be at most ${max} characters.`),
  );

/** Optional trimmed string with configurable length constraints. */
export const optionalTrimmedStringSchema = (label: string, min = 0, max = 255) => {
  let schema = z
    .string({ invalid_type_error: `${label} must be a string.` })
    .trim()
    .max(max, `${label} must be at most ${max} characters.`);

  if (min > 0) {
    schema = schema.min(min, `${label} must be at least ${min} characters.`);
  }

  return optionalize(schema);
};

/** Non-empty text schema with maximum length safeguards. */
export const nonEmptyTextSchema = (label: string, max = 1000) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(3, `${label} must be at least 3 characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

/** Optional non-empty text schema that converts blanks to undefined. */
export const optionalNonEmptyTextSchema = (label: string, max = 1000) => optionalize(nonEmptyTextSchema(label, max));

export type PaginationParams = z.infer<typeof paginationParamsSchema>;


