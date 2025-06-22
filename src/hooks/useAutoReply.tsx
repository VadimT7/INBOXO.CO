import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';
import { toast } from 'sonner';

interface AutoReplySettings {
  enabled: boolean;
  tone: 'professional' | 'friendly' | 'casual';
  length: 'short' | 'medium' | 'detailed';
  confidenceThreshold: number;
  businessHoursOnly: boolean;
  maxDailyReplies: number;
}

export function useAutoReply() {
  const { user } = useAuthSession();
  const [settings, setSettings] = useState<AutoReplySettings>({
    enabled: false,
    tone: 'professional',
    length: 'medium',
    confidenceThreshold: 80,
    businessHoursOnly: true,
    maxDailyReplies: 50
  });
  const [loading, setLoading] = useState(false);

  // Load auto-reply settings
  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (data?.settings && typeof data.settings === 'object' && data.settings !== null) {
        const settingsObj = data.settings as any;
        if (settingsObj.autoReply) {
          setSettings(prev => ({ ...prev, ...settingsObj.autoReply }));
        }
      }
    } catch (error) {
      console.error('Error loading auto-reply settings:', error);
    }
  }, [user]);

  // Save auto-reply settings
  const saveSettings = useCallback(async (newSettings: Partial<AutoReplySettings>) => {
    if (!user) return;

    try {
      setLoading(true);

      // First get current settings
      const { data: currentData } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      const updatedSettings = {
        ...settings,
        ...newSettings
      };

      const currentSettingsObj = (currentData?.settings && typeof currentData.settings === 'object' && currentData.settings !== null) 
        ? currentData.settings as any 
        : {};

      const fullSettings = {
        ...currentSettingsObj,
        autoReply: updatedSettings
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: fullSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings(updatedSettings);
      toast.success('Auto-reply settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  }, [user, settings]);

  // Toggle auto-reply
  const toggleAutoReply = useCallback(async () => {
    await saveSettings({ enabled: !settings.enabled });
  }, [settings.enabled, saveSettings]);

  // Send auto-reply for a lead
  const sendAutoReply = useCallback(async (lead: any) => {
    if (!settings.enabled || !user) return false;

    try {
      console.log('Generating auto-reply for lead:', lead.id);

      // Get the current session to extract Google token
      const { data: { session } } = await supabase.auth.getSession();
      const googleToken = session?.provider_token;

      if (!googleToken) {
        console.error('No Google token available');
        toast.error('Please sign out and sign in again with Google to enable auto-reply');
        return false;
      }

      // First generate the AI response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-ai-response', {
        body: {
          emailContent: lead.full_content || lead.snippet || lead.subject,
          emailSubject: lead.subject,
          senderEmail: lead.sender_email,
          tone: settings.tone,
          length: settings.length
        }
      });

      if (aiError || !aiResponse?.response) {
        console.error('Failed to generate AI response:', aiError);
        return false;
      }

      console.log('AI response generated, sending email...');

      // Send the email with Google token
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-reply', {
        body: {
          leadId: lead.id,
          recipientEmail: lead.sender_email,
          subject: `Re: ${lead.subject}`,
          body: aiResponse.response
        },
        headers: {
          'X-Google-Token': googleToken
        }
      });

      if (emailError) {
        console.error('Failed to send auto-reply:', emailError);
        toast.error(`Failed to send auto-reply: ${emailError.message}`);
        return false;
      }

      console.log('✓ Auto-reply sent successfully');
      toast.success(`🤖 Auto-reply sent to ${lead.sender_email}!`);
      return true;

    } catch (error) {
      console.error('Error sending auto-reply:', error);
      return false;
    }
  }, [settings, user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    toggleAutoReply,
    saveSettings,
    sendAutoReply
  };
} 