import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';

interface AIResponseHistoryItem {
  id: string;
  lead_email: string;
  lead_subject: string;
  generated_response: string;
  tone: string;
  length: string;
  was_used: boolean;
  created_at: string;
}

interface UserWritingStyle {
  preferred_tone: string;
  preferred_length: string;
  custom_phrases: string[];
  signature?: string;
}

export const useAIResponseHistory = () => {
  const { user } = useAuthSession();
  const [history, setHistory] = useState<AIResponseHistoryItem[]>([]);
  const [writingStyle, setWritingStyle] = useState<UserWritingStyle>({
    preferred_tone: 'professional',
    preferred_length: 'medium',
    custom_phrases: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch user's writing style preferences
  const fetchWritingStyle = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_writing_style' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching writing style:', error);
        return;
      }

      if (data) {
        setWritingStyle({
          preferred_tone: (data as any).preferred_tone,
          preferred_length: (data as any).preferred_length,
          custom_phrases: (data as any).custom_phrases || [],
          signature: (data as any).signature
        });
      }
    } catch (error) {
      console.error('Error fetching writing style:', error);
    }
  };

  // Fetch response history
  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_response_history' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching response history:', error);
        return;
      }

      setHistory((data as any) || []);
    } catch (error) {
      console.error('Error fetching response history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save a generated response to history
  const saveResponseToHistory = async (
    leadId: string,
    leadEmail: string,
    leadSubject: string,
    leadContent: string,
    generatedResponse: string,
    tone: string,
    length: string
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('ai_response_history' as any)
        .insert({
          user_id: user.id,
          lead_id: leadId,
          lead_email: leadEmail,
          lead_subject: leadSubject,
          lead_content: leadContent,
          generated_response: generatedResponse,
          tone,
          length,
          was_used: false
        } as any);

      if (error) {
        console.error('Error saving response to history:', error);
        return false;
      }

      // Refresh history
      await fetchHistory();
      return true;
    } catch (error) {
      console.error('Error saving response to history:', error);
      return false;
    }
  };

  // Mark a response as used
  const markResponseAsUsed = async (responseId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('ai_response_history' as any)
        .update({ 
          was_used: true,
          was_sent: true,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', responseId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking response as used:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking response as used:', error);
      return false;
    }
  };

  // Update user's writing style preferences
  const updateWritingStyle = async (updates: Partial<UserWritingStyle>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_writing_style' as any)
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        } as any, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating writing style:', error);
        return false;
      }

      setWritingStyle(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('Error updating writing style:', error);
      return false;
    }
  };

  // Get similar past responses for context
  const getSimilarResponses = async (leadEmail: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('ai_response_history' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('lead_email', leadEmail)
        .eq('was_used', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching similar responses:', error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching similar responses:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchWritingStyle();
      fetchHistory();
    }
  }, [user]);

  return {
    history,
    writingStyle,
    loading,
    saveResponseToHistory,
    markResponseAsUsed,
    updateWritingStyle,
    getSimilarResponses
  };
}; 