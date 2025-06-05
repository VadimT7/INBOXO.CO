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
  Filter, MessageSquare, Target, Calendar, Palette, Monitor, DollarSign,
  TrendingUp, ArrowUpCircle, Pause, Check, BarChart3, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { deleteAccount } from '@/lib/stripe';
import {
  createCheckoutSession,
  fetchBillingHistory,
  cancelSubscription,
  createPortalSession,
  fetchPaymentMethods,
  fetchUsageData,
  PaymentMethod,
  SubscriptionDetails,
  UsageData
} from '@/lib/stripe';
import { EnterpriseContactDialog } from '@/components/pricing/EnterpriseContactDialog';

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

interface SubscriptionData {
  subscription_status: string;
  subscription_plan?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_ends_at?: string;
  subscription_created_at?: string;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoice_url?: string;
}

const plans = [
  {
    name: "Starter",
    price: "49",
    priceId: "price_1RUAFAR4VctRXueqTXYvL5w8",
    description: "Perfect for small teams and startups",
    features: [
      "Up to 1,000 leads per month",
      "Basic lead scoring",
      "Email templates",
      "Standard support",
      "1 team member"
    ],
    limits: {
      leads: 1000,
      api_calls: 5000,
      storage: 1,
      team_members: 1
    }
  },
  {
    name: "Professional",
    price: "99",
    priceId: "price_1RUAFPR4VctRXueqhOyOSFnq",
    description: "For growing businesses",
    features: [
      "Up to 10,000 leads per month",
      "Advanced lead scoring",
      "Custom email templates",
      "Priority support",
      "Up to 5 team members",
      "Analytics dashboard",
      "API access"
    ],
    limits: {
      leads: 10000,
      api_calls: 50000,
      storage: 10,
      team_members: 5
    }
  },
  {
    name: "Enterprise",
    price: "299",
    priceId: "price_1RUAHbR4VctRXueqklf7r7hi",
    description: "For large organizations",
    features: [
      "Unlimited leads",
      "AI-powered lead scoring",
      "Advanced automation",
      "24/7 premium support",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager"
    ],
    limits: {
      leads: -1, // unlimited
      api_calls: -1,
      storage: -1,
      team_members: -1
    }
  }
];

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [finalDeleteConfirmOpen, setFinalDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEnterpriseDialog, setShowEnterpriseDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadSettings();
      loadBillingData();
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

  const handleDeleteAccountConfirm = () => {
    setDeleteConfirmOpen(false);
    setFinalDeleteConfirmOpen(true);
  };

  const handleFinalDeleteAccount = async () => {
    if (deleteInput !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully. You will be signed out.');

      // Sign out the user
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setFinalDeleteConfirmOpen(false);
      setDeleteInput('');
    }
  };

  // Billing functions
  const loadBillingData = async () => {
    try {
      setBillingLoading(true);
      // Load all data in parallel
      const [profileResult, billingResult, usageResult, paymentResult] = await Promise.allSettled([
        // Load subscription data from profiles
        supabase
          .from('profiles')
          .select('subscription_status, subscription_plan, stripe_customer_id, stripe_subscription_id, trial_ends_at, subscription_created_at')
          .eq('id', user?.id)
          .single(),

        // Load billing history
        fetchBillingHistory(),

        // Load real usage data
        fetchUsageData(),

        // Load payment methods and subscription details
        fetchPaymentMethods()
      ]);

      // Handle profile data
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        const { data: profileData, error: profileError } = profileResult.value;
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching subscription data:', profileError);
          setSubscriptionData({ subscription_status: 'free' });
        } else if (profileData) {
          setSubscriptionData({
            subscription_status: profileData.subscription_status || 'free',
            subscription_plan: profileData.subscription_plan,
            stripe_customer_id: profileData.stripe_customer_id,
            stripe_subscription_id: profileData.stripe_subscription_id,
            trial_ends_at: profileData.trial_ends_at,
            subscription_created_at: profileData.subscription_created_at
          });
        } else {
          setSubscriptionData({ subscription_status: 'free' });
        }
      } else {
        setSubscriptionData({ subscription_status: 'free' });
      }

      // Handle billing history
      if (billingResult.status === 'fulfilled') {
        setBillingHistory(billingResult.value);
      } else {
        console.error('Error loading billing history:', billingResult.reason);
        setBillingHistory([]);
      }

      // Handle usage data
      if (usageResult.status === 'fulfilled') {
        setUsageData(usageResult.value);
      } else {
        console.error('Error loading usage data:', usageResult.reason);
        // Set minimal usage data
        setUsageData({
          leads_processed: 0,
          leads_limit: 100,
          api_calls: 0,
          api_limit: 1000,
          storage_used: 0,
          storage_limit: 0.5,
          ai_responses_generated: 0,
          emails_sent: 0
        });
      }

      // Handle payment methods and subscription details
      if (paymentResult.status === 'fulfilled') {
        const { payment_methods, subscription } = paymentResult.value;
        setPaymentMethods(payment_methods);
        setSubscriptionDetails(subscription);
      } else {
        console.error('Error loading payment methods:', paymentResult.reason);
        setPaymentMethods([]);
        setSubscriptionDetails(null);
      }

    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setBillingLoading(false);
    }
  };

  const getCurrentPlan = () => {
    const planName = subscriptionData?.subscription_plan || 'free';
    if (planName === 'free') {
      return { name: 'Free', price: '0', description: 'Basic features for getting started' };
    }
    return plans.find(plan => plan.name.toLowerCase() === planName.toLowerCase()) || plans[0];
  };

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (plan.name === 'Enterprise') {
      setShowEnterpriseDialog(true);
      return;
    }

    setUpgradeLoading(true);
    try {
      await createCheckoutSession(plan.priceId);
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      let errorMessage = 'Failed to start upgrade process';
      if (error.message?.includes('price')) {
        errorMessage = 'Invalid pricing plan selected. Please try again.';
      } else if (error.message?.includes('customer')) {
        errorMessage = 'Failed to set up billing account. Please try again.';
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = 'Please log in again to continue.';
      }
      toast.error(errorMessage);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      toast.success('Subscription cancelled successfully');
      setShowCancelDialog(false);
      await loadBillingData(); // Refresh data
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      let errorMessage = 'Failed to cancel subscription';
      if (error.message?.includes('not found')) {
        errorMessage = 'No active subscription found to cancel.';
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = 'Please log in again to continue.';
      }
      toast.error(errorMessage);
    }
  };

  const handleManagePaymentMethod = async () => {
    try {
      toast.loading('Opening payment management...', { id: 'portal-loading' });
      await createPortalSession();
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.dismiss('portal-loading');
      let errorMessage = 'Failed to open payment management';
      if (error.message?.includes('customer')) {
        errorMessage = 'Setting up billing account... Please try again in a moment.';
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = 'Please log in again to continue.';
      } else if (error.message?.includes('portal')) {
        errorMessage = 'Payment portal is temporarily unavailable. Please try again later.';
      }
      toast.error(errorMessage);
    }
  };

  const handleDownloadInvoice = (invoiceUrl: string) => {
    if (invoiceUrl && invoiceUrl !== '#') {
      window.open(invoiceUrl, '_blank');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'past_due':
        return 'destructive';
      case 'canceled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
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

            {/* Subscription */}
            <TabsContent value="subscription" className="space-y-6">
              {subscriptionData && usageData ? (
                <>
                  {/* Current Plan */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Crown className="h-5 w-5 mr-2" />
                          Current Plan
                        </div>
                        <Badge variant={getStatusBadgeVariant(subscriptionData?.subscription_status || 'free')}>
                          {subscriptionData?.subscription_status || 'Free'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div>
                          <h3 className="text-2xl font-bold">{getCurrentPlan().name}</h3>
                          <p className="text-slate-600">${getCurrentPlan().price}/month</p>
                          <p className="text-sm text-slate-500 mt-1">{getCurrentPlan().description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">${getCurrentPlan().price}</div>
                          <div className="text-sm text-slate-500">per month</div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          disabled={upgradeLoading}
                          onClick={() => {
                            // Scroll to the plans section
                            document.getElementById('available-plans')?.scrollIntoView({
                              behavior: 'smooth'
                            });
                          }}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          {upgradeLoading ? 'Processing...' : 'Upgrade Plan'}
                        </Button>

                        {subscriptionData?.subscription_status === 'active' && (
                          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                            <DialogTrigger asChild>
                              <Button variant="outline">
                                <Pause className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Cancel Subscription</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                                  Keep Subscription
                                </Button>
                                <Button variant="destructive" onClick={handleCancelSubscription}>
                                  Yes, Cancel
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Usage & Billing */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Usage & Limits */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center">
                              <BarChart3 className="h-5 w-5 mr-2" />
                              Usage & Limits
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={loadBillingData}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Leads */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Leads Processed</span>
                              <span className="text-sm text-slate-600">
                                {usageData.leads_processed.toLocaleString()} / {
                                  usageData.leads_limit === -1 ? 'Unlimited' : usageData.leads_limit.toLocaleString()
                                }
                              </span>
                            </div>
                            {usageData.leads_limit !== -1 && (
                              <Progress value={(usageData.leads_processed / usageData.leads_limit) * 100} className="h-2" />
                            )}
                          </div>

                          {/* API Calls */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">API Calls</span>
                              <span className="text-sm text-slate-600">
                                {usageData.api_calls.toLocaleString()} / {
                                  usageData.api_limit === -1 ? 'Unlimited' : usageData.api_limit.toLocaleString()
                                }
                              </span>
                            </div>
                            {usageData.api_limit !== -1 && (
                              <Progress value={(usageData.api_calls / usageData.api_limit) * 100} className="h-2" />
                            )}
                          </div>

                          {/* Storage */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Storage Used</span>
                              <span className="text-sm text-slate-600">
                                {usageData.storage_used}GB / {
                                  usageData.storage_limit === -1 ? 'Unlimited' : `${usageData.storage_limit}GB`
                                }
                              </span>
                            </div>
                            {usageData.storage_limit !== -1 && (
                              <Progress value={(usageData.storage_used / usageData.storage_limit) * 100} className="h-2" />
                            )}
                          </div>

                          {/* Additional Usage Stats */}
                          <Separator />
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{usageData.ai_responses_generated}</p>
                              <p className="text-sm text-slate-600">AI Responses Generated</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{usageData.emails_sent}</p>
                              <p className="text-sm text-slate-600">Emails Sent</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Billing History */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center">
                              <DollarSign className="h-5 w-5 mr-2" />
                              Billing History
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {billingHistory.length > 0 ? (
                            <div className="space-y-4">
                              {billingHistory.map((invoice) => (
                                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium">{invoice.description}</p>
                                    <p className="text-sm text-slate-600">{formatDate(invoice.date)}</p>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <p className="font-medium">${invoice.amount}</p>
                                      <p className={`text-sm capitalize ${getStatusColor(invoice.status)}`}>
                                        {invoice.status}
                                      </p>
                                    </div>
                                    {invoice.status === 'paid' && invoice.invoice_url && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadInvoice(invoice.invoice_url || '')}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                              <p className="text-slate-500">No billing history available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column - Plan Comparison */}
                    <div className="space-y-6">
                      <Card id="available-plans">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            Available Plans
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {plans.map((plan) => (
                            <div
                              key={plan.name}
                              className={`p-4 border rounded-lg transition-all ${plan.name === getCurrentPlan().name
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">{plan.name}</h3>
                                {plan.name === getCurrentPlan().name && (
                                  <Badge variant="default">Current</Badge>
                                )}
                              </div>
                              <p className="text-2xl font-bold mb-1">${plan.price}</p>
                              <p className="text-sm text-slate-600 mb-3">{plan.description}</p>

                              <ul className="space-y-1 mb-4">
                                {plan.features.slice(0, 3).map((feature, index) => (
                                  <li key={index} className="flex items-center text-sm">
                                    <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>

                              {plan.name !== getCurrentPlan().name && (
                                <Button
                                  className="w-full"
                                  variant={plan.name === 'Professional' ? 'default' : 'outline'}
                                  onClick={() => handleUpgrade(plan)}
                                  disabled={upgradeLoading}
                                >
                                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                                </Button>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Payment Method */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-2" />
                            Payment Method
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {paymentMethods.length > 0 ? (
                            <div className="space-y-3">
                              {paymentMethods.map((method) => (
                                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                                  <div className="flex items-center">
                                    <CreditCard className="h-8 w-8 text-slate-400 mr-3" />
                                    <div>
                                      <p className="font-medium">
                                        {formatCardBrand(method.brand)} •••• {method.last4}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year.toString().slice(-2)}
                                      </p>
                                      {method.is_default && (
                                        <Badge variant="secondary" className="text-xs mt-1">Default</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleManagePaymentMethod}
                              >
                                Manage Payment Methods
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                              <p className="text-slate-500 mb-4">No payment method on file</p>
                              <Button
                                variant="outline"
                                onClick={handleManagePaymentMethod}
                              >
                                Add Payment Method
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Next Billing */}
                      {subscriptionData?.subscription_status === 'active' && subscriptionDetails && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2" />
                              Next Billing
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center">
                              <p className="text-2xl font-bold">${(subscriptionDetails.amount / 100).toFixed(2)}</p>
                              <p className="text-sm text-slate-600">on {formatDate(subscriptionDetails.next_billing_date)}</p>
                              <Alert className="mt-4">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                  Your subscription will automatically renew.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading subscription information...</p>
                </div>
              )}

              <EnterpriseContactDialog
                open={showEnterpriseDialog}
                onOpenChange={setShowEnterpriseDialog}
                onSuccess={() => {
                  toast.success('Thank you for your interest! Our sales team will contact you within 24 hours.');
                }}
              />
            </TabsContent>

            {/* Advanced */}
            <TabsContent value="advanced" className="space-y-6">
              {/* 
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
              */}


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

                  {/* First confirmation dialog */}
                  <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600">⚠️ Delete Account Warning</DialogTitle>
                        <DialogDescription className="space-y-3">
                          <p className="font-medium">
                            This action will permanently delete your account and ALL associated data:
                          </p>
                          <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>All your leads and customer data</li>
                            <li>Your subscription and billing information</li>
                            <li>Gmail integration settings</li>
                            <li>Usage statistics and history</li>
                            <li>Account settings and preferences</li>
                          </ul>
                          <p className="font-medium text-red-600">
                            This action cannot be undone and your data cannot be recovered.
                          </p>
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAccountConfirm}>
                          Continue with Deletion
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Final confirmation dialog */}
                  <Dialog open={finalDeleteConfirmOpen} onOpenChange={setFinalDeleteConfirmOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600">🚨 Final Confirmation Required</DialogTitle>
                        <DialogDescription className="space-y-4">
                          <p className="font-medium">
                            You are about to permanently delete your InboxFlow account.
                          </p>
                          <p className="text-sm text-slate-600">
                            To confirm this action, please type the following phrase exactly:
                          </p>
                          <p className="font-mono font-bold text-center bg-slate-100 p-2 rounded">
                            DELETE MY ACCOUNT
                          </p>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          value={deleteInput}
                          onChange={(e) => setDeleteInput(e.target.value)}
                          placeholder="Type confirmation phrase here..."
                          className="text-center font-mono"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFinalDeleteConfirmOpen(false);
                            setDeleteInput('');
                          }}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleFinalDeleteAccount}
                          disabled={deleteInput !== 'DELETE MY ACCOUNT' || isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Deleting Account...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Permanently Delete Account
                            </>
                          )}
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