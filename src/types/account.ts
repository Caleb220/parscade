export type NotificationFrequency = 'real-time' | 'daily' | 'weekly' | 'monthly';

export interface ProfileSettings {
  fullName: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
}

export interface LoginHistoryEntry {
  id: string;
  location: string;
  timestamp: string;
  device: string;
  status: 'active' | 'inactive' | 'suspicious';
}

export interface SecuritySettings {
  smsTwoFactorEnabled: boolean;
  authenticatorAppEnabled: boolean;
  backupCodesGenerated: boolean;
  lastPasswordChange?: string;
  apiKeys: {
    production: string;
    development: string;
  };
  loginHistory: LoginHistoryEntry[];
}

export interface QuietHoursSettings {
  start: string;
  end: string;
  enabled: boolean;
}

export interface NotificationSettings {
  accountUpdates: boolean;
  productUpdates: boolean;
  marketingEmails: boolean;
  teamMemberActivity: boolean;
  projectChanges: boolean;
  processingAlerts: boolean;
  errorNotifications: boolean;
  maintenanceAlerts: boolean;
  frequency: NotificationFrequency;
  quietHours: QuietHoursSettings;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'warning' | 'inactive';
}

export interface IntegrationSettings {
  slackConnected: boolean;
  teamsConnected: boolean;
  zapierConnected: boolean;
  webhookConfigs: WebhookConfig[];
  retryFailedRequests: boolean;
  includeSignatures: boolean;
}

export interface AccountSettings {
  userId: string;
  profile: ProfileSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  createdAt?: string;
  updatedAt?: string;
}

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
  },
  {
    id: 'errors',
    name: 'Error Notifications',
    url: 'https://your-app.com/webhooks/errors',
    status: 'warning',
  },
];

export const createDefaultAccountSettings = (userId: string, overrides?: Partial<AccountSettings>): AccountSettings => ({
  userId,
  profile: {
    fullName: overrides?.profile?.fullName ?? '',
    email: overrides?.profile?.email ?? '',
    phone: overrides?.profile?.phone ?? '',
    timezone: overrides?.profile?.timezone ?? 'Pacific Standard Time (PST)',
    language: overrides?.profile?.language ?? 'English (US)',
  },
  security: {
    smsTwoFactorEnabled: overrides?.security?.smsTwoFactorEnabled ?? false,
    authenticatorAppEnabled: overrides?.security?.authenticatorAppEnabled ?? false,
    backupCodesGenerated: overrides?.security?.backupCodesGenerated ?? false,
    lastPasswordChange: overrides?.security?.lastPasswordChange,
    apiKeys: {
      production: overrides?.security?.apiKeys?.production ?? '',
      development: overrides?.security?.apiKeys?.development ?? '',
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
    webhookConfigs: overrides?.integrations?.webhookConfigs ?? defaultWebhookConfigs,
    retryFailedRequests: overrides?.integrations?.retryFailedRequests ?? false,
    includeSignatures: overrides?.integrations?.includeSignatures ?? false,
  },
  createdAt: overrides?.createdAt,
  updatedAt: overrides?.updatedAt,
});
