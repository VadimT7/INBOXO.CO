import { useState, useEffect, useMemo } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DollarSign, TrendingUp, Target, Trophy, Zap, Crown, Flame,
  ArrowUpRight, ArrowDownRight, PlusCircle, Eye, Calendar,
  CheckCircle2, Clock, AlertCircle, Star, Sparkles, ChevronRight,
  BarChart3, PieChart, LineChart, Wallet, CreditCard, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  value: number;
  stage: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date: string;
  created_at: string;
  updated_at: string;
  lead_email?: string;
  lead_source?: string;
}

interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  deals_won: number;
  conversion_rate: number;
  avg_deal_size: number;
  pipeline_value: number;
  this_month_target: number;
}

const STAGE_CONFIG = {
  prospect: { label: 'Prospect', color: 'slate', probability: 10 },
  qualified: { label: 'Qualified', color: 'blue', probability: 25 },
  proposal: { label: 'Proposal', color: 'purple', probability: 50 },
  negotiation: { label: 'Negotiation', color: 'orange', probability: 75 },
  closed_won: { label: 'Closed Won', color: 'green', probability: 100 },
  closed_lost: { label: 'Closed Lost', color: 'red', probability: 0 }
};

const RevenuePage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: '',
    value: '',
    stage: 'prospect',
    probability: 10,
    expected_close_date: ''
  });
  const [monthlyTarget, setMonthlyTarget] = useState(10000);
  const [celebrating, setCelebrating] = useState(false);

  const fetchDeals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // In a real app, this would fetch from deals table with lead join
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        return;
      }

      // Mock deals data - in real app would come from database
      const mockDeals: Deal[] = (leadsData || []).slice(0, 15).map((lead, index) => {
        const stages = Object.keys(STAGE_CONFIG) as (keyof typeof STAGE_CONFIG)[];
        const randomStage = stages[Math.floor(Math.random() * stages.length)];
        const baseValue = Math.floor(Math.random() * 50000) + 1000;
        
        return {
          id: `deal_${lead.id}`,
          lead_id: lead.id,
          user_id: user.id,
          title: lead.subject || `Deal with ${lead.sender_email}`,
          value: baseValue,
          stage: randomStage,
          probability: STAGE_CONFIG[randomStage].probability,
          expected_close_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          lead_email: lead.sender_email,
          lead_source: 'Gmail'
        };
      });

      setDeals(mockDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDealStage = async (dealId: string, newStage: keyof typeof STAGE_CONFIG) => {
    const updatedDeals = deals.map(deal => 
      deal.id === dealId 
        ? { ...deal, stage: newStage, probability: STAGE_CONFIG[newStage].probability }
        : deal
    );
    setDeals(updatedDeals);

    // Show celebration for closed won deals
    if (newStage === 'closed_won') {
      const deal = deals.find(d => d.id === dealId);
      if (deal) {
        setCelebrating(true);
        toast.success(`🎉 Deal closed! +$${deal.value.toLocaleString()} revenue!`, {
          duration: 4000,
        });
        setTimeout(() => setCelebrating(false), 3000);
      }
    }
  };

  const addDeal = async () => {
    if (!newDeal.title || !newDeal.value) {
      toast.error('Please fill in required fields');
      return;
    }

    const deal: Deal = {
      id: `deal_${Date.now()}`,
      lead_id: '',
      user_id: user?.id || '',
      title: newDeal.title,
      value: parseInt(newDeal.value),
      stage: newDeal.stage as keyof typeof STAGE_CONFIG,
      probability: STAGE_CONFIG[newDeal.stage as keyof typeof STAGE_CONFIG].probability,
      expected_close_date: newDeal.expected_close_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lead_source: 'Manual'
    };

    setDeals(prev => [deal, ...prev]);
    setShowAddDeal(false);
    setNewDeal({
      title: '',
      value: '',
      stage: 'prospect',
      probability: 10,
      expected_close_date: ''
    });
    toast.success('Deal added to pipeline!');
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchDeals();
    }
  }, [authLoading, user]);

  // Calculate revenue stats
  const revenueStats: RevenueStats = useMemo(() => {
    const closedWonDeals = deals.filter(d => d.stage === 'closed_won');
    const thisMonth = new Date();
    const thisMonthDeals = closedWonDeals.filter(d => {
      const dealDate = new Date(d.updated_at);
      return dealDate.getMonth() === thisMonth.getMonth() && 
             dealDate.getFullYear() === thisMonth.getFullYear();
    });

    return {
      total_revenue: closedWonDeals.reduce((sum, deal) => sum + deal.value, 0),
      monthly_revenue: thisMonthDeals.reduce((sum, deal) => sum + deal.value, 0),
      deals_won: closedWonDeals.length,
      conversion_rate: deals.length > 0 ? (closedWonDeals.length / deals.length) * 100 : 0,
      avg_deal_size: closedWonDeals.length > 0 ? closedWonDeals.reduce((sum, deal) => sum + deal.value, 0) / closedWonDeals.length : 0,
      pipeline_value: deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
                          .reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0),
      this_month_target: monthlyTarget
    };
  }, [deals, monthlyTarget]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTargetProgress = () => {
    return Math.min((revenueStats.monthly_revenue / revenueStats.this_month_target) * 100, 100);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
            <DollarSign className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-green-600" />
          </div>
          <p className="text-slate-600 font-medium">Loading your revenue...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-24 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto mt-32">
        {/* Celebration Overlay */}
        <AnimatePresence>
          {celebrating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="text-8xl"
              >
                💰🎉💸
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                💰 Revenue Dashboard
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Watch your money grow in real-time! 📈</p>
            </div>

            <Button
              onClick={() => setShowAddDeal(true)}
              className="mt-4 lg:mt-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </div>

          {/* Money Counter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -m-4">
                <div className="w-24 h-24 bg-white/10 rounded-full"></div>
              </div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2">
                  <Banknote className="h-6 w-6" />
                  <span className="text-green-100 text-sm font-medium">Total Revenue</span>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {formatCurrency(revenueStats.total_revenue)}
                </div>
                <div className="flex items-center text-green-100">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">All time</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -m-4">
                <div className="w-24 h-24 bg-white/10 rounded-full"></div>
              </div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-blue-100 text-sm font-medium">This Month</span>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {formatCurrency(revenueStats.monthly_revenue)}
                </div>
                <div className="flex items-center text-blue-100">
                  <Target className="h-4 w-4 mr-1" />
                  <span className="text-sm">{getTargetProgress().toFixed(0)}% of target</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -m-4">
                <div className="w-24 h-24 bg-white/10 rounded-full"></div>
              </div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet className="h-6 w-6" />
                  <span className="text-orange-100 text-sm font-medium">Pipeline Value</span>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {formatCurrency(revenueStats.pipeline_value)}
                </div>
                <div className="flex items-center text-orange-100">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">Potential revenue</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -m-4">
                <div className="w-24 h-24 bg-white/10 rounded-full"></div>
              </div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-6 w-6" />
                  <span className="text-purple-100 text-sm font-medium">Avg Deal Size</span>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {formatCurrency(revenueStats.avg_deal_size)}
                </div>
                <div className="flex items-center text-purple-100">
                  <Star className="h-4 w-4 mr-1" />
                  <span className="text-sm">{revenueStats.deals_won} deals won</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Target Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Monthly Target Progress</h3>
                <p className="text-slate-600">
                  {formatCurrency(revenueStats.monthly_revenue)} of {formatCurrency(revenueStats.this_month_target)} target
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {getTargetProgress().toFixed(0)}%
                </div>
                <p className="text-slate-600 text-sm">
                  {formatCurrency(revenueStats.this_month_target - revenueStats.monthly_revenue)} to go
                </p>
              </div>
            </div>
            <Progress 
              value={getTargetProgress()} 
              className="h-4 bg-slate-200"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Keep crushing it! 💪</span>
              <span>
                {getTargetProgress() >= 100 ? '🎉 Target smashed!' : `${(100 - getTargetProgress()).toFixed(0)}% to target`}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Deal Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            {Object.entries(STAGE_CONFIG).map(([stage, config], index) => {
              const stageDeals = deals.filter(d => d.stage === stage);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

              return (
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="space-y-4"
                >
                  {/* Stage Header */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm">
                    <div className="text-center">
                      <h3 className="font-semibold text-slate-700 mb-1">{config.label}</h3>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {formatCurrency(stageValue)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stageDeals.length} deals
                      </Badge>
                    </div>
                  </div>

                  {/* Deal Cards */}
                  <div className="space-y-3 min-h-[300px]">
                    <AnimatePresence>
                      {stageDeals.map((deal, dealIndex) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: dealIndex * 0.05 }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-lg transition-all duration-300"
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">
                                {deal.title}
                              </h4>
                              <p className="text-xs text-slate-600">{deal.lead_email}</p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(deal.value)}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  config.color === 'green' && "border-green-500 text-green-700",
                                  config.color === 'red' && "border-red-500 text-red-700",
                                  config.color === 'blue' && "border-blue-500 text-blue-700",
                                  config.color === 'purple' && "border-purple-500 text-purple-700",
                                  config.color === 'orange' && "border-orange-500 text-orange-700",
                                  config.color === 'slate' && "border-slate-500 text-slate-700"
                                )}
                              >
                                {deal.probability}%
                              </Badge>
                            </div>

                            <Select
                              value={deal.stage}
                              onValueChange={(value) => updateDealStage(deal.id, value as keyof typeof STAGE_CONFIG)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STAGE_CONFIG).map(([stageKey, stageConfig]) => (
                                  <SelectItem key={stageKey} value={stageKey}>
                                    {stageConfig.label} ({stageConfig.probability}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {stageDeals.length === 0 && (
                      <div className="text-center p-8 text-slate-400">
                        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No deals in {config.label.toLowerCase()}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Add Deal Modal */}
        <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>💰 Add New Deal</DialogTitle>
              <DialogDescription>
                Create a new deal to track through your pipeline
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Deal Title</label>
                <Input
                  placeholder="e.g., Website redesign project"
                  value={newDeal.title}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Deal Value ($)</label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, value: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Stage</label>
                <Select 
                  value={newDeal.stage} 
                  onValueChange={(value) => setNewDeal(prev => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
                      <SelectItem key={stage} value={stage}>
                        {config.label} ({config.probability}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Expected Close Date</label>
                <Input
                  type="date"
                  value={newDeal.expected_close_date}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, expected_close_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDeal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addDeal}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RevenuePage; 