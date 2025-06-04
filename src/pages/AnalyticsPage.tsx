
import { useState, useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, Target, Zap, TrendingUp, Clock, CheckCircle2, 
  Calendar, Star, Trophy, Award, BarChart3, Activity,
  Users, MessageSquare, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { useResponseTimeAnalytics } from '@/hooks/useResponseTimeAnalytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Lead {
  id: string;
  sender_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_archived?: boolean;
}

const AnalyticsPage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { 
    leadScores, 
    responseTimePatterns, 
    predictiveInsights, 
    qualityTrends,
    competitionInsights 
  } = useAdvancedAnalytics(leads, user?.id);

  const { 
    metrics: responseMetrics, 
    loading: responseLoading 
  } = useResponseTimeAnalytics(user?.id);

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
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <BarChart3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
          </div>
          <p className="text-slate-600 font-medium">Loading analytics...</p>
        </motion.div>
      </div>
    );
  }

  // Calculate basic metrics
  const totalLeads = leads.filter(l => !l.is_archived).length;
  const classifiedLeads = leads.filter(l => !l.is_archived && l.status !== 'unclassified').length;
  const hotLeads = leads.filter(l => !l.is_archived && l.status === 'hot').length;
  const conversionRate = totalLeads > 0 ? (hotLeads / totalLeads) * 100 : 0;

  // Status distribution data for pie chart
  const statusData = [
    { name: 'Hot', value: leads.filter(l => l.status === 'hot').length, color: '#ef4444' },
    { name: 'Warm', value: leads.filter(l => l.status === 'warm').length, color: '#f59e0b' },
    { name: 'Cold', value: leads.filter(l => l.status === 'cold').length, color: '#3b82f6' },
    { name: 'Unclassified', value: leads.filter(l => l.status === 'unclassified').length, color: '#64748b' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto mt-32">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Deep insights into your lead performance 📊</p>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Mail className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeads}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {classifiedLeads}/{totalLeads} classified
                </p>
                <Progress value={(classifiedLeads / totalLeads) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-500 mt-1">
                  {hotLeads} hot leads
                </p>
                <Progress value={conversionRate} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {responseLoading ? '...' : responseMetrics.averageResponseTimeFormatted}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {responseMetrics.totalResponded > 0 
                    ? `${responseMetrics.responseRate}% response rate`
                    : 'No responses tracked yet'
                  }
                </p>
                <div className="flex items-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {responseMetrics.withinBusinessHours ? 'Within business hours' : 'After hours'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Quality</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leadScores.length > 0 
                    ? Math.round(leadScores.reduce((sum, score) => sum + score.score, 0) / leadScores.length)
                    : 0
                  }
                </div>
                <p className="text-xs text-slate-500 mt-1">Average score out of 100</p>
                <Progress 
                  value={leadScores.length > 0 
                    ? leadScores.reduce((sum, score) => sum + score.score, 0) / leadScores.length
                    : 0
                  } 
                  className="mt-2" 
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quality Trends Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span>Lead Quality Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={qualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="quality" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Quality Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Volume"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span>Lead Status Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Predictive Insights */}
        {predictiveInsights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>AI Insights & Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveInsights.slice(0, 3).map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-800">{insight.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}
                          >
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3">{insight.description}</p>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-700">Recommended Actions:</p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {insight.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center space-x-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Response Time Patterns */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <span>Hourly Response Patterns</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseTimePatterns}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="successRate" fill="#10b981" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
