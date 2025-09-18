// Analytics utility functions
// This is a placeholder for analytics integration

import {
  analyticsEventSchema,
  analyticsUserSchema,
  nonEmptyTextSchema,
  type AnalyticsEvent,
  type AnalyticsUser,
} from '../schemas';
import { logInfo, logWarn } from './log';

class Analytics {
  private isInitialized = false;

  init(apiKey?: string): void {
    if (this.isInitialized) return;
    
    // Initialize your analytics service here
    // Example: Google Analytics, Mixpanel, Amplitude, etc.
    logInfo('Analytics initialized');
    this.isInitialized = true;
  }

  track(event: AnalyticsEvent): void {
    if (!this.isInitialized) {
      logWarn('Analytics not initialized');
      return;
    }

    const result = analyticsEventSchema.safeParse(event);
    if (!result.success) {
      logWarn('[analytics.track] Invalid event');
      return;
    }
    const payload = result.data;

    // Track event
    // Intentionally not logging payload contents to avoid exposing sensitive data
    
    // Example implementation:
    // gtag('event', event.name, event.properties);
    // mixpanel.track(event.name, event.properties);
  }

  identify(user: AnalyticsUser): void {
    if (!this.isInitialized) {
      logWarn('Analytics not initialized');
      return;
    }

    const userResult = analyticsUserSchema.safeParse(user);
    if (!userResult.success) {
      logWarn('[analytics.identify] Invalid user');
      return;
    }
    const payload = userResult.data;

    // Identify user
    // Intentionally not logging payload contents to avoid exposing sensitive data
    
    // Example implementation:
    // gtag('config', 'GA_MEASUREMENT_ID', { user_id: user.id });
    // mixpanel.identify(user.id);
  }

  page(name: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) {
      logWarn('Analytics not initialized');
      return;
    }

    // Track page view
    const nameResult = nonEmptyTextSchema('Page name', 120).safeParse(name);
    if (!nameResult.success) {
      logWarn('[analytics.page] Invalid page name');
      return;
    }
    const pageName = nameResult.data;
    let props: Record<string, any> | undefined = undefined;
    if (analyticsEventSchema.shape.properties) {
      const propsResult = analyticsEventSchema.shape.properties.safeParse(properties);
      if (!propsResult.success) {
        logWarn('[analytics.page] Invalid properties');
      } else {
        props = propsResult.data as any;
      }
    }
    // Not logging page payload to avoid exposing sensitive data
    
    // Example implementation:
    // gtag('config', 'GA_MEASUREMENT_ID', { page_title: name, ...properties });
    // mixpanel.track('Page View', { page: name, ...properties });
  }
}

export const analytics = new Analytics();

// Common event tracking functions
export const trackButtonClick = (buttonName: string, location?: string) => {
  analytics.track({
    name: 'Button Click',
    properties: {
      button_name: buttonName,
      location,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackPageView = (pageName: string) => {
  analytics.page(pageName, {
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });
};

export const trackFormSubmit = (formName: string, success: boolean) => {
  analytics.track({
    name: 'Form Submit',
    properties: {
      form_name: formName,
      success,
      timestamp: new Date().toISOString(),
    },
  });
};

