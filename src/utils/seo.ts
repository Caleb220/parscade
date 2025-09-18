import { seoConfigSchema } from '../schemas';
import type { SeoConfig } from '../schemas';
import { logWarn } from './log';

/**
 * Updates the document's SEO metadata based on the provided configuration.
 * Safely handles meta tag creation and updates with validation.
 * 
 * @param configInput - SEO configuration object
 */
export const updateSEO = (configInput: SeoConfig): void => {
  const parsed = seoConfigSchema.safeParse(configInput);
  if (!parsed.success) {
    logWarn('[seo] Invalid SEO config');
    return;
  }
  const config = parsed.data;
  
  // Update title
  document.title = config.title;

  /**
   * Helper function to update or create meta tags.
   * 
   * @param name - Meta tag name or property
   * @param content - Content for the meta tag
   * @param property - Whether to use 'property' attribute instead of 'name'
   */
  const updateMetaTag = (name: string, content: string, property = false) => {
    const attribute = property ? 'property' : 'name';
    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  // Basic meta tags
  updateMetaTag('description', config.description);
  
  if (config.keywords) {
    updateMetaTag('keywords', config.keywords.join(', '));
  }

  // Open Graph tags
  updateMetaTag('og:title', config.title, true);
  updateMetaTag('og:description', config.description, true);
  updateMetaTag('og:type', config.type, true);
  
  if (config.image) {
    updateMetaTag('og:image', config.image, true);
  }
  
  if (config.url) {
    updateMetaTag('og:url', config.url, true);
  }

  // Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', config.title);
  updateMetaTag('twitter:description', config.description);
  
  if (config.image) {
    updateMetaTag('twitter:image', config.image);
  }
};

/**
 * Default SEO configuration for the application.
 * Provides fallback values for all pages.
 */
export const defaultSEO: SeoConfig = seoConfigSchema.parse({
  title: 'Parscade',
  description: 'Join our beta program and help build the future of document processing. Intelligent parsing platform designed for enterprise-grade accuracy and speed.',
  keywords: [
    'document parsing',
    'data extraction',
    'OCR',
    'document processing',
    'AI parsing',
    'structured data',
    'enterprise software',
    'beta program',
    'startup'
  ],
  image: '/main-logo.png',
  type: 'website'
});

