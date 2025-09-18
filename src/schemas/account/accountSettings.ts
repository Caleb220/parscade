import { z } from 'zod';

import {
  booleanSchema,
  emailSchema,
  httpsUrlSchema,
  idSchema,
  isoDateTimeSchema,
  nonEmptyTextSchema,
  optionalIsoDateTimeSchema,
  optionalNonEmptyTextSchema,
  optionalPhoneSchema,
  optionalTrimmedStringSchema,
  slugSchema,
  time24HourStringSchema,
} from '../common';

/**
 * Notification cadence options used by marketing + account communications.
 */
export const notificationFrequencySchema = z.enum(['real-time', 'daily', 'weekly', 'monthly']);

/**
 * Profile settings capturing primary user metadata.
 */
export const profileSettingsSchema = z
  .object({
    fullName: nonEmptyTextSchema('Full name', 120),
    email: emailSchema,
    phone: optionalPhoneSchema.transform((value) => value ?? ''),
    timezone: nonEmptyTextSchema('Timezone', 80),
    language: nonEmptyTextSchema('Language', 80),
  })
  .strict();

/**
 * Historical login activity entries for device/security auditing.
 */
export const loginHistoryEntrySchema = z
  .object({
    id: slugSchema,
    location: nonEmptyTextSchema('Login location', 120),
    timestamp: isoDateTimeSchema,
    device: nonEmptyTextSchema('Device', 80),
    status: z.enum(['active', 'inactive', 'suspicious']),
  })
  .strict();

/**
 * Security preferences including MFA and API key metadata.
 */
export const securitySettingsSchema = z
  .object({
    smsTwoFactorEnabled: booleanSchema,
    authenticatorAppEnabled: booleanSchema,
    backupCodesGenerated: booleanSchema,
    lastPasswordChange: optionalIsoDateTimeSchema,
    apiKeys: z
      .object({
        production: optionalTrimmedStringSchema('Production API key', 0, 128).transform((value) => value ?? '').default(''),
        development: optionalTrimmedStringSchema('Development API key', 0, 128).transform((value) => value ?? '').default(''),
      })
      .strict(),
    loginHistory: z
      .array(loginHistoryEntrySchema)
      .min(0)
      .max(100, 'Limit login history to the most recent 100 entries.'),
  })
  .strict();

/**
 * Quiet hours configuration ensuring start and end differ.
 */
export const quietHoursSettingsSchema = z
  .object({
    start: time24HourStringSchema,
    end: time24HourStringSchema,
    enabled: booleanSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.start === value.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quiet hours start and end must differ.',
        path: ['end'],
      });
    }
  });

/**
 * Notification channel preferences and quiet period configuration.
 */
export const notificationSettingsSchema = z
  .object({
    accountUpdates: booleanSchema,
    productUpdates: booleanSchema,
    marketingEmails: booleanSchema,
    teamMemberActivity: booleanSchema,
    projectChanges: booleanSchema,
    processingAlerts: booleanSchema,
    errorNotifications: booleanSchema,
    maintenanceAlerts: booleanSchema,
    frequency: notificationFrequencySchema,
    quietHours: quietHoursSettingsSchema,
  })
  .strict();

/**
 * Current webhook states supported by integrations.
 */
export const webhookStatusSchema = z.enum(['active', 'warning', 'inactive']);

/**
 * Individual webhook destination configuration.
 */
export const webhookConfigSchema = z
  .object({
    id: slugSchema,
    name: nonEmptyTextSchema('Webhook name', 120),
    url: httpsUrlSchema,
    status: webhookStatusSchema,
    description: optionalNonEmptyTextSchema('Webhook description', 240),
  })
  .strip();

/**
 * Third-party integration toggles and webhook destinations.
 */
export const integrationSettingsSchema = z
  .object({
    slackConnected: booleanSchema,
    teamsConnected: booleanSchema,
    zapierConnected: booleanSchema,
    webhookConfigs: z.array(webhookConfigSchema).max(20, 'Limit to 20 webhook destinations.'),
    retryFailedRequests: booleanSchema,
    includeSignatures: booleanSchema,
  })
  .strict();

/**
 * Canonical account settings document stored per user.
 */
export const accountSettingsSchema = z
  .object({
    userId: idSchema,
    profile: profileSettingsSchema,
    security: securitySettingsSchema,
    notifications: notificationSettingsSchema,
    integrations: integrationSettingsSchema,
    createdAt: optionalIsoDateTimeSchema,
    updatedAt: optionalIsoDateTimeSchema,
  })
  .strict();

/**
 * Account settings sections available in the UI.
 */
export const accountSettingsSectionSchema = z.enum(['profile', 'security', 'notifications', 'integrations']);

