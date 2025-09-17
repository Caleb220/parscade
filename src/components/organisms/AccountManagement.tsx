import React, { useState } from 'react';
import { User, Shield, Bell, Settings, ChevronRight, Camera, Globe, Key, Smartphone, Mail, Users, AlertCircle, Webhook } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const tabs: TabProps[] = [
  { id: 'profile', label: 'Profile Information', icon: <User size={20} /> },
  { id: 'security', label: 'Security & Privacy', icon: <Shield size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'integrations', label: 'Integrations', icon: <Settings size={20} /> },
];

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tab Navigation */}
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

      {/* Tab Content */}
      <div className="p-4 sm:p-8">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Information</h2>
        <p className="text-gray-600 mb-6">Update your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
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
                defaultValue="Caleb West"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                defaultValue="calebwest.personal@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Profile Picture & Preferences */}
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Upload New Photo
              </button>
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
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Pacific Standard Time (PST)</option>
                <option>Eastern Standard Time (EST)</option>
                <option>Central Standard Time (CST)</option>
                <option>Mountain Standard Time (MST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Spanish</option>
                <option>French</option>
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
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Security & Privacy</h2>
        <p className="text-gray-600 mb-6">Manage your security settings and privacy preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Password Management */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Update Password
            </button>
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Smartphone size={18} className="text-gray-600" />
              Two-Factor Authentication
            </h4>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">SMS Authentication</p>
                <p className="text-sm text-gray-600">Protect your account with SMS codes</p>
              </div>
              <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Setup
              </button>
            </div>
          </div>
        </div>

        {/* API Keys & Login History */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Key size={20} className="text-gray-600" />
            API Keys
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Production API Key</p>
                <p className="text-sm text-gray-600">pk_prod_••••••••••••4f8a</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700">
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Development API Key</p>
                <p className="text-sm text-gray-600">pk_dev_••••••••••••7c2b</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700">
                <ChevronRight size={20} />
              </button>
            </div>

            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Generate New API Key
            </button>
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Login History</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">San Francisco, CA</p>
                  <p className="text-xs text-gray-600">2 hours ago • Chrome</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Los Angeles, CA</p>
                  <p className="text-xs text-gray-600">1 day ago • Safari</p>
                </div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">
          Beta Development
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600 mb-6">Configure how and when you receive notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Notifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Mail size={20} className="text-gray-600" />
            Email Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Account Updates</p>
                <p className="text-sm text-gray-600">Security alerts and account changes</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Product Updates</p>
                <p className="text-sm text-gray-600">New features and improvements</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-600">Tips, tutorials, and promotions</p>
              </div>
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users size={18} className="text-gray-600" />
              Team Updates
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Member Activity</p>
                  <p className="text-sm text-gray-600">When team members join or leave</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Project Changes</p>
                  <p className="text-sm text-gray-600">Updates to shared projects</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* System Notifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <AlertCircle size={20} className="text-gray-600" />
            System Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Processing Alerts</p>
                <p className="text-sm text-gray-600">When your data processing completes</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Error Notifications</p>
                <p className="text-sm text-gray-600">System errors and failures</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Maintenance Alerts</p>
                <p className="text-sm text-gray-600">Scheduled maintenance windows</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Notification Frequency</h4>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Real-time</option>
              <option>Daily digest</option>
              <option>Weekly summary</option>
              <option>Monthly report</option>
            </select>
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Quiet Hours</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input type="time" defaultValue="22:00" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input type="time" defaultValue="08:00" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            Beta Development
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h2>
        <p className="text-gray-600 mb-6">Connect Parscade with your favorite tools and services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Integrations */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-gray-600" />
            API Integrations
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Slack</p>
                  <p className="text-sm text-gray-600">Send notifications to your team</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Connect
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Microsoft Teams</p>
                  <p className="text-sm text-gray-600">Collaborate with your team</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Connect
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Webhook size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Zapier</p>
                  <p className="text-sm text-gray-600">Connected • Automate workflows</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Configurations */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Webhook size={20} className="text-gray-600" />
            Webhook Configurations
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-gray-900">Data Processing Complete</p>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600 mb-2">https://your-app.com/webhooks/complete</p>
              <div className="flex gap-2">
                <button className="text-blue-600 text-sm hover:text-blue-700">Edit</button>
                <button className="text-red-600 text-sm hover:text-red-700">Delete</button>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-gray-900">Error Notifications</p>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600 mb-2">https://your-app.com/webhooks/errors</p>
              <div className="flex gap-2">
                <button className="text-blue-600 text-sm hover:text-blue-700">Edit</button>
                <button className="text-red-600 text-sm hover:text-red-700">Delete</button>
              </div>
            </div>

            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Add New Webhook
            </button>
          </div>

          <div className="pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Webhook Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Retry Failed Requests</p>
                  <p className="text-sm text-gray-600">Automatically retry up to 3 times</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Include Signatures</p>
                  <p className="text-sm text-gray-600">Sign requests with HMAC-SHA256</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">
          Beta Development
        </div>
      </div>
    </div>
  );
}