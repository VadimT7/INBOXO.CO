
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  received_at: string;
  responded_at: string | null;
  response_time_minutes: number | null;
  status: string;
}

interface ResponseTimeMetrics {
  averageResponseTime: number;
  averageResponseTimeFormatted: string;
  totalResponded: number;
  totalLeads: number;
  responseRate: number;
  businessHoursAverage: number;
  afterHoursAverage: number;
  withinBusinessHours: boolean;
}

export const useResponseTimeAnalytics = (userId: string | undefined) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    if (!userId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, received_at, responded_at, response_time_minutes, status')
        .eq('user_id', userId)
        .eq('is_archived', false);

      if (error) {
        console.error('Error fetching leads for response time analytics:', error);
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads for response time analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [userId]);

  const metrics = useMemo((): ResponseTimeMetrics => {
    const respondedLeads = leads.filter(lead => lead.responded_at && lead.response_time_minutes);
    
    if (respondedLeads.length === 0) {
      return {
        averageResponseTime: 0,
        averageResponseTimeFormatted: '0m',
        totalResponded: 0,
        totalLeads: leads.length,
        responseRate: 0,
        businessHoursAverage: 0,
        afterHoursAverage: 0,
        withinBusinessHours: true
      };
    }

    // Calculate average response time
    const totalResponseTime = respondedLeads.reduce((sum, lead) => sum + (lead.response_time_minutes || 0), 0);
    const averageResponseTime = Math.round(totalResponseTime / respondedLeads.length);

    // Format response time
    const formatResponseTime = (minutes: number): string => {
      if (minutes < 60) return `${minutes}m`;
      if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
      return `${Math.round(minutes / 1440)}d`;
    };

    // Separate business hours vs after hours
    const businessHoursLeads = respondedLeads.filter(lead => {
      const receivedHour = new Date(lead.received_at).getHours();
      return receivedHour >= 9 && receivedHour <= 17;
    });

    const afterHoursLeads = respondedLeads.filter(lead => {
      const receivedHour = new Date(lead.received_at).getHours();
      return receivedHour < 9 || receivedHour > 17;
    });

    const businessHoursAverage = businessHoursLeads.length > 0 
      ? Math.round(businessHoursLeads.reduce((sum, lead) => sum + (lead.response_time_minutes || 0), 0) / businessHoursLeads.length)
      : 0;

    const afterHoursAverage = afterHoursLeads.length > 0
      ? Math.round(afterHoursLeads.reduce((sum, lead) => sum + (lead.response_time_minutes || 0), 0) / afterHoursLeads.length)
      : 0;

    return {
      averageResponseTime,
      averageResponseTimeFormatted: formatResponseTime(averageResponseTime),
      totalResponded: respondedLeads.length,
      totalLeads: leads.length,
      responseRate: Math.round((respondedLeads.length / leads.length) * 100),
      businessHoursAverage,
      afterHoursAverage,
      withinBusinessHours: businessHoursAverage > 0 && businessHoursAverage <= afterHoursAverage
    };
  }, [leads]);

  const markLeadAsResponded = async (leadId: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const respondedAt = new Date();
      const receivedAt = new Date(lead.received_at);
      const responseTimeMinutes = Math.round((respondedAt.getTime() - receivedAt.getTime()) / (1000 * 60));

      // Use a more flexible update approach to avoid type issues
      const { error } = await supabase
        .from('leads')
        .update({
          responded_at: respondedAt.toISOString(),
          response_time_minutes: responseTimeMinutes
        } as any)
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead response time:', error);
        return;
      }

      // Update local state
      setLeads(prev => prev.map(l => 
        l.id === leadId 
          ? { ...l, responded_at: respondedAt.toISOString(), response_time_minutes: responseTimeMinutes }
          : l
      ));

      return true;
    } catch (error) {
      console.error('Error marking lead as responded:', error);
      return false;
    }
  };

  return {
    metrics,
    loading,
    markLeadAsResponded,
    refetch: fetchLeads
  };
};