export type NotificationFrequency = z.infer<typeof notificationFrequencySchema>;
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;
export type LoginHistoryEntry = z.infer<typeof loginHistoryEntrySchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type QuietHoursSettings = z.infer<typeof quietHoursSettingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type WebhookConfig = z.infer<typeof webhookConfigSchema>;
export type IntegrationSettings = z.infer<typeof integrationSettingsSchema>;
export type AccountSettings = z.infer<typeof accountSettingsSchema>;
export type AccountSettingsSection = z.infer<typeof accountSettingsSectionSchema>;

/**
 * Partial updates allowed when persisting account settings.
 */
export const accountSettingsUpdateSchema = accountSettingsSchema
  .pick({
    profile: true,
    security: true,
    notifications: true,
    integrations: true,
  })
  .partial()
  .strict();

export type AccountSettingsUpdate = z.infer<typeof accountSettingsUpdateSchema>;

const defaultLoginHistory: LoginHistoryEntry[] = [
  {
    id: 'sf-chrome',
    location: 'San Francisco, CA',
    timestamp: '2024-05-10T12:00:00.000Z',
    device: 'Chrome',
    status: 'active',
  },
  {
    id: 'la-safari',
    location: 'Los Angeles, CA',
    timestamp: '2024-05-09T08:30:00.000Z',
    device: 'Safari',
    status: 'inactive',
  },
];

const defaultWebhookConfigs: WebhookConfig[] = [
  {
    id: 'complete',
    name: 'Data Processing Complete',
    url: 'https://your-app.com/webhooks/complete',
    status: 'active',
    description: "",
  },
  {
    id: 'errors',
    name: 'Error Notifications',
    url: 'https://your-app.com/webhooks/errors',
    status: 'warning',
    description: "",
  },
];

const normaliseMaybeString = (value?: string | null) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Factory that builds fully validated account settings documents. When overrides
 * are supplied they are merged, normalised, and validated before being returned.
 */
export const createDefaultAccountSettings = (
  userId: string,
  overrides?: Partial<AccountSettings>,
): AccountSettings => {
  const base: AccountSettings = {
    userId,
    profile: {
      fullName: normaliseMaybeString(overrides?.profile?.fullName) ?? 'New User',
      email: normaliseMaybeString(overrides?.profile?.email) ?? 'user@example.com',
      phone: normaliseMaybeString(overrides?.profile?.phone) ?? '',
      timezone: normaliseMaybeString(overrides?.profile?.timezone) ?? 'Pacific Standard Time (PST)',
      language: normaliseMaybeString(overrides?.profile?.language) ?? 'English (US)',
    },
    security: {
      smsTwoFactorEnabled: overrides?.security?.smsTwoFactorEnabled ?? false,
      authenticatorAppEnabled: overrides?.security?.authenticatorAppEnabled ?? false,
      backupCodesGenerated: overrides?.security?.backupCodesGenerated ?? false,
      lastPasswordChange: overrides?.security?.lastPasswordChange,
      apiKeys: {
        production: overrides?.security?.apiKeys?.production?.trim() ?? '',
        development: overrides?.security?.apiKeys?.development?.trim() ?? '',
      },
      loginHistory: overrides?.security?.loginHistory ?? defaultLoginHistory,
    },
    notifications: {
      accountUpdates: overrides?.notifications?.accountUpdates ?? false,
      productUpdates: overrides?.notifications?.productUpdates ?? false,
      marketingEmails: overrides?.notifications?.marketingEmails ?? false,
      teamMemberActivity: overrides?.notifications?.teamMemberActivity ?? false,
      projectChanges: overrides?.notifications?.projectChanges ?? false,
      processingAlerts: overrides?.notifications?.processingAlerts ?? false,
      errorNotifications: overrides?.notifications?.errorNotifications ?? false,
      maintenanceAlerts: overrides?.notifications?.maintenanceAlerts ?? false,
      frequency: overrides?.notifications?.frequency ?? 'real-time',
      quietHours: {
        start: overrides?.notifications?.quietHours?.start ?? '22:00',
        end: overrides?.notifications?.quietHours?.end ?? '08:00',
        enabled: overrides?.notifications?.quietHours?.enabled ?? false,
      },
    },
    integrations: {
      slackConnected: overrides?.integrations?.slackConnected ?? false,
      teamsConnected: overrides?.integrations?.teamsConnected ?? false,
      zapierConnected: overrides?.integrations?.zapierConnected ?? false,
      webhookConfigs:
        overrides?.integrations?.webhookConfigs && overrides.integrations.webhookConfigs.length > 0
          ? overrides.integrations.webhookConfigs
          : defaultWebhookConfigs,
      retryFailedRequests: overrides?.integrations?.retryFailedRequests ?? false,
      includeSignatures: overrides?.integrations?.includeSignatures ?? false,
    },
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
  };

  return accountSettingsSchema.parse(base);
};
