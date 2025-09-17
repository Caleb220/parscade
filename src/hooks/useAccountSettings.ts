import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccountSettings,
  IntegrationSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  createDefaultAccountSettings,
} from '../types/account';
import {
  fetchOrCreateAccountSettings,
  updateAccountSettingsSection,
} from '../services/accountSettings';

export type AccountSettingsSection = 'profile' | 'security' | 'notifications' | 'integrations';

interface UseAccountSettingsOptions {
  userId?: string;
  email?: string | null;
  fullName?: string | null;
}

interface UseAccountSettingsResult {
  settings: AccountSettings | null;
  isLoading: boolean;
  error: string | null;
  savingSection: AccountSettingsSection | null;
  refresh: () => Promise<void>;
  saveProfile: (profile: ProfileSettings) => Promise<AccountSettings>;
  saveSecurity: (security: SecuritySettings) => Promise<AccountSettings>;
  saveNotifications: (notifications: NotificationSettings) => Promise<AccountSettings>;
  saveIntegrations: (integrations: IntegrationSettings) => Promise<AccountSettings>;
}

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

export const useAccountSettings = ({ userId, email, fullName }: UseAccountSettingsOptions): UseAccountSettingsResult => {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<AccountSettingsSection | null>(null);

  const defaults = useMemo(() => {
    if (!userId) return null;
    return createDefaultAccountSettings(userId, {
      profile: {
        fullName: fullName ?? '',
        email: email ?? '',
      } as ProfileSettings,
    });
  }, [userId, email, fullName]);

  const loadSettings = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const seedOverrides = defaults ? { profile: defaults.profile } : undefined;
      const data = await fetchOrCreateAccountSettings(userId, seedOverrides);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load account settings', err);
      if (defaults) {
        setSettings(defaults);
      }
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  }, [userId, defaults]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings || !defaults) return;
    setSettings(defaults);
  }, [defaults, settings]);

  const handleSectionSave = useCallback(
    async <T extends AccountSettingsSection>(section: T, value: AccountSettings[T]): Promise<AccountSettings> => {
      if (!userId) {
        throw new Error('Unable to save settings without an authenticated user.');
      }

      setSavingSection(section);
      setError(null);

      try {
        const updated = await updateAccountSettingsSection(userId, section, value as never);
        setSettings(updated);
        return updated;
      } catch (err) {
        console.error(`Failed to update ${section} settings`, err);
        setError(formatError(err));
        throw err;
      } finally {
        setSavingSection(null);
      }
    },
    [userId],
  );

  const saveProfile = useCallback((profile: ProfileSettings) => handleSectionSave('profile', profile), [handleSectionSave]);
  const saveSecurity = useCallback((security: SecuritySettings) => handleSectionSave('security', security), [handleSectionSave]);
  const saveNotifications = useCallback(
    (notifications: NotificationSettings) => handleSectionSave('notifications', notifications),
    [handleSectionSave],
  );
  const saveIntegrations = useCallback(
    (integrations: IntegrationSettings) => handleSectionSave('integrations', integrations),
    [handleSectionSave],
  );

  return {
    settings,
    isLoading,
    error,
    savingSection,
    refresh: loadSettings,
    saveProfile,
    saveSecurity,
    saveNotifications,
    saveIntegrations,
  };
};
