import { supabase } from '../lib/supabase';
import {
  AccountSettings,
  IntegrationSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  createDefaultAccountSettings,
} from '../types/account';
import { ensureMaybeSingle, ensureSingle, pruneUndefined, SupabaseServiceError } from './supabaseClient';

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

const buildInsertPayload = (settings: AccountSettings) =>
  pruneUndefined({
    user_id: settings.userId,
    profile: settings.profile,
    security: settings.security,
    notifications: settings.notifications,
    integrations: settings.integrations,
  });

const buildUpdatePayload = (updates: AccountSettingsUpdate) =>
  pruneUndefined({
    profile: updates.profile,
    security: updates.security,
    notifications: updates.notifications,
    integrations: updates.integrations,
    updated_at: new Date().toISOString(),
  });

const insertAccountSettings = async (settings: AccountSettings): Promise<AccountSettings> => {
  try {
    const response = await supabase
      .from(TABLE_NAME)
      .insert(buildInsertPayload(settings))
      .select()
      .single();

    const data = ensureSingle(response, 'Insert account settings');
    return mapRowToAccountSettings(data as AccountSettingsRow);
  } catch (error) {
    if (error instanceof SupabaseServiceError && error.causeError.code === '23505') {
      // Row already exists – return the persisted version instead of failing.
      const existing = await fetchOrCreateAccountSettings(settings.userId);
      return existing;
    }
    throw error;
  }
};

export const fetchOrCreateAccountSettings = async (
  userId: string,
  seed?: AccountSettingsUpdate,
): Promise<AccountSettings> => {
  const response = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const row = ensureMaybeSingle(response, 'Fetch account settings');
  if (row) {
    return mapRowToAccountSettings(row as AccountSettingsRow);
  }

  const defaults = createDefaultAccountSettings(userId, seed as Partial<AccountSettings> | undefined);
  return insertAccountSettings(defaults);
};

export type AccountSettingsUpdate = Partial<Pick<AccountSettings, 'profile' | 'security' | 'notifications' | 'integrations'>>;

type SectionPayloadMap = {
  profile: ProfileSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
};

const ensureAccountSettingsRow = async (
  userId: string,
  seed?: AccountSettingsUpdate,
): Promise<AccountSettings> => {
  const defaults = createDefaultAccountSettings(userId, seed as Partial<AccountSettings> | undefined);
  return insertAccountSettings(defaults);
};

export const updateAccountSettings = async (
  userId: string,
  updates: AccountSettingsUpdate,
): Promise<AccountSettings> => {
  const hasUpdates = updates && Object.keys(updates).length > 0;
  if (!hasUpdates) {
    return fetchOrCreateAccountSettings(userId);
  }

  const sanitizedUpdates = buildUpdatePayload(updates);

  const response = await supabase
    .from(TABLE_NAME)
    .update(sanitizedUpdates)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  const row = ensureMaybeSingle(response, 'Update account settings');

  if (!row) {
    return ensureAccountSettingsRow(userId, updates);
  }

  return mapRowToAccountSettings(row as AccountSettingsRow);
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
