
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';

interface Lead {
  id: string;
  received_at: string;
  responded_at?: string;
  response_time_minutes?: number;
  status: string;
  sender_email: string;
  subject?: string;
  snippet?: string;
  full_content?: string;
  notes?: string;
  answered?: boolean;
  is_archived?: boolean;
  gmail_message_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ResponseTimeStats {
  averageTime: number;
  totalResponses: number;
  fastestResponse: number;
  slowestResponse: number;
  responseRate: number;
}

export function useResponseTimeAnalytics() {
  const { user } = useAuthSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<ResponseTimeStats>({
    averageTime: 0,
    totalResponses: 0,
    fastestResponse: 0,
    slowestResponse: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching leads:', error);
        setLeads([]);
        return;
      }

      if (data) {
        setLeads(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData: Lead[]) => {
    const respondedLeads = leadsData.filter(lead => 
      lead.response_time_minutes !== null && 
      lead.response_time_minutes !== undefined
    );

    if (respondedLeads.length === 0) {
      setStats({
        averageTime: 0,
        totalResponses: 0,
        fastestResponse: 0,
        slowestResponse: 0,
        responseRate: 0
      });
      return;
    }

    const responseTimes = respondedLeads.map(lead => lead.response_time_minutes!);
    const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const fastestResponse = Math.min(...responseTimes);
    const slowestResponse = Math.max(...responseTimes);
    const responseRate = (respondedLeads.length / leadsData.length) * 100;

    setStats({
      averageTime: Math.round(averageTime),
      totalResponses: respondedLeads.length,
      fastestResponse,
      slowestResponse,
      responseRate: Math.round(responseRate)
    });
  };

  return {
    leads,
    stats,
    loading,
    refetch: fetchLeads
  };
}
