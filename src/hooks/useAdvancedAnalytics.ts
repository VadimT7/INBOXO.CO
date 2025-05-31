import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface LeadScore {
  leadId: string;
  score: number;
  factors: {
    urgencyScore: number;
    senderReputation: number;
    contentRelevance: number;
    timingScore: number;
  };
  recommendation: string;
}

interface ResponseTimePattern {
  hour: number;
  averageResponseTime: number;
  successRate: number;
  recommendedAction: string;
}

interface PredictiveInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export const useAdvancedAnalytics = (leads: Lead[], userId: string | undefined) => {
  const [isCalculating, setIsCalculating] = useState(false);

  // Advanced Lead Scoring Algorithm
  const leadScores = useMemo((): LeadScore[] => {
    if (!leads.length) return [];

    return leads.map(lead => {
      // Urgency scoring based on keywords
      const urgencyKeywords = ['urgent', 'asap', 'immediate', 'quickly', 'rush', 'emergency'];
      const urgencyScore = urgencyKeywords.reduce((score, keyword) => {
        if (lead.subject?.toLowerCase().includes(keyword) || lead.snippet?.toLowerCase().includes(keyword)) {
          return score + 20;
        }
        return score;
      }, 0);

      // Sender reputation based on domain and previous interactions
      const domain = lead.sender_email.split('@')[1];
      const domainLeads = leads.filter(l => l.sender_email.includes(domain));
      const hotLeadsFromDomain = domainLeads.filter(l => l.status === 'hot').length;
      const senderReputation = domainLeads.length > 0 ? (hotLeadsFromDomain / domainLeads.length) * 100 : 50;

      // Content relevance based on business keywords
      const businessKeywords = ['budget', 'project', 'contract', 'proposal', 'quote', 'meeting', 'partnership'];
      const contentRelevance = businessKeywords.reduce((score, keyword) => {
        if (lead.subject?.toLowerCase().includes(keyword) || lead.snippet?.toLowerCase().includes(keyword)) {
          return score + 15;
        }
        return score;
      }, 0);

      // Timing score based on when the lead was received
      const receivedHour = new Date(lead.received_at).getHours();
      const timingScore = (receivedHour >= 9 && receivedHour <= 17) ? 20 : 10;

      const totalScore = Math.min(100, urgencyScore + senderReputation + contentRelevance + timingScore);

      let recommendation = '';
      if (totalScore >= 80) recommendation = 'High priority - respond immediately';
      else if (totalScore >= 60) recommendation = 'Medium priority - respond within 2 hours';
      else if (totalScore >= 40) recommendation = 'Low priority - respond within 24 hours';
      else recommendation = 'Very low priority - consider automated response';

      return {
        leadId: lead.id,
        score: totalScore,
        factors: {
          urgencyScore,
          senderReputation,
          contentRelevance,
          timingScore
        },
        recommendation
      };
    }).sort((a, b) => b.score - a.score);
  }, [leads]);

  // Response Time Pattern Analysis
  const responseTimePatterns = useMemo((): ResponseTimePattern[] => {
    if (!leads.length) return [];

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourLeads = leads.filter(lead => new Date(lead.received_at).getHours() === hour);
      const hotLeads = hourLeads.filter(l => l.status === 'hot');
      
      return {
        hour,
        averageResponseTime: Math.random() * 120 + 30, // Mock data - would calculate from actual response times
        successRate: hourLeads.length > 0 ? (hotLeads.length / hourLeads.length) * 100 : 0,
        recommendedAction: hour >= 9 && hour <= 17 ? 'Immediate response' : 'Schedule for business hours'
      };
    });

