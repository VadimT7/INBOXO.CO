import { useState, useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  User, Mail, Shield, Bell, Settings, Zap, Crown, Download, Upload,
  Eye, EyeOff, Key, Trash2, RefreshCw, Save, AlertTriangle, CheckCircle,
  Smartphone, Globe, Clock, Bot, Users, CreditCard, Database, Webhook,
  Filter, MessageSquare, Target, Calendar, Palette, Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface UserSettings {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  theme?: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newLeads: boolean;
    hotLeads: boolean;
    weeklyReport: boolean;
  };
  leadClassification: {
    autoClassify: boolean;
    hotKeywords: string[];
    warmKeywords: string[];
    coldKeywords: string[];
    urgencyThreshold: number;
  };
  gmailIntegration: {
    isConnected: boolean;
    syncFrequency: string;
    autoRespond: boolean;
    responseTemplates: boolean;
    folders: string[];
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    ipRestriction: boolean;
    allowedIPs: string[];
  };
  privacy: {
    dataRetention: number;
    analyticsTracking: boolean;
    shareData: boolean;
  };
}

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadSettings();
    }
  }, [authLoading, user]);

  const loadSettings = async () => {
    try {
      // Default settings template
      const defaultSettings: UserSettings = {
        id: user?.id || '',
        email: user?.email || '',
        full_name: '',
        company: '',
        phone: '',
        timezone: 'UTC',
        language: 'en',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
          newLeads: true,
          hotLeads: true,
          weeklyReport: true,
        },
        leadClassification: {
          autoClassify: true,
          hotKeywords: ['urgent', 'asap', 'immediate', 'budget', 'ready'],
          warmKeywords: ['interested', 'question', 'inquiry', 'information'],
          coldKeywords: ['maybe', 'future', 'considering', 'thinking'],
          urgencyThreshold: 70,
        },
        gmailIntegration: {
          isConnected: false,
          syncFrequency: '15min',
          autoRespond: false,
          responseTemplates: true,
          folders: ['inbox'],
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 480, // 8 hours
          ipRestriction: false,
          allowedIPs: [],
        },
        privacy: {
          dataRetention: 365, // 1 year
          analyticsTracking: true,
          shareData: false,
        },
      };

      // Try to load existing settings from Supabase
      const { data, error } = await supabase
        .from('user_settings' as any)
        .select('settings')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
        setSettings(defaultSettings);
      } else if (data) {
        // If settings exist, merge them with default settings to ensure all fields exist
        const userSettings = (data as any).settings;
        setSettings({
          ...defaultSettings,
          ...userSettings,
        });
      } else {
        // If no settings exist, use default settings
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      // Save settings to Supabase
      const { error } = await supabase
        .from('user_settings' as any)
        .upsert({
          user_id: user?.id,
          settings: settings as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    if (!settings) return;

    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setSettings(newSettings);
  };

  const addKeyword = (type: 'hot' | 'warm' | 'cold', keyword: string) => {
    if (!keyword.trim() || !settings) return;
    
    const currentKeywords = settings.leadClassification[`${type}Keywords`];
    if (!currentKeywords.includes(keyword.toLowerCase())) {
      updateSettings(`leadClassification.${type}Keywords`, [...currentKeywords, keyword.toLowerCase()]);
    }
  };

  const removeKeyword = (type: 'hot' | 'warm' | 'cold', keyword: string) => {
    if (!settings) return;
    
    const currentKeywords = settings.leadClassification[`${type}Keywords`];
    updateSettings(`leadClassification.${type}Keywords`, currentKeywords.filter(k => k !== keyword));
  };

  const connectGmail = async () => {
    try {
      // In a real app, this would initiate OAuth flow
      updateSettings('gmailIntegration.isConnected', true);
      toast.success('Gmail connected successfully');
    } catch (error) {
      toast.error('Failed to connect Gmail');
    }
  };

  const disconnectGmail = async () => {
    try {
      updateSettings('gmailIntegration.isConnected', false);
      toast.success('Gmail disconnected');
    } catch (error) {
      toast.error('Failed to disconnect Gmail');
    }
  };

  const deleteAccount = async () => {
    try {
      // In a real app, this would delete the user account
      toast.success('Account deletion initiated. You will receive a confirmation email.');
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 p-6 sm:p-10 lg:p-16 text-[1.08rem] md:text-base">
      <div className="max-w-[95vw] mx-auto mt-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-slate-600 mt-2">Manage your account and application preferences</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={saveSettings} 
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => updateSettings('email', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={settings.full_name || ''}
                        onChange={(e) => updateSettings('full_name', e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={settings.company || ''}
                        onChange={(e) => updateSettings('company', e.target.value)}
                        placeholder="Enter your company name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={settings.phone || ''}
                        onChange={(e) => updateSettings('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={settings.timezone} onValueChange={(value) => updateSettings('timezone', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="CST">Central Time</SelectItem>
                          <SelectItem value="MST">Mountain Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={settings.language} onValueChange={(value) => updateSettings('language', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={settings.theme} onValueChange={(value) => updateSettings('theme', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-slate-600">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateSettings('notifications.email', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <p className="text-sm text-slate-600">Browser push notifications</p>
                      </div>
                      <Switch
                        id="pushNotifications"
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) => updateSettings('notifications.push', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-slate-600">Text message alerts for urgent leads</p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) => updateSettings('notifications.sms', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="newLeads">New Leads</Label>
                        <p className="text-sm text-slate-600">Notify when new leads arrive</p>
                      </div>
                      <Switch
                        id="newLeads"
                        checked={settings.notifications.newLeads}
                        onCheckedChange={(checked) => updateSettings('notifications.newLeads', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="hotLeads">Hot Leads</Label>
                        <p className="text-sm text-slate-600">Immediate alerts for high-priority leads</p>
                      </div>
                      <Switch
                        id="hotLeads"
                        checked={settings.notifications.hotLeads}
                        onCheckedChange={(checked) => updateSettings('notifications.hotLeads', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weeklyReport">Weekly Reports</Label>
                        <p className="text-sm text-slate-600">Weekly performance summaries</p>
                      </div>
                      <Switch
                        id="weeklyReport"
                        checked={settings.notifications.weeklyReport}
                        onCheckedChange={(checked) => updateSettings('notifications.weeklyReport', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      id="twoFactor"
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(checked) => updateSettings('security.twoFactorEnabled', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSettings('security.sessionTimeout', parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Automatically log out after {settings.security.sessionTimeout} minutes of inactivity
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ipRestriction">IP Restriction</Label>
                      <p className="text-sm text-slate-600">Limit access to specific IP addresses</p>
                    </div>
                    <Switch
                      id="ipRestriction"
                      checked={settings.security.ipRestriction}
                      onCheckedChange={(checked) => updateSettings('security.ipRestriction', checked)}
                    />
                  </div>

                  {settings.security.ipRestriction && (
                    <div>
                      <Label htmlFor="allowedIPs">Allowed IP Addresses</Label>
                      <Textarea
                        id="allowedIPs"
                        placeholder="Enter IP addresses, one per line"
                        value={settings.security.allowedIPs.join('\n')}
                        onChange={(e) => updateSettings('security.allowedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Password & Recovery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Recovery Codes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Privacy & Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dataRetention">Data Retention (days)</Label>
                    <Select 
                      value={settings.privacy.dataRetention.toString()} 
                      onValueChange={(value) => updateSettings('privacy.dataRetention', parseInt(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="1095">3 years</SelectItem>
                        <SelectItem value="-1">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-600 mt-1">
                      How long to keep your lead data before automatic deletion
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="analyticsTracking">Analytics Tracking</Label>
                      <p className="text-sm text-slate-600">Help improve InboxFlow with usage analytics</p>
                    </div>
                    <Switch
                      id="analyticsTracking"
                      checked={settings.privacy.analyticsTracking}
                      onCheckedChange={(checked) => updateSettings('privacy.analyticsTracking', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="shareData">Share Data</Label>
                      <p className="text-sm text-slate-600">Share anonymized data for research</p>
                    </div>
                    <Switch
                      id="shareData"
                      checked={settings.privacy.shareData}
                      onCheckedChange={(checked) => updateSettings('privacy.shareData', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Data Export & Import
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Webhook className="h-5 w-5 mr-2" />
                    API & Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="apiKey"
                        type={showPassword ? "text" : "password"}
                        value="sk-1234567890abcdef"
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Keep your API key secure. It provides full access to your account data.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2" />
                    Subscription & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Manage Subscription</p>
                      <p className="text-sm text-slate-600">View and manage your billing, subscription, and usage</p>
                    </div>
                    <Button 
                      onClick={() => navigate('/billing')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Billing
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      These actions are irreversible. Please proceed with caution.
                    </AlertDescription>
                  </Alert>

                  <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteAccount}>
                          Yes, delete my account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage; 