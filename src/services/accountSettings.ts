import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  AccountSettings,
  IntegrationSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  createDefaultAccountSettings,
} from '../types/account';

const TABLE_NAME = 'account_settings';

type AccountSettingsRow = {
  user_id: string;
  profile: ProfileSettings | null;
  security: SecuritySettings | null;
  notifications: NotificationSettings | null;
  integrations: IntegrationSettings | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const mapRowToAccountSettings = (row: AccountSettingsRow): AccountSettings => {
  const defaults = createDefaultAccountSettings(row.user_id);
  return {
    userId: row.user_id,
    profile: row.profile ?? defaults.profile,
    security: row.security ?? defaults.security,
    notifications: row.notifications ?? defaults.notifications,
    integrations: row.integrations ?? defaults.integrations,
    createdAt: row.created_at ?? defaults.createdAt,
    updatedAt: row.updated_at ?? defaults.updatedAt,
  };
};

const insertAccountSettings = async (settings: AccountSettings): Promise<AccountSettings> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      user_id: settings.userId,
      profile: settings.profile,
      security: settings.security,
      notifications: settings.notifications,
      integrations: settings.integrations,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapRowToAccountSettings(data as AccountSettingsRow);
};

const handlePostgrestError = (error: PostgrestError): never => {
  console.error('Supabase account settings error:', error);
  throw new Error(error.message || 'Failed to process account settings request');
};

export const fetchOrCreateAccountSettings = async (userId: string): Promise<AccountSettings> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    handlePostgrestError(error);
  }

  if (data) {
    return mapRowToAccountSettings(data as AccountSettingsRow);
  }

  const defaults = createDefaultAccountSettings(userId);
  return insertAccountSettings(defaults);
};

export type AccountSettingsUpdate = Partial<Pick<AccountSettings, 'profile' | 'security' | 'notifications' | 'integrations'>>;

type SectionPayloadMap = {
  profile: ProfileSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
};

const ensureAccountSettingsRow = async (userId: string): Promise<AccountSettings> => {
  return fetchOrCreateAccountSettings(userId);
};

export const updateAccountSettings = async (
  userId: string,
  updates: AccountSettingsUpdate,
): Promise<AccountSettings> => {
  if (!updates || Object.keys(updates).length === 0) {
    return ensureAccountSettingsRow(userId);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      const defaults = createDefaultAccountSettings(userId, updates as Partial<AccountSettings>);
      return insertAccountSettings(defaults);
    }
    handlePostgrestError(error);
  }

  if (!data) {
    const defaults = createDefaultAccountSettings(userId, updates as Partial<AccountSettings>);
    return insertAccountSettings(defaults);
  }

  return mapRowToAccountSettings(data as AccountSettingsRow);
};

export const updateAccountSettingsSection = async <T extends keyof SectionPayloadMap>(
  userId: string,
  section: T,
  value: SectionPayloadMap[T],
): Promise<AccountSettings> => {
  const updates: AccountSettingsUpdate = {
    [section]: value,
  } as AccountSettingsUpdate;

  return updateAccountSettings(userId, updates);
};