    return hourlyData;
  }, [leads]);

  // Predictive Insights using Machine Learning-like patterns
  const predictiveInsights = useMemo((): PredictiveInsight[] => {
    if (!leads.length) return [];

    const insights: PredictiveInsight[] = [];
    
    // Trend Analysis
    const recentLeads = leads.filter(lead => {
      const daysDiff = (Date.now() - new Date(lead.received_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    const previousWeekLeads = leads.filter(lead => {
      const daysDiff = (Date.now() - new Date(lead.received_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 7 && daysDiff <= 14;
    });

    const trendChange = recentLeads.length - previousWeekLeads.length;
    
    if (trendChange > 5) {
      insights.push({
        type: 'opportunity',
        title: 'Lead Volume Surge Detected',
        description: `You've received ${trendChange} more leads this week compared to last week. This indicates growing interest in your services.`,
        confidence: 85,
        impact: 'high',
        actionItems: [
          'Prepare automated responses for common inquiries',
          'Consider scaling your response team',
          'Analyze which marketing channels are driving the increase'
        ]
      });
    }

    // Response Time Opportunity
    const averageScore = leadScores.reduce((sum, score) => sum + score.score, 0) / leadScores.length;
    if (averageScore > 70) {
      insights.push({
        type: 'opportunity',
        title: 'High-Quality Lead Pattern',
        description: 'Your recent leads show high engagement potential. Average lead score is above 70.',
        confidence: 78,
        impact: 'high',
        actionItems: [
          'Prioritize immediate responses',
          'Prepare detailed proposals',
          'Consider offering premium consultation calls'
        ]
      });
    }

    // Domain Analysis
    const domainAnalysis = leads.reduce((acc, lead) => {
      const domain = lead.sender_email.split('@')[1];
      if (!acc[domain]) {
        acc[domain] = { total: 0, hot: 0 };
      }
      acc[domain].total++;
      if (lead.status === 'hot') acc[domain].hot++;
      return acc;
    }, {} as Record<string, { total: number; hot: number }>);

    const bestDomain = Object.entries(domainAnalysis)
      .filter(([_, data]) => data.total >= 3)
      .sort(([_, a], [__, b]) => (b.hot / b.total) - (a.hot / a.total))[0];

    if (bestDomain && (bestDomain[1].hot / bestDomain[1].total) > 0.5) {
      insights.push({
        type: 'recommendation',
        title: 'High-Converting Lead Source Identified',
        description: `Leads from ${bestDomain[0]} have a ${((bestDomain[1].hot / bestDomain[1].total) * 100).toFixed(0)}% conversion rate.`,
        confidence: 92,
        impact: 'medium',
        actionItems: [
          `Prioritize leads from ${bestDomain[0]}`,
          'Analyze what makes these leads successful',
          'Consider targeted outreach to similar domains'
        ]
      });
    }

    // Time-based Patterns
    const morningLeads = leads.filter(l => new Date(l.received_at).getHours() < 12);
    const afternoonLeads = leads.filter(l => new Date(l.received_at).getHours() >= 12);
    
    const morningConversion = morningLeads.filter(l => l.status === 'hot').length / Math.max(morningLeads.length, 1);
    const afternoonConversion = afternoonLeads.filter(l => l.status === 'hot').length / Math.max(afternoonLeads.length, 1);

    if (Math.abs(morningConversion - afternoonConversion) > 0.2) {
      const betterTime = morningConversion > afternoonConversion ? 'morning' : 'afternoon';
      insights.push({
        type: 'trend',
        title: `${betterTime.charAt(0).toUpperCase() + betterTime.slice(1)} Leads Perform Better`,
        description: `Leads received in the ${betterTime} show ${((Math.max(morningConversion, afternoonConversion) * 100).toFixed(0))}% higher conversion rates.`,
        confidence: 73,
        impact: 'medium',
        actionItems: [
          `Focus marketing efforts for ${betterTime} delivery`,
          `Ensure team availability during ${betterTime} hours`,
          'Set up automated responses for off-peak times'
        ]
      });
    }

    // Risk Detection
    const unclassifiedRatio = leads.filter(l => l.status === 'unclassified').length / leads.length;
    if (unclassifiedRatio > 0.4) {
      insights.push({
        type: 'risk',
        title: 'High Unclassified Lead Volume',
        description: `${(unclassifiedRatio * 100).toFixed(0)}% of your leads remain unclassified, potentially missing opportunities.`,
        confidence: 95,
        impact: 'high',
        actionItems: [
          'Review classification criteria',
          'Implement automated classification rules',
          'Train team on lead qualification standards'
        ]
      });
    }

    return insights.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return (impactWeight[b.impact] * b.confidence) - (impactWeight[a.impact] * a.confidence);
    });
  }, [leads, leadScores]);

  // Lead Quality Trends
  const qualityTrends = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLeads = leads.filter(lead => lead.received_at.startsWith(dateStr));
      const dayScores = leadScores.filter(score => 
        dayLeads.some(lead => lead.id === score.leadId)
      );
      
      const averageQuality = dayScores.length > 0 
        ? dayScores.reduce((sum, score) => sum + score.score, 0) / dayScores.length 
        : 0;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        quality: averageQuality,
        volume: dayLeads.length,
        hotLeads: dayLeads.filter(l => l.status === 'hot').length
      };
    }).reverse();

    return last30Days;
  }, [leads, leadScores]);

  // Competition Analysis (Mock data - would integrate with external APIs)
  const competitionInsights = useMemo(() => {
    return {
      marketTrend: Math.random() > 0.5 ? 'growing' : 'stable',
      competitorActivity: Math.floor(Math.random() * 100),
      recommendedActions: [
        'Monitor competitor pricing strategies',
        'Analyze response time benchmarks',
        'Track industry-specific keywords'
      ]
    };
  }, []);

  return {
    leadScores,
    responseTimePatterns,
    predictiveInsights,
    qualityTrends,
    competitionInsights,
    isCalculating
  };
}; 