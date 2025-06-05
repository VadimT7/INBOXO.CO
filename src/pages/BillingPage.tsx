import { useState, useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  CreditCard, Crown, Calendar, DollarSign, TrendingUp, 
  CheckCircle, AlertTriangle, Download, RefreshCw, 
  Settings, ArrowUpCircle, ArrowDownCircle, Pause, 
  Play, X, Check, Zap, Users, Target, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
import { useNavigate } from 'react-router-dom';
import { EnterpriseContactDialog } from '@/components/pricing/EnterpriseContactDialog';

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

const BillingPage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEnterpriseDialog, setShowEnterpriseDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadBillingData();
    }
  }, [authLoading, user]);

  const loadBillingData = async () => {
    try {
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
          setSubscriptionData(profileData);
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
        setBillingHistory([]); // No fallback to mock data
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
      setLoading(false);
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
      
      // Provide more specific error messages
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

  const currentPlan = getCurrentPlan();
  const isTrialActive = subscriptionData?.subscription_status === 'trial' && 
    subscriptionData?.trial_ends_at && 
    new Date(subscriptionData.trial_ends_at) > new Date();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 p-6 sm:p-10 lg:p-16">
      <div className="max-w-7xl mx-auto mt-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Billing & Subscription
              </h1>
              <p className="text-slate-600 mt-2">Manage your subscription, billing, and usage</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                variant="outline"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Subscription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
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
                      <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                      <p className="text-slate-600">${currentPlan.price}/month</p>
                      <p className="text-sm text-slate-500 mt-1">{currentPlan.description}</p>
                      
                      {isTrialActive && (
                        <div className="mt-3 flex items-center text-blue-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            Trial ends on {formatDate(subscriptionData!.trial_ends_at!)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">${currentPlan.price}</div>
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
            </motion.div>

            {/* Usage & Limits */}
            {usageData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
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
              </motion.div>
            )}

            {/* Billing History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
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
            </motion.div>
          </div>

          {/* Right Column - Plan Comparison */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
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
                      className={`p-4 border rounded-lg transition-all ${
                        plan.name === currentPlan.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        {plan.name === currentPlan.name && (
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

                      {plan.name !== currentPlan.name && (
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
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
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
            </motion.div>

            {/* Next Billing */}
            {subscriptionData?.subscription_status === 'active' && subscriptionDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
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
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your subscription will automatically renew.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        <EnterpriseContactDialog
          open={showEnterpriseDialog}
          onOpenChange={setShowEnterpriseDialog}
          onSuccess={() => {
            toast.success('Thank you for your interest! Our sales team will contact you within 24 hours.');
          }}
        />
      </div>
    </div>
  );
};

export default BillingPage;
