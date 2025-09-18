import {
  analyticsEventSchema,
  analyticsUserSchema,
  nonEmptyTextSchema,
} from '../schemas';
import type {
  AnalyticsEvent,
  AnalyticsUser,
} from '../schemas';
import { logInfo, logWarn } from './log';

/**
 * Analytics service class for tracking user events and behavior.
 * Provides type-safe wrappers for analytics operations with validation.
 */
class Analytics {
  private isInitialized = false;

  /**
   * Initialize the analytics service with an API key.
   * 
   * @param apiKey - Optional API key for analytics service
   */
  init(apiKey?: string | null): void {
    if (this.isInitialized) return;
    
    if (apiKey) {
      // Initialize your analytics service here
      // Example: Google Analytics, Mixpanel, Amplitude, etc.
    }
    
    logInfo('Analytics initialized');
    this.isInitialized = true;
  }

  /**
   * Track a user event with properties.
   * 
   * @param event - The event to track with name and properties
   */
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
    
    // The payload is validated but not used to avoid exposing sensitive data in logs
    // const payload = result.data;

    // Example implementation:
    // gtag('event', event.name, event.properties);
    // mixpanel.track(event.name, event.properties);
  }

  /**
   * Identify a user for analytics tracking.
   * 
   * @param user - User information for identification
   */
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

    
    // The payload is validated but not used to avoid exposing sensitive data in logs
    // const payload = userResult.data;
    
    // Example implementation:
    // gtag('config', 'GA_MEASUREMENT_ID', { user_id: user.id });
    // mixpanel.identify(user.id);
  }

  /**
   * Track a page view event.
   * 
   * @param name - Name of the page being viewed
   * @param properties - Optional additional properties for the page view
   */
  page(name: string, properties?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      logWarn('Analytics not initialized');
      return;
    }

    const nameResult = nonEmptyTextSchema('Page name', 120).safeParse(name);
    if (!nameResult.success) {
      logWarn('[analytics.page] Invalid page name');
      return;
    }
    
    // Validate properties if provided
    let validatedProps: Record<string, unknown> | undefined = undefined;
    if (analyticsEventSchema.shape.properties) {
      const propsResult = analyticsEventSchema.shape.properties.safeParse(properties);
      if (!propsResult.success) {
        logWarn('[analytics.page] Invalid properties');
      } else {
        validatedProps = propsResult.data as Record<string, unknown>;
      }
    }
    
    // The payload is validated but not used to avoid exposing sensitive data in logs
    // const pageName = nameResult.data;
    // Not logging page payload to avoid exposing sensitive data in logs
    
    // Example implementation:
    // gtag('config', 'GA_MEASUREMENT_ID', { page_title: name, ...properties });
    // mixpanel.track('Page View', { page: name, ...properties });
  }
}

export const analytics = new Analytics();

/**
 * Track a button click event with location context.
 * 
 * @param buttonName - Name of the button clicked
 * @param location - Optional location context
 */
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

/**
 * Track a page view event.
 * 
 * @param pageName - Name of the page being viewed
 */
export const trackPageView = (pageName: string) => {
  analytics.page(pageName, {
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });
};

/**
 * Track a form submission event.
 * 
 * @param formName - Name of the form being submitted
 * @param success - Whether the submission was successful
 */
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

