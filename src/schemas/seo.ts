import { z } from 'zod';

import {
  keywordSchema,
  nonEmptyTextSchema,
  optionalHttpsUrlSchema,
  optionalImagePathSchema,
} from './common';

/**
 * SEO configuration schema guaranteeing both compile-time and runtime validation
 * for metadata used across marketing pages.
 */
export const seoConfigSchema = z
  .object({
    title: nonEmptyTextSchema('SEO title', 160),
    description: nonEmptyTextSchema('SEO description', 320),
    keywords: z
      .array(keywordSchema)
      .min(1, 'Provide at least one keyword for SEO context.')
      .max(25, 'Provide at most 25 SEO keywords.')
      .transform((keywords) => Array.from(new Set(keywords)))
      .optional(),
    image: optionalImagePathSchema,
    url: optionalHttpsUrlSchema,
    type: z.enum(['website', 'article']).default('website'),
  })
  .strict();

export type SeoConfig = z.infer<typeof seoConfigSchema>;

