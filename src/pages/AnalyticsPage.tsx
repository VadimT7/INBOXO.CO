import { useState, useEffect, useMemo } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Mail, Users, Target, 
  Zap, Brain, AlertTriangle, Calendar, Filter, Download,
  BarChart3, PieChart as PieChartIcon, Activity, Lightbulb,
  Timer, Globe, MessageSquare, ArrowUpRight, ArrowDownRight,
  Eye, MousePointer, Heart, Star, Flame, Snowflake,
  Award, Shield, Sparkles, Cpu, Radar as RadarIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Lead {
  id: string;
  sender_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  created_at: string;
  updated_at: string;
  status: string;
}

interface AnalyticsData {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  unclassified: number;
  conversionRate: number;
  averageResponseTime: number;
  weeklyGrowth: number;
  topSenders: Array<{ email: string; count: number; conversion: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  dailyTrends: Array<{ date: string; leads: number; hot: number; warm: number; cold: number }>;
  sentimentAnalysis: Array<{ sentiment: string; count: number; percentage: number }>;
  predictiveInsights: {
    nextWeekPrediction: number;
    bestPerformingTimes: string[];
    riskAlerts: string[];
    recommendations: string[];
  };
}

const AnalyticsPage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('leads');

  const fetchLeads = async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to fetch analytics data');
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchLeads();
    } else if (!authLoading && !user) {
      setLeads([]);
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  const {
    leadScores,
    responseTimePatterns,
    predictiveInsights: advancedInsights,
    qualityTrends,
    competitionInsights
  } = useAdvancedAnalytics(leads, user?.id);

  // Calculate analytics data
  const analyticsData: AnalyticsData = useMemo(() => {
    if (!leads.length) {
      return {
        totalLeads: 0,
        hotLeads: 0,
        warmLeads: 0,
        coldLeads: 0,
        unclassified: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        weeklyGrowth: 0,
        topSenders: [],
        hourlyDistribution: [],
        dailyTrends: [],
        sentimentAnalysis: [],
        predictiveInsights: {
          nextWeekPrediction: 0,
          bestPerformingTimes: [],
          riskAlerts: [],
          recommendations: []
        }
      };
    }

    // Filter by time range
    const now = new Date();
    const timeFilter = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange] || 7;

    const filteredLeads = leads.filter(lead => {
      const leadDate = new Date(lead.received_at);
      const daysDiff = (now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= timeFilter;
    });

    const totalLeads = filteredLeads.length;
    const hotLeads = filteredLeads.filter(l => l.status === 'hot').length;
    const warmLeads = filteredLeads.filter(l => l.status === 'warm').length;
    const coldLeads = filteredLeads.filter(l => l.status === 'cold').length;
    const unclassified = filteredLeads.filter(l => l.status === 'unclassified').length;

    // Calculate top senders
    const senderCounts = filteredLeads.reduce((acc, lead) => {
      const domain = lead.sender_email.split('@')[1] || lead.sender_email;
      if (!acc[domain]) {
        acc[domain] = { count: 0, hot: 0 };
      }
      acc[domain].count++;
      if (lead.status === 'hot') acc[domain].hot++;
      return acc;
    }, {} as Record<string, { count: number; hot: number }>);

    const topSenders = Object.entries(senderCounts)
      .map(([email, data]) => ({
        email,
        count: data.count,
        conversion: data.count > 0 ? (data.hot / data.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: filteredLeads.filter(lead => 
        new Date(lead.received_at).getHours() === hour
      ).length
    }));

    // Daily trends (last 30 days)
    const dailyTrends = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLeads = filteredLeads.filter(lead => 
        lead.received_at.startsWith(dateStr)
      );
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: dayLeads.length,
        hot: dayLeads.filter(l => l.status === 'hot').length,
        warm: dayLeads.filter(l => l.status === 'warm').length,
        cold: dayLeads.filter(l => l.status === 'cold').length
      };
    }).reverse();

    // Sentiment analysis (based on keywords in subject/snippet)
    const sentimentKeywords = {
      positive: ['urgent', 'opportunity', 'interested', 'ready', 'budget', 'quick', 'asap'],
      neutral: ['inquiry', 'question', 'information', 'details', 'quote'],
      negative: ['cancel', 'not interested', 'remove', 'stop', 'unsubscribe']
    };

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    filteredLeads.forEach(lead => {
      const text = `${lead.subject} ${lead.snippet}`.toLowerCase();
      let classified = false;
      
      for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
          classified = true;
          break;
        }
      }
      
      if (!classified) sentimentCounts.neutral++;
    });

    const sentimentAnalysis = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      sentiment: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      count,
      percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0
    }));

    // Predictive insights and recommendations
    const recentGrowth = dailyTrends.slice(-7).reduce((sum, day) => sum + day.leads, 0);
    const previousWeekGrowth = dailyTrends.slice(-14, -7).reduce((sum, day) => sum + day.leads, 0);
    const weeklyGrowthRate = previousWeekGrowth > 0 ? ((recentGrowth - previousWeekGrowth) / previousWeekGrowth) * 100 : 0;

    const bestHours = hourlyDistribution
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => `${h.hour}:00`);

    const conversionRate = hotLeads > 0 ? (hotLeads / totalLeads) * 100 : 0;
    
    const riskAlerts: string[] = [];
    const recommendations: string[] = [];

    if (weeklyGrowthRate < -20) {
      riskAlerts.push('Lead volume decreased by 20%+ this week');
    }
    if (conversionRate < 10) {
      riskAlerts.push('Low hot lead conversion rate');
    }
    if (unclassified > totalLeads * 0.5) {
      riskAlerts.push('High number of unclassified leads');
    }

    if (bestHours.length > 0) {
      recommendations.push(`Peak lead times: ${bestHours.join(', ')} - optimize responses during these hours`);
    }
    if (topSenders.length > 0 && topSenders[0].conversion > 50) {
      recommendations.push(`High-converting domain: ${topSenders[0].email} - prioritize similar sources`);
    }
    if (conversionRate < 15) {
      recommendations.push('Consider improving lead qualification criteria to boost conversion rates');
    }

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      unclassified,
      conversionRate,
      averageResponseTime: Math.floor(Math.random() * 120) + 30, // Mock data
      weeklyGrowth: weeklyGrowthRate,
      topSenders,
      hourlyDistribution,
      dailyTrends,
      sentimentAnalysis,
      predictiveInsights: {
        nextWeekPrediction: Math.floor(recentGrowth * (1 + weeklyGrowthRate / 100)),
        bestPerformingTimes: bestHours,
        riskAlerts,
        recommendations
      }
    };
  }, [leads, timeRange]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const chartConfig = {
    leads: { label: 'Total Leads', color: '#3b82f6' },
    hot: { label: 'Hot', color: '#ef4444' },
    warm: { label: 'Warm', color: '#f59e0b' },
    cold: { label: 'Cold', color: '#06b6d4' },
    positive: { label: 'Positive', color: '#10b981' },
    neutral: { label: 'Neutral', color: '#6b7280' },
    negative: { label: 'Negative', color: '#ef4444' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto mt-32">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 mt-2">Deep insights into your lead performance and patterns</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Leads</p>
                  <p className="text-3xl font-bold">{analyticsData.totalLeads}</p>
                  <div className="flex items-center mt-2">
                    {analyticsData.weeklyGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm">
                      {analyticsData.weeklyGrowth >= 0 ? '+' : ''}{analyticsData.weeklyGrowth.toFixed(1)}% this week
                    </span>
                  </div>
                </div>
                <Mail className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Hot Leads</p>
                  <p className="text-3xl font-bold">{analyticsData.hotLeads}</p>
                  <div className="flex items-center mt-2">
                    <Flame className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {analyticsData.conversionRate.toFixed(1)}% conversion
                    </span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Avg. Response Time</p>
                  <p className="text-3xl font-bold">{analyticsData.averageResponseTime}m</p>
                  <div className="flex items-center mt-2">
                    <Timer className="h-4 w-4 mr-1" />
                    <span className="text-sm">Within business hours</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">AI Insights</p>
                  <p className="text-3xl font-bold">{analyticsData.predictiveInsights.recommendations.length}</p>
                  <div className="flex items-center mt-2">
                    <Brain className="h-4 w-4 mr-1" />
                    <span className="text-sm">Active recommendations</span>
                  </div>
                </div>
                <Lightbulb className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Alerts */}
        {analyticsData.predictiveInsights.riskAlerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.predictiveInsights.riskAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-800">{alert}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Analytics Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="predictions">AI Insights</TabsTrigger>
              <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      Lead Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Hot', value: analyticsData.hotLeads, fill: '#ef4444' },
                              { name: 'Warm', value: analyticsData.warmLeads, fill: '#f59e0b' },
                              { name: 'Cold', value: analyticsData.coldLeads, fill: '#06b6d4' },
                              { name: 'Unclassified', value: analyticsData.unclassified, fill: '#6b7280' }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Hourly Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Hourly Lead Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.hourlyDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Lead Trends (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="hot" 
                          stackId="1" 
                          stroke="#ef4444" 
                          fill="#ef4444" 
                          fillOpacity={0.8}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="warm" 
                          stackId="1" 
                          stroke="#f59e0b" 
                          fill="#f59e0b" 
                          fillOpacity={0.8}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cold" 
                          stackId="1" 
                          stroke="#06b6d4" 
                          fill="#06b6d4" 
                          fillOpacity={0.8}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Top Lead Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.topSenders.map((sender, index) => (
                      <div key={sender.email} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{sender.email}</p>
                            <p className="text-sm text-slate-600">{sender.count} leads</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={sender.conversion > 30 ? "default" : "secondary"}>
                            {sender.conversion.toFixed(1)}% conversion
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.sentimentAnalysis.map(item => ({
                              ...item,
                              fill: item.sentiment === 'Positive' ? '#10b981' : 
                                    item.sentiment === 'Negative' ? '#ef4444' : '#6b7280'
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="count"
                            label={({ sentiment, percentage }) => `${sentiment} ${percentage.toFixed(0)}%`}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Sentiment Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.sentimentAnalysis.map((item) => (
                        <div key={item.sentiment} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${
                              item.sentiment === 'Positive' ? 'bg-green-500' :
                              item.sentiment === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="font-medium">{item.sentiment}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold">{item.count}</span>
                            <span className="text-sm text-slate-600 ml-2">
                              ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="scoring" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2 text-yellow-500" />
                      Top Scored Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {leadScores.slice(0, 10).map((score, index) => {
                        const lead = leads.find(l => l.id === score.leadId);
                        if (!lead) return null;
                        
                        return (
                          <div key={score.leadId} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                  score.score >= 80 ? 'bg-red-500' :
                                  score.score >= 60 ? 'bg-yellow-500' :
                                  score.score >= 40 ? 'bg-blue-500' : 'bg-gray-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-medium text-sm">{lead.sender_email}</span>
                              </div>
                              <Badge variant={score.score >= 80 ? "destructive" : score.score >= 60 ? "default" : "secondary"}>
                                {score.score.toFixed(0)}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{lead.subject}</p>
                            <div className="flex justify-between items-center mb-2">
                              <Progress value={score.score} className="flex-1 mr-4" />
                              <span className="text-xs text-slate-500">{score.score.toFixed(0)}/100</span>
                            </div>
                            <p className="text-xs text-slate-500">{score.recommendation}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <RadarIcon className="h-5 w-5 mr-2 text-purple-500" />
                      Scoring Factors Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={[
                          {
                            factor: 'Urgency',
                            average: leadScores.length > 0 ? leadScores.reduce((sum, s) => sum + s.factors.urgencyScore, 0) / leadScores.length : 0,
                            max: 100
                          },
                          {
                            factor: 'Reputation',
                            average: leadScores.length > 0 ? leadScores.reduce((sum, s) => sum + s.factors.senderReputation, 0) / leadScores.length : 0,
                            max: 100
                          },
                          {
                            factor: 'Relevance',
                            average: leadScores.length > 0 ? leadScores.reduce((sum, s) => sum + s.factors.contentRelevance, 0) / leadScores.length : 0,
                            max: 100
                          },
                          {
                            factor: 'Timing',
                            average: leadScores.length > 0 ? leadScores.reduce((sum, s) => sum + s.factors.timingScore, 0) / leadScores.length : 0,
                            max: 100
                          }
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="factor" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar name="Average Score" dataKey="average" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                    Lead Quality Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={qualityTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="quality" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          name="Quality Score"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Volume"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-purple-600" />
                      AI Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-2">Next Week Prediction</h3>
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {analyticsData.predictiveInsights.nextWeekPrediction}
                        </div>
                        <p className="text-slate-600">Expected leads</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          Best Performing Times
                        </h4>
                        <div className="space-y-2">
                          {analyticsData.predictiveInsights.bestPerformingTimes.map((time, index) => (
                            <Badge key={index} variant="outline" className="mr-2">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-green-600" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.predictiveInsights.recommendations.map((rec, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-green-500">
                          <p className="text-slate-700">{rec}</p>
                        </div>
                      ))}
                      {analyticsData.predictiveInsights.recommendations.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>All looking good! Keep up the great work.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cpu className="h-5 w-5 mr-2 text-indigo-600" />
                    Advanced AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {advancedInsights.map((insight, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border-l-4 ${
                          insight.type === 'opportunity' ? 'border-green-500 bg-green-50' :
                          insight.type === 'risk' ? 'border-red-500 bg-red-50' :
                          insight.type === 'trend' ? 'border-blue-500 bg-blue-50' :
                          'border-purple-500 bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={
                            insight.impact === 'high' ? 'destructive' :
                            insight.impact === 'medium' ? 'default' : 'secondary'
                          }>
                            {insight.type}
                          </Badge>
                          <span className="text-sm text-slate-600">{insight.confidence}% confidence</span>
                        </div>
                        <h4 className="font-semibold mb-2">{insight.title}</h4>
                        <p className="text-sm text-slate-700 mb-3">{insight.description}</p>
                        <div className="space-y-1">
                          {insight.actionItems.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center text-xs text-slate-600">
                              <div className="w-1 h-1 bg-slate-400 rounded-full mr-2"></div>
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Response Time Heatmap */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Timer className="h-5 w-5 mr-2 text-orange-500" />
                      Response Time Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={responseTimePatterns}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="successRate" fill="#10b981" name="Success Rate %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Competition Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-500" />
                      Market Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">Market Trend</p>
                        <p className="text-2xl font-bold capitalize text-blue-600">
                          {competitionInsights.marketTrend}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">Competitor Activity</p>
                        <div className="text-2xl font-bold text-orange-600">
                          {competitionInsights.competitorActivity}%
                        </div>
                        <Progress value={competitionInsights.competitorActivity} className="mt-2" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-2">Recommended Actions:</p>
                        <div className="space-y-2">
                          {competitionInsights.recommendedActions.map((action, index) => (
                            <div key={index} className="text-xs p-2 bg-blue-50 rounded border-l-2 border-blue-500">
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lead Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
                    Lead Score Distribution Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={leadScores.map(score => {
                        const lead = leads.find(l => l.id === score.leadId);
                        return {
                          score: score.score,
                          urgency: score.factors.urgencyScore,
                          reputation: score.factors.senderReputation,
                          timing: score.factors.timingScore,
                          email: lead?.sender_email || ''
                        };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="urgency" name="Urgency Score" />
                        <YAxis dataKey="score" name="Total Score" />
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <p className="font-medium">{data.email}</p>
                                  <p>Total Score: {data.score}</p>
                                  <p>Urgency: {data.urgency}</p>
                                  <p>Reputation: {data.reputation}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter dataKey="score" fill="#8b5cf6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 