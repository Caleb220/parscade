import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  AccountSettings,
  AccountSettingsSection,
  IntegrationSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  accountSettingsSchema,
  createDefaultAccountSettings,
} from '../../../schemas';
import {
  fetchOrCreateAccountSettings,
  updateAccountSettingsSection,
} from '../services/accountSettingsService';

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

import { formatErrorForUser } from '../../../utils/zodError';
import { logger } from '../../../services/logger';

export const useAccountSettings = ({ userId, email, fullName }: UseAccountSettingsOptions): UseAccountSettingsResult => {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<AccountSettingsSection | null>(null);
  const loadingRef = useRef<boolean>(false);

  const defaults = useMemo(() => {
    if (!userId) return null;
    const base = createDefaultAccountSettings(userId);
    const profile = {
      ...base.profile,
      ...(fullName ? { fullName: fullName.trim() } : {}),
      ...(email ? { email: email.trim() } : {}),
    } satisfies ProfileSettings;

    return accountSettingsSchema.parse({
      ...base,
      profile,
    });
  }, [userId, email, fullName]);

  const loadSettings = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    // Prevent concurrent loading requests
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const seedOverrides = defaults ? { profile: defaults.profile } : undefined;
      const data = await fetchOrCreateAccountSettings(userId, seedOverrides);
      setSettings(data);
    } catch (err) {
      logger.warn('Failed to load account settings', {
        context: { feature: 'account-settings', action: 'loadSettings', userId },
        error: err instanceof Error ? err : new Error(String(err)),
      });
      if (defaults) {
        setSettings(defaults);
      }
      setError(formatErrorForUser(err, 'We could not load your settings.'))
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
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
        logger.warn(`Failed to update account settings section: ${section}`, {
          context: { feature: 'account-settings', action: 'updateSection', userId },
          error: err instanceof Error ? err : new Error(String(err)),
          metadata: { section },
        });
        setError(formatErrorForUser(err, 'We could not load your settings.'))
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


