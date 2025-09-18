import { z } from 'zod';

import { supabase } from '../../../lib/supabase';
import {
  AccountSettings,
  AccountSettingsUpdate,
  IntegrationSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  accountSettingsSchema,
  accountSettingsUpdateSchema,
  createDefaultAccountSettings,
  integrationSettingsSchema,
  notificationSettingsSchema,
  optionalIsoDateTimeSchema,
  profileSettingsSchema,
  securitySettingsSchema,
} from '../../../schemas';
import { ensureMaybeSingle, ensureSingle, pruneUndefined, SupabaseServiceError } from '../../../services/supabaseClient';
import { logger } from '../../../services/logger';

const TABLE_NAME = 'account_settings';

const supabaseTimestampSchema = optionalIsoDateTimeSchema.nullish();

const accountSettingsRowSchema = z
  .object({
    user_id: accountSettingsSchema.shape.userId,
    profile: profileSettingsSchema.nullable(),
    security: securitySettingsSchema.nullable(),
    notifications: notificationSettingsSchema.nullable(),
    integrations: integrationSettingsSchema.nullable(),
    created_at: supabaseTimestampSchema,
    updated_at: supabaseTimestampSchema,
  })
  .strict();

type AccountSettingsRow = z.infer<typeof accountSettingsRowSchema>;

const mapRowToAccountSettings = (row: AccountSettingsRow): AccountSettings => {
  const defaults = createDefaultAccountSettings(row.user_id);
  const merged: AccountSettings = {
    userId: row.user_id,
    profile: row.profile ?? defaults.profile,
    security: row.security ?? defaults.security,
    notifications: row.notifications ?? defaults.notifications,
    integrations: row.integrations ?? defaults.integrations,
    createdAt: row.created_at ?? defaults.createdAt,
    updatedAt: row.updated_at ?? defaults.updatedAt,
  };

  return accountSettingsSchema.parse(merged);
};

const sanitizeForInsert = (settings: AccountSettings) => {
  const sanitized = accountSettingsSchema.parse(settings);
  return pruneUndefined({
    user_id: sanitized.userId,
    profile: sanitized.profile,
    security: sanitized.security,
    notifications: sanitized.notifications,
    integrations: sanitized.integrations,
  });
};

const sanitizeForUpdate = (updates: AccountSettingsUpdate) => {
  const sanitized = accountSettingsUpdateSchema.parse(updates);
  return pruneUndefined({
    profile: sanitized.profile,
    security: sanitized.security,
    notifications: sanitized.notifications,
    integrations: sanitized.integrations,
    updated_at: new Date().toISOString(),
  });
};

const insertAccountSettings = async (settings: AccountSettings): Promise<AccountSettings> => {
  const payload = sanitizeForInsert(settings);

  try {
    const response = await supabase.from(TABLE_NAME).insert(payload).select().single();
    const data = ensureSingle(response, 'Insert account settings');
    const parsedRow = accountSettingsRowSchema.parse(data);
    return mapRowToAccountSettings(parsedRow);
  } catch (error) {
    if (error instanceof SupabaseServiceError && error.causeError.code === '23505') {
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
    logger.debug('Found existing account settings', {
      context: { feature: 'account-settings', action: 'fetchSettings', userId },
    });
    const parsedRow = accountSettingsRowSchema.parse(row);
    return mapRowToAccountSettings(parsedRow);
  }

  logger.info('Creating default account settings for new user', {
    context: { feature: 'account-settings', action: 'createDefaults', userId },
  });
  const sanitizedSeed = seed ? accountSettingsUpdateSchema.parse(seed) : undefined;
  const defaults = createDefaultAccountSettings(userId, sanitizedSeed as Partial<AccountSettings> | undefined);
  return insertAccountSettings(defaults);
};

const sectionSchemaMap = {
  profile: profileSettingsSchema,
  security: securitySettingsSchema,
  notifications: notificationSettingsSchema,
  integrations: integrationSettingsSchema,
} as const;

type SectionSchemaMap = typeof sectionSchemaMap;
type SectionPayloadMap = { [K in keyof SectionSchemaMap]: z.infer<SectionSchemaMap[K]> };

export const updateAccountSettings = async (
  userId: string,
  updates: AccountSettingsUpdate,
): Promise<AccountSettings> => {
  if (!updates || Object.keys(updates).length === 0) {
    return fetchOrCreateAccountSettings(userId);
  }

  const sanitizedUpdates = sanitizeForUpdate(updates);

  const response = await supabase
    .from(TABLE_NAME)
    .update(sanitizedUpdates)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  const row = ensureMaybeSingle(response, 'Update account settings');

  if (!row) {
    const defaults = createDefaultAccountSettings(userId, updates as Partial<AccountSettings>);
    return insertAccountSettings(defaults);
  }

  const parsedRow = accountSettingsRowSchema.parse(row);
  return mapRowToAccountSettings(parsedRow);
};

export const updateAccountSettingsSection = async <T extends keyof SectionSchemaMap>(
  userId: string,
  section: T,
  value: SectionPayloadMap[T],
): Promise<AccountSettings> => {
  const schema = sectionSchemaMap[section];
  const sanitizedValue = schema.parse(value);
  const updates = accountSettingsUpdateSchema.parse({ [section]: sanitizedValue } as AccountSettingsUpdate);

  return updateAccountSettings(userId, updates);
};








