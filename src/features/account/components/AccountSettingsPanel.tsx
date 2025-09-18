
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Camera,
  Pencil,
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
import Button from '../../../components/atoms/Button';
import LoadingSpinner from '../../../components/atoms/LoadingSpinner';
import { useAuth } from '../../../features/auth';
import { supabase } from '../../../lib/supabase';
import { useAccountSettings } from '../hooks/useAccountSettings';
import { validatePassword as evaluatePasswordStrength } from '../../../utils/passwordValidation';
import {
  AccountSettingsSection,
  IntegrationSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  WebhookConfig,
} from '../../../schemas/account/accountSettings';
import { formatErrorForUser } from '../../../utils/zodError';

interface TabProps {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

type TabId = AccountSettingsSection;

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

type ProfileFieldKey = 'fullName' | 'email' | 'phone' | 'timezone' | 'language';
type ProfileValidationErrors = Partial<Record<ProfileFieldKey, string>>;

const profileFieldOrder: ProfileFieldKey[] = ['fullName', 'email', 'phone', 'timezone', 'language'];

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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fullNamePattern = /^[A-Za-z][A-Za-z .'-]{1,99}$/;
const phoneAllowedPattern = /^\+?[0-9 ()\-.]+$/;

const validateProfileFieldValue = (profile: ProfileSettings, field: ProfileFieldKey): string | undefined => {
  switch (field) {
    case 'fullName': {
      const value = profile.fullName?.trim() ?? '';
      if (!value) {
        return 'Full name is required.';
      }
      if (value.length < 2 || value.length > 100) {
        return 'Full name must be between 2 and 100 characters.';
      }
      if (!fullNamePattern.test(value)) {
        return 'Full name can include letters, spaces, apostrophes, periods, and hyphens only.';
      }
      return undefined;
    }
    case 'email': {
      const value = profile.email?.trim() ?? '';
      if (!value) {
        return 'Email address is required.';
      }
      if (value.length > 254) {
        return 'Email address is too long.';
      }
      if (!emailPattern.test(value)) {
        return 'Enter a valid email address.';
      }
      return undefined;
    }
    case 'phone': {
      const value = profile.phone?.trim() ?? '';
      if (!value) {
        return undefined;
      }
      if (!phoneAllowedPattern.test(value)) {
        return 'Phone number can include digits, spaces, parentheses, plus, periods, and hyphens only.';
      }
      const digits = value.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        return 'Enter a valid international phone number with country code.';
      }
      return undefined;
    }
    case 'timezone':
      return profile.timezone ? undefined : 'Select a timezone.';
    case 'language':
      return profile.language ? undefined : 'Select a language preference.';
    default:
      return undefined;
  }
};

const collectProfileErrors = (profile: ProfileSettings): ProfileValidationErrors => {
  return profileFieldOrder.reduce<ProfileValidationErrors>((acc, field) => {
    const error = validateProfileFieldValue(profile, field);
    if (error) {
      acc[field] = error;
    }
    return acc;
  }, {});
};

const applyProfileFieldError = (
  current: ProfileValidationErrors,
  field: ProfileFieldKey,
  error?: string,
): ProfileValidationErrors => {
  if (error) {
    if (current[field] === error) {
      return current;
    }
    return { ...current, [field]: error };
  }

  if (current[field]) {
    const { [field]: _removed, ...rest } = current;
    return rest;
  }

  return current;
};

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

const AccountSettingsPanel: React.FC = () => {
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
  const [profileErrors, setProfileErrors] = useState<ProfileValidationErrors>({});
  const [securityDraft, setSecurityDraft] = useState<SecuritySettings | null>(null);
  const [notificationsDraft, setNotificationsDraft] = useState<NotificationSettings | null>(null);
  const [integrationsDraft, setIntegrationsDraft] = useState<IntegrationSettings | null>(null);

  useEffect(() => {
    if (!settings) return;
    setProfileDraft(cloneProfile(settings.profile));
    setProfileErrors({});
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

  const handleProfileChange = (field: ProfileFieldKey, value: string) => {
    if (!profileDraft) return;
    const next = { ...profileDraft, [field]: value };
    setProfileDraft(cloneProfile(next));
    setProfileErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const fieldError = validateProfileFieldValue(next, field);
      return applyProfileFieldError(prev, field, fieldError);
    });
  };

  const handleProfileFieldBlur = (field: ProfileFieldKey) => {
    if (!profileDraft) return;
    const fieldError = validateProfileFieldValue(profileDraft, field);
    setProfileErrors((prev) => applyProfileFieldError(prev, field, fieldError));
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

    const errors = collectProfileErrors(profileDraft);
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      setFeedback({ type: 'error', message: 'Please resolve the highlighted fields before saving.' });
      return;
    }

    try {
      const updated = await saveProfile(profileDraft);
      setProfileDraft(cloneProfile(updated.profile));
      setProfileErrors({});
      setFeedback({ type: 'success', message: 'Profile information updated successfully.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: formatErrorForUser(saveError, 'Failed to update profile.') });
    }
  };

  const handleSaveSecurity = async () => {
    if (!securityDraft) return;
    try {
      const updated = await saveSecurity(securityDraft);
      setSecurityDraft(cloneSecurity(updated.security));
      setFeedback({ type: 'success', message: 'Security settings saved.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: formatErrorForUser(saveError, 'Failed to update security settings.') });
    }
  };

  const handleSaveNotifications = async () => {
    if (!notificationsDraft) return;
    try {
      const updated = await saveNotifications(notificationsDraft);
      setNotificationsDraft(cloneNotifications(updated.notifications));
      setFeedback({ type: 'success', message: 'Notification preferences saved.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: formatErrorForUser(saveError, 'Failed to update notifications.') });
    }
  };

  const handleSaveIntegrations = async () => {
    if (!integrationsDraft) return;
    try {
      const updated = await saveIntegrations(integrationsDraft);
      setIntegrationsDraft(cloneIntegrations(updated.integrations));
      setFeedback({ type: 'success', message: 'Integration settings saved.' });
    } catch (saveError) {
      setFeedback({ type: 'error', message: formatErrorForUser(saveError, 'Failed to update integrations.') });
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

    const currentPassword = payload.currentPassword ?? '';
    const newPassword = payload.newPassword ?? '';
    const confirmPassword = payload.confirmPassword ?? '';

    if (!currentPassword.trim()) {
      setPasswordState({ status: 'error', message: 'Please enter your current password.' });
      throw new Error('Missing current password.');
    }

    if (!newPassword.trim()) {
      setPasswordState({ status: 'error', message: 'Please enter a new password.' });
      throw new Error('Missing new password.');
    }

    if (!confirmPassword.trim()) {
      setPasswordState({ status: 'error', message: 'Please confirm your new password.' });
      throw new Error('Missing password confirmation.');
    }

    if (newPassword !== confirmPassword) {
      setPasswordState({ status: 'error', message: 'New passwords do not match.' });
      throw new Error('Password confirmation mismatch.');
    }

    if (newPassword === currentPassword) {
      setPasswordState({ status: 'error', message: 'New password must be different from your current password.' });
      throw new Error('Password reuse detected.');
    }

    const passwordAssessment = evaluatePasswordStrength(newPassword);
    if (!passwordAssessment.isValid) {
      const detail = passwordAssessment.feedback.length
        ? ' ' + passwordAssessment.feedback.join('; ')
        : '';
      setPasswordState({
        status: 'error',
        message: `Password must meet our complexity requirements.${detail}`,
      });
      throw new Error('Password complexity validation failed.');
    }

    const emailLocalPart = user.email.split('@')[0]?.toLowerCase();
    if (emailLocalPart && newPassword.toLowerCase().includes(emailLocalPart)) {
      setPasswordState({ status: 'error', message: 'Password cannot include your email address.' });
      throw new Error('Password contains email identifier.');
    }

    if (/parscade/i.test(newPassword)) {
      setPasswordState({ status: 'error', message: 'Password cannot contain company names or easily guessable terms.' });
      throw new Error('Password contains blocked keyword.');
    }

    setPasswordState({ status: 'saving', message: 'Updating password...' });

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw signInError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
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
                errors={profileErrors}
                onChange={handleProfileChange}
                onFieldBlur={handleProfileFieldBlur}
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
  errors: ProfileValidationErrors;
  onChange: (field: ProfileFieldKey, value: string) => void;
  onFieldBlur: (field: ProfileFieldKey) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ profile, errors, onChange, onFieldBlur, onSave, isSaving }) => {
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);

  const getFieldClasses = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
      hasError
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
    }`;

  const handleInputChange = (field: ProfileFieldKey) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(field, event.target.value);
  };

  const handleBlur = (field: ProfileFieldKey) => () => {
    onFieldBlur(field);
  };

  const hasBlockingErrors = Object.keys(errors).length > 0;

  const fullNameError = errors.fullName;
  const emailError = errors.email;
  const phoneError = errors.phone;
  const timezoneError = errors.timezone;
  const languageError = errors.language;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Information</h2>
        <p className="text-gray-600 mb-6">Update your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User size={20} className="text-gray-600" />
              Personal Details
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingPersonal((v) => !v)}
              leftIcon={<Pencil className="h-4 w-4" />}
              aria-pressed={isEditingPersonal}
              title={isEditingPersonal ? 'Finish editing' : 'Edit personal details'}
            >
              {isEditingPersonal ? 'Done' : 'Edit'}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={handleInputChange('fullName')}
                onBlur={handleBlur('fullName')}
                className={`${getFieldClasses(!!fullNameError)} ${!isEditingPersonal ? 'bg-gray-50' : ''}`}
                disabled={!isEditingPersonal}
                placeholder="Your full name"
                aria-invalid={!!fullNameError}
                aria-describedby={fullNameError ? 'profile-full-name-error' : undefined}
                autoComplete="name"
              />
              {fullNameError && (
                <p id="profile-full-name-error" className="mt-1 text-sm text-red-600">
                  {fullNameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={handleInputChange('email')}
                onBlur={handleBlur('email')}
                className={`${getFieldClasses(!!emailError)} ${!isEditingPersonal ? 'bg-gray-50' : ''}`}
                disabled={!isEditingPersonal}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'profile-email-error' : undefined}
                autoComplete="email"
              />
              {emailError && (
                <p id="profile-email-error" className="mt-1 text-sm text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={handleInputChange('phone')}
                onBlur={handleBlur('phone')}
                placeholder="+1 (555) 123-4567"
                className={`${getFieldClasses(!!phoneError)} ${!isEditingPersonal ? 'bg-gray-50' : ''}`}
                disabled={!isEditingPersonal}
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? 'profile-phone-error' : undefined}
                autoComplete="tel"
              />
              {phoneError && (
                <p id="profile-phone-error" className="mt-1 text-sm text-red-600">
                  {phoneError}
                </p>
              )}
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
                onBlur={handleBlur('timezone')}
                className={getFieldClasses(!!timezoneError)}
                aria-invalid={!!timezoneError}
                aria-describedby={timezoneError ? 'profile-timezone-error' : undefined}
              >
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
              {timezoneError && (
                <p id="profile-timezone-error" className="mt-1 text-sm text-red-600">
                  {timezoneError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={profile.language}
                onChange={handleInputChange('language')}
                onBlur={handleBlur('language')}
                className={getFieldClasses(!!languageError)}
                aria-invalid={!!languageError}
                aria-describedby={languageError ? 'profile-language-error' : undefined}
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              {languageError && (
                <p id="profile-language-error" className="mt-1 text-sm text-red-600">
                  {languageError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            Beta Development
          </div>
          <Button
            variant="primary"
            onClick={onSave}
            isLoading={isSaving}
            disabled={isSaving || hasBlockingErrors}
            title={hasBlockingErrors ? 'Resolve validation issues before saving.' : undefined}
          >
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
      description: "",
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

export default AccountSettingsPanel;

