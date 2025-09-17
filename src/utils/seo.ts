interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export const updateSEO = (config: SEOConfig): void => {
  // Update title
  document.title = config.title;

  // Update or create meta tags
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
  updateMetaTag('og:type', config.type || 'website', true);
  
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

export const defaultSEO: SEOConfig = {
  title: 'Parscade - Next-Generation Document Processing Platform',
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
  type: 'website'
};