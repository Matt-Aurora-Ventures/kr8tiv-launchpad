'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Wallet,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Volume2,
  VolumeX,
  Mail,
  Smartphone,
  Trash2,
  Download,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch, Select, Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface Settings {
  // Display
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;

  // Notifications
  priceAlerts: boolean;
  tradeNotifications: boolean;
  stakingNotifications: boolean;
  marketingEmails: boolean;
  soundEnabled: boolean;

  // Privacy
  hideBalance: boolean;
  hidePortfolio: boolean;
  analyticsEnabled: boolean;

  // Trading
  defaultSlippage: number;
  confirmTrades: boolean;
  autoApprove: boolean;
}

export default function SettingsPage() {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    currency: 'USD',
    language: 'en',
    priceAlerts: true,
    tradeNotifications: true,
    stakingNotifications: true,
    marketingEmails: false,
    soundEnabled: true,
    hideBalance: false,
    hidePortfolio: false,
    analyticsEnabled: true,
    defaultSlippage: 1,
    confirmTrades: true,
    autoApprove: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({ type: 'success', title: 'Settings Saved', message: 'Your preferences have been updated' });
    } catch {
      toast({ type: 'error', title: 'Error', message: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    toast({ type: 'info', title: 'Export Started', message: 'Your data export will be ready shortly' });
  };

  const deleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast({ type: 'warning', title: 'Account Deletion', message: 'Please contact support to complete account deletion' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="space-y-8">
        {/* Display Settings */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Display
          </h2>

          <div className="space-y-4">
            <Select
              label="Theme"
              value={settings.theme}
              onChange={(v) => updateSetting('theme', v as Settings['theme'])}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />

            <Select
              label="Currency"
              value={settings.currency}
              onChange={(v) => updateSetting('currency', v)}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'SOL', label: 'SOL (◎)' },
              ]}
            />

            <Select
              label="Language"
              value={settings.language}
              onChange={(v) => updateSetting('language', v)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
                { value: 'zh', label: '中文' },
                { value: 'ja', label: '日本語' },
              ]}
            />
          </div>
        </section>

        {/* Notification Settings */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h2>

          <div className="space-y-4">
            <Switch
              label="Price Alerts"
              description="Get notified when your watched tokens hit target prices"
              checked={settings.priceAlerts}
              onChange={(e) => updateSetting('priceAlerts', e.target.checked)}
            />

            <Switch
              label="Trade Notifications"
              description="Receive notifications for your trades"
              checked={settings.tradeNotifications}
              onChange={(e) => updateSetting('tradeNotifications', e.target.checked)}
            />

            <Switch
              label="Staking Notifications"
              description="Updates about your staking rewards and unlocks"
              checked={settings.stakingNotifications}
              onChange={(e) => updateSetting('stakingNotifications', e.target.checked)}
            />

            <Switch
              label="Marketing Emails"
              description="Receive news and promotional content"
              checked={settings.marketingEmails}
              onChange={(e) => updateSetting('marketingEmails', e.target.checked)}
            />

            <Switch
              label="Sound Effects"
              description="Play sounds for notifications and trades"
              checked={settings.soundEnabled}
              onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
              labelPosition="left"
            />
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </h2>

          <div className="space-y-4">
            <Switch
              label="Hide Balance"
              description="Hide your wallet balance from view"
              checked={settings.hideBalance}
              onChange={(e) => updateSetting('hideBalance', e.target.checked)}
            />

            <Switch
              label="Hide Portfolio"
              description="Hide your token holdings from others"
              checked={settings.hidePortfolio}
              onChange={(e) => updateSetting('hidePortfolio', e.target.checked)}
            />

            <Switch
              label="Analytics"
              description="Allow anonymous usage analytics to improve the platform"
              checked={settings.analyticsEnabled}
              onChange={(e) => updateSetting('analyticsEnabled', e.target.checked)}
            />
          </div>
        </section>

        {/* Trading Settings */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Trading
          </h2>

          <div className="space-y-4">
            <Select
              label="Default Slippage"
              value={settings.defaultSlippage.toString()}
              onChange={(v) => updateSetting('defaultSlippage', parseFloat(v))}
              options={[
                { value: '0.5', label: '0.5%' },
                { value: '1', label: '1%' },
                { value: '2', label: '2%' },
                { value: '5', label: '5%' },
                { value: '10', label: '10%' },
              ]}
              hint="Maximum price slippage allowed for trades"
            />

            <Switch
              label="Confirm Trades"
              description="Show confirmation dialog before executing trades"
              checked={settings.confirmTrades}
              onChange={(e) => updateSetting('confirmTrades', e.target.checked)}
            />

            <Switch
              label="Auto-Approve Tokens"
              description="Automatically approve token spending (advanced)"
              checked={settings.autoApprove}
              onChange={(e) => updateSetting('autoApprove', e.target.checked)}
            />
          </div>
        </section>

        {/* Connected Wallet */}
        {connected && publicKey && (
          <section className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connected Wallet
            </h2>

            <div className="p-4 bg-secondary/50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-mono text-sm">{publicKey.toString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Solana Mainnet</p>
              </div>
              <a
                href={`https://solscan.io/account/${publicKey.toString()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-secondary rounded transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>
        )}

        {/* Data Management */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <p className="font-medium">Export Your Data</p>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your activity and preferences
                </p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div>
                <p className="font-medium text-red-500">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={deleteAccount}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </section>

        {/* Help & Support */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://docs.kr8tiv.io"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Documentation</p>
                <p className="text-xs text-muted-foreground">Learn how to use KR8TIV</p>
              </div>
            </a>

            <a
              href="mailto:support@kr8tiv.io"
              className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Contact Support</p>
                <p className="text-xs text-muted-foreground">Get help from our team</p>
              </div>
            </a>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
