
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  Globe,
  Key,
  Mail,
  Settings as SettingsIcon,
  Shield,
  Smartphone,
  User,
  Users,
  Webhook,
} from 'lucide-react';
import Button from '../atoms/Button';
import LoadingSpinner from '../atoms/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useAccountSettings } from '../../hooks/useAccountSettings';
import {
  IntegrationSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  WebhookConfig,
} from '../../types/account';

interface TabProps {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

type TabId = 'profile' | 'security' | 'notifications' | 'integrations';

const tabs: TabProps[] = [
  { id: 'profile', label: 'Profile Information', icon: <User size={20} /> },
  { id: 'security', label: 'Security & Privacy', icon: <Shield size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'integrations', label: 'Integrations', icon: <SettingsIcon size={20} /> },
];

type PasswordStatusState = 'idle' | 'saving' | 'success' | 'error';

interface PasswordState {
  status: PasswordStatusState;
  message?: string;
}

const timezoneOptions = [
  'Pacific Standard Time (PST)',
  'Eastern Standard Time (EST)',
  'Central Standard Time (CST)',
  'Mountain Standard Time (MST)',
];

const languageOptions = ['English (US)', 'English (UK)', 'Spanish', 'French'];

const notificationFrequencyOptions = [
  { value: 'real-time', label: 'Real-time' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly summary' },
  { value: 'monthly', label: 'Monthly report' },
] as const;

const cloneProfile = (profile: ProfileSettings): ProfileSettings => ({ ...profile });

const cloneSecurity = (security: SecuritySettings): SecuritySettings => ({
  ...security,
  apiKeys: { ...security.apiKeys },
  loginHistory: security.loginHistory.map((item) => ({ ...item })),
});

const cloneNotifications = (notifications: NotificationSettings): NotificationSettings => ({
  ...notifications,
  quietHours: { ...notifications.quietHours },
});

const cloneIntegrations = (integrations: IntegrationSettings): IntegrationSettings => ({
  ...integrations,
  webhookConfigs: integrations.webhookConfigs.map((config) => ({ ...config })),
});

const maskApiKey = (key: string): string => {
  if (!key) return 'Not generated yet';
  if (key.length <= 8) return key;
  return `${key.slice(0, 7)}••••${key.slice(-4)}`;
};

const randomString = (length: number): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;

  if (cryptoObj?.getRandomValues) {
    const array = new Uint32Array(length);
    cryptoObj.getRandomValues(array);
    result = Array.from(array, (value) => charset[value % charset.length]).join('');
  } else {
    for (let i = 0; i < length; i += 1) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }

  return result;
};

const generateApiKey = (type: 'production' | 'development'): string => {
  const prefix = type === 'production' ? 'pk_prod' : 'pk_dev';
  return `${prefix}_${randomString(12)}`;
};

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return 'Unknown';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return timestamp;
  }
};
const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordState, setPasswordState] = useState<PasswordState>({ status: 'idle' });

  const {
    settings,
    isLoading,
    error,
    savingSection,
    saveProfile,
    saveSecurity,
    saveNotifications,
    saveIntegrations,
  } = useAccountSettings({
    userId: user?.id,
    email: user?.email,
    fullName: user?.user_metadata?.full_name ?? null,
  });

  const [profileDraft, setProfileDraft] = useState<ProfileSettings | null>(null);
  const [securityDraft, setSecurityDraft] = useState<SecuritySettings | null>(null);
  const [notificationsDraft, setNotificationsDraft] = useState<NotificationSettings | null>(null);
  const [integrationsDraft, setIntegrationsDraft] = useState<IntegrationSettings | null>(null);

  useEffect(() => {
    if (!settings) return;
    setProfileDraft(cloneProfile(settings.profile));
    setSecurityDraft(cloneSecurity(settings.security));
    setNotificationsDraft(cloneNotifications(settings.notifications));
    setIntegrationsDraft(cloneIntegrations(settings.integrations));
  }, [settings]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (!error) return;
    setFeedback({ type: 'error', message: error });
  }, [error]);

  const isReady = useMemo(
    () => !!profileDraft && !!securityDraft && !!notificationsDraft && !!integrationsDraft,
    [profileDraft, securityDraft, notificationsDraft, integrationsDraft],
  );

  const handleProfileChange = (next: ProfileSettings) => {
    setProfileDraft(cloneProfile(next));
  };

  const handleSecurityChange = (next: SecuritySettings) => {
    setSecurityDraft(cloneSecurity(next));
  };

  const handleNotificationsChange = (next: NotificationSettings) => {
    setNotificationsDraft(cloneNotifications(next));
  };

  const handleIntegrationsChange = (next: IntegrationSettings) => {
    setIntegrationsDraft(cloneIntegrations(next));
  };

  const handleSaveProfile = async () => {
    if (!profileDraft) return;
    try {
      const updated = await saveProfile(profileDraft);
      setProfileDraft(cloneProfile(updated.profile));
      setFeedback({ type: 'success', message: 'Profile information updated successfully.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Failed to update profile.' });
    }
  };

  const handleSaveSecurity = async () => {
    if (!securityDraft) return;
    try {
      const updated = await saveSecurity(securityDraft);
      setSecurityDraft(cloneSecurity(updated.security));
      setFeedback({ type: 'success', message: 'Security settings saved.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Failed to update security settings.' });
    }
  };

  const handleSaveNotifications = async () => {
    if (!notificationsDraft) return;
    try {
      const updated = await saveNotifications(notificationsDraft);
      setNotificationsDraft(cloneNotifications(updated.notifications));
      setFeedback({ type: 'success', message: 'Notification preferences saved.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Failed to update notifications.' });
    }
  };

  const handleSaveIntegrations = async () => {
    if (!integrationsDraft) return;
    try {
      const updated = await saveIntegrations(integrationsDraft);
      setIntegrationsDraft(cloneIntegrations(updated.integrations));
      setFeedback({ type: 'success', message: 'Integration settings saved.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Failed to update integrations.' });
    }
  };

  const handlePasswordUpdate = async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (!user?.email) {
      setPasswordState({ status: 'error', message: 'You must be signed in to update your password.' });
      throw new Error('Missing authenticated user email.');
    }

    if (!payload.currentPassword) {
      setPasswordState({ status: 'error', message: 'Please enter your current password.' });
      throw new Error('Missing current password.');
    }

    if (payload.newPassword !== payload.confirmPassword) {
      setPasswordState({ status: 'error', message: 'New passwords do not match.' });
      throw new Error('Password confirmation mismatch.');
    }

    if (payload.newPassword.length < 12) {
      setPasswordState({ status: 'error', message: 'Password must be at least 12 characters long.' });
      throw new Error('Password length requirement not met.');
    }

    setPasswordState({ status: 'saving', message: 'Updating password…' });

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: payload.currentPassword,
      });

      if (signInError) {
        throw signInError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: payload.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      if (securityDraft) {
        const updatedSecurity: SecuritySettings = {
          ...securityDraft,
          lastPasswordChange: new Date().toISOString(),
        };
        setSecurityDraft(cloneSecurity(updatedSecurity));
        await saveSecurity(updatedSecurity);
      }

      setPasswordState({ status: 'success', message: 'Password updated successfully.' });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update password.';
      setPasswordState({ status: 'error', message });
      throw updateError;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap outline-none ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {feedback && (
        <div
          className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm font-medium sm:mx-8 ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-8">
        {!isReady || !settings ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {activeTab === 'profile' && profileDraft && (
              <ProfileTab
                profile={profileDraft}
                onChange={handleProfileChange}
                onSave={handleSaveProfile}
                isSaving={savingSection === 'profile'}
              />
            )}
            {activeTab === 'security' && securityDraft && (
              <SecurityTab
                security={securityDraft}
                onChange={handleSecurityChange}
                onSave={handleSaveSecurity}
                isSaving={savingSection === 'security'}
                onPasswordUpdate={handlePasswordUpdate}
                passwordState={passwordState}
              />
            )}
            {activeTab === 'notifications' && notificationsDraft && (
              <NotificationsTab
                notifications={notificationsDraft}
                onChange={handleNotificationsChange}
                onSave={handleSaveNotifications}
                isSaving={savingSection === 'notifications'}
              />
            )}
            {activeTab === 'integrations' && integrationsDraft && (
              <IntegrationsTab
                integrations={integrationsDraft}
                onChange={handleIntegrationsChange}
                onSave={handleSaveIntegrations}
                isSaving={savingSection === 'integrations'}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
interface ProfileTabProps {
  profile: ProfileSettings;
  onChange: (next: ProfileSettings) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ profile, onChange, onSave, isSaving }) => {
  const handleInputChange = (field: keyof ProfileSettings) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({
      ...profile,
      [field]: event.target.value,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Information</h2>
        <p className="text-gray-600 mb-6">Update your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <User size={20} className="text-gray-600" />
            Personal Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={handleInputChange('fullName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={handleInputChange('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={handleInputChange('phone')}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Camera size={20} className="text-gray-600" />
            Profile Picture
          </h3>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              <Button variant="primary" size="sm" disabled>
                Upload New Photo
              </Button>
              <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size 5MB.</p>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Globe size={20} className="text-gray-600" />
              Preferences
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={profile.timezone}
                onChange={handleInputChange('timezone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={profile.language}
                onChange={handleInputChange('language')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            Beta Development
          </div>
          <Button variant="primary" onClick={onSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
interface SecurityTabProps {
  security: SecuritySettings;
  onChange: (next: SecuritySettings) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  onPasswordUpdate: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  passwordState: PasswordState;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  security,
  onChange,
  onSave,
  isSaving,
  onPasswordUpdate,
  passwordState,
}) => {
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  useEffect(() => {
    if (passwordState.status === 'success') {
      setPasswordForm({ current: '', next: '', confirm: '' });
    }
  }, [passwordState.status]);

  const handlePasswordFieldChange = (field: 'current' | 'next' | 'confirm') => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePasswordSubmit = async () => {
    try {
      await onPasswordUpdate({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
        confirmPassword: passwordForm.confirm,
      });
    } catch (error) {
      // handled through passwordState feedback
    }
  };

  const toggleTwoFactor = () => {
    onChange({
      ...security,
      smsTwoFactorEnabled: !security.smsTwoFactorEnabled,
    });
  };

  const toggleBackupCodes = () => {
    onChange({
      ...security,
      backupCodesGenerated: !security.backupCodesGenerated,
    });
  };

  const regenerateKey = (type: 'production' | 'development') => {
    onChange({
      ...security,
      apiKeys: {
        ...security.apiKeys,
        [type]: generateApiKey(type),
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Security & Privacy</h2>
        <p className="text-gray-600 mb-6">Manage your security settings and privacy preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Key size={20} className="text-gray-600" />
            Password Management
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={handlePasswordFieldChange('current')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.next}
                onChange={handlePasswordFieldChange('next')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={handlePasswordFieldChange('confirm')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="new-password"
              />
            </div>

            <Button
              variant="primary"
              onClick={handlePasswordSubmit}
              isLoading={passwordState.status === 'saving'}
              disabled={passwordState.status === 'saving'}
            >
              Update Password
            </Button>

            {passwordState.status !== 'idle' && passwordState.message && (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  passwordState.status === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {passwordState.message}
              </div>
            )}
          </div>

          <div className="pt-4 space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Smartphone size={18} className="text-gray-600" />
              Two-Factor Authentication
            </h4>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">SMS Authentication</p>
                <p className="text-sm text-gray-600">
                  {security.smsTwoFactorEnabled ? 'Enabled for your account' : 'Protect your account with SMS codes'}
                </p>
              </div>
              <Button variant={security.smsTwoFactorEnabled ? 'outline' : 'primary'} size="sm" onClick={toggleTwoFactor}>
                {security.smsTwoFactorEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Backup Codes</p>
                <p className="text-sm text-gray-600">
                  {security.backupCodesGenerated
                    ? 'Backup codes were generated for this account'
                    : 'Generate backup codes as a fallback'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleBackupCodes}>
                {security.backupCodesGenerated ? 'Invalidate' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Key size={20} className="text-gray-600" />
            API Keys
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Production API Key</p>
                <p className="text-sm text-gray-600">{maskApiKey(security.apiKeys.production)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => regenerateKey('production')}>
                Regenerate
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Development API Key</p>
                <p className="text-sm text-gray-600">{maskApiKey(security.apiKeys.development)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => regenerateKey('development')}>
                Regenerate
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Login History</h4>
            <div className="space-y-2">
              {security.loginHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.location}</p>
                    <p className="text-xs text-gray-600">
                      {formatTimestamp(entry.timestamp)} · {entry.device}
                    </p>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      entry.status === 'active'
                        ? 'bg-green-500'
                        : entry.status === 'inactive'
                        ? 'bg-gray-400'
                        : 'bg-yellow-500'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">Beta Development</div>
          <Button variant="primary" onClick={onSave} isLoading={isSaving}>
            Save Security Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
interface NotificationsTabProps {
  notifications: NotificationSettings;
  onChange: (next: NotificationSettings) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications, onChange, onSave, isSaving }) => {
  const toggleSetting = (field: keyof NotificationSettings) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({
      ...notifications,
      [field]: event.target.checked,
    });
  };

  const toggleQuietHours = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...notifications,
      quietHours: {
        ...notifications.quietHours,
        enabled: event.target.checked,
      },
    });
  };

  const handleQuietHourChange = (field: 'start' | 'end') => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({
      ...notifications,
      quietHours: {
        ...notifications.quietHours,
        [field]: event.target.value,
      },
    });
  };

  const handleFrequencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...notifications,
      frequency: event.target.value as NotificationSettings['frequency'],
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600 mb-6">Configure how and when you receive notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Mail size={20} className="text-gray-600" />
            Email Notifications
          </h3>

          <div className="space-y-4">
            <NotificationToggle
              title="Account Updates"
              description="Security alerts and account changes"
              checked={notifications.accountUpdates}
              onChange={toggleSetting('accountUpdates')}
            />
            <NotificationToggle
              title="Product Updates"
              description="New features and improvements"
              checked={notifications.productUpdates}
              onChange={toggleSetting('productUpdates')}
            />
            <NotificationToggle
              title="Marketing Emails"
              description="Tips, tutorials, and promotions"
              checked={notifications.marketingEmails}
              onChange={toggleSetting('marketingEmails')}
            />
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users size={18} className="text-gray-600" />
              Team Updates
            </h4>
            <div className="space-y-3">
              <NotificationToggle
                title="Member Activity"
                description="When team members join or leave"
                checked={notifications.teamMemberActivity}
                onChange={toggleSetting('teamMemberActivity')}
              />
              <NotificationToggle
                title="Project Changes"
                description="Updates to shared projects"
                checked={notifications.projectChanges}
                onChange={toggleSetting('projectChanges')}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <AlertCircle size={20} className="text-gray-600" />
            System Notifications
          </h3>

          <div className="space-y-4">
            <NotificationToggle
              title="Processing Alerts"
              description="When your data processing completes"
              checked={notifications.processingAlerts}
              onChange={toggleSetting('processingAlerts')}
            />
            <NotificationToggle
              title="Error Notifications"
              description="System errors and failures"
              checked={notifications.errorNotifications}
              onChange={toggleSetting('errorNotifications')}
            />
            <NotificationToggle
              title="Maintenance Alerts"
              description="Scheduled maintenance windows"
              checked={notifications.maintenanceAlerts}
              onChange={toggleSetting('maintenanceAlerts')}
            />
          </div>

          <div className="pt-4 space-y-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Notification Frequency</h4>
              <select
                value={notifications.frequency}
                onChange={handleFrequencyChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {notificationFrequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-medium text-gray-900">Enable Quiet Hours</h4>
                  <p className="text-sm text-gray-600">Pause notifications during downtime</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.quietHours.enabled}
                  onChange={toggleQuietHours}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={notifications.quietHours.start}
                    onChange={handleQuietHourChange('start')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!notifications.quietHours.enabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={notifications.quietHours.end}
                    onChange={handleQuietHourChange('end')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!notifications.quietHours.enabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">Beta Development</div>
          <Button variant="primary" onClick={onSave} isLoading={isSaving}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

interface NotificationToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ title, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
    />
  </div>
);
interface IntegrationsTabProps {
  integrations: IntegrationSettings;
  onChange: (next: IntegrationSettings) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ integrations, onChange, onSave, isSaving }) => {
  const toggleIntegration = (key: keyof Pick<IntegrationSettings, 'slackConnected' | 'teamsConnected' | 'zapierConnected'>) => () => {
    onChange({
      ...integrations,
      [key]: !integrations[key],
    });
  };

  const updateWebhook = (webhookId: string, updates: Partial<WebhookConfig>) => {
    onChange({
      ...integrations,
      webhookConfigs: integrations.webhookConfigs.map((config) =>
        config.id === webhookId ? { ...config, ...updates } : config,
      ),
    });
  };

  const deleteWebhook = (webhookId: string) => {
    onChange({
      ...integrations,
      webhookConfigs: integrations.webhookConfigs.filter((config) => config.id !== webhookId),
    });
  };

  const addWebhook = () => {
    const name = window.prompt('Webhook name');
    if (!name) return;
    const url = window.prompt('Webhook URL');
    if (!url) return;

    const newWebhook: WebhookConfig = {
      id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name,
      url,
      status: 'inactive',
    };

    onChange({
      ...integrations,
      webhookConfigs: [...integrations.webhookConfigs, newWebhook],
    });
  };

  const toggleRetry = () => {
    onChange({
      ...integrations,
      retryFailedRequests: !integrations.retryFailedRequests,
    });
  };

  const toggleSignatures = () => {
    onChange({
      ...integrations,
      includeSignatures: !integrations.includeSignatures,
    });
  };

  const renderWebhookStatus = (status: WebhookConfig['status']) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Active</span>;
      case 'warning':
        return <span className="inline-flex items-center text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Warning</span>;
      default:
        return <span className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">Inactive</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h2>
        <p className="text-gray-600 mb-6">Connect Parscade with your favorite tools and services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <SettingsIcon size={20} className="text-gray-600" />
            API Integrations
          </h3>

          <IntegrationRow
            name="Slack"
            description="Send notifications to your team"
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            icon={<SettingsIcon size={20} />}
            isConnected={integrations.slackConnected}
            onToggle={toggleIntegration('slackConnected')}
          />

          <IntegrationRow
            name="Microsoft Teams"
            description="Collaborate with your team"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            icon={<Mail size={20} />}
            isConnected={integrations.teamsConnected}
            onToggle={toggleIntegration('teamsConnected')}
          />

          <IntegrationRow
            name="Zapier"
            description="Automate workflows"
            iconBg="bg-green-100"
            iconColor="text-green-600"
            icon={<Webhook size={20} />}
            isConnected={integrations.zapierConnected}
            onToggle={toggleIntegration('zapierConnected')}
          />
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Webhook size={20} className="text-gray-600" />
            Webhook Configurations
          </h3>

          <div className="space-y-4">
            {integrations.webhookConfigs.map((webhook) => (
              <div key={webhook.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{webhook.name}</p>
                    <p className="text-sm text-gray-600 break-all">{webhook.url}</p>
                  </div>
                  {renderWebhookStatus(webhook.status)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const nextUrl = window.prompt('Update webhook URL', webhook.url);
                      if (nextUrl) {
                        updateWebhook(webhook.id, { url: nextUrl, status: 'active' });
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteWebhook(webhook.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addWebhook}>
              Add New Webhook
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Retry Failed Requests</p>
                <p className="text-sm text-gray-600">Automatically retry up to 3 times</p>
              </div>
              <input
                type="checkbox"
                checked={integrations.retryFailedRequests}
                onChange={toggleRetry}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Include Signatures</p>
                <p className="text-sm text-gray-600">Sign requests with HMAC-SHA256</p>
              </div>
              <input
                type="checkbox"
                checked={integrations.includeSignatures}
                onChange={toggleSignatures}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">Beta Development</div>
          <Button variant="primary" onClick={onSave} isLoading={isSaving}>
            Save Integration Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

interface IntegrationRowProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  isConnected: boolean;
  onToggle: () => void;
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({
  name,
  description,
  icon,
  iconBg,
  iconColor,
  isConnected,
  onToggle,
}) => (
  <div
    className={`flex items-center justify-between p-4 border rounded-lg ${
      isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    <Button variant={isConnected ? 'danger' : 'outline'} size="sm" onClick={onToggle}>
      {isConnected ? 'Disconnect' : 'Connect'}
    </Button>
  </div>
);

export default AccountSettings;

