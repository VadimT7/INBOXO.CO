import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';
import { toast } from 'sonner';
import { Bot } from 'lucide-react';

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
    if (!settings.enabled || !user) {
      console.log('Auto-reply disabled or no user:', { enabled: settings.enabled, user: !!user });
      return false;
    }

    // TODO: Re-enable business hours check later with proper timezone handling
    // For now, allow auto-replies at any time to ensure functionality works
    // if (settings.businessHoursOnly) {
    //   const now = new Date();
    //   const currentHour = now.getHours();
    //   const isBusinessHours = currentHour >= 9 && currentHour <= 17; // 9 AM to 5 PM
    //   
    //   if (!isBusinessHours) {
    //     console.log('Outside business hours, skipping auto-reply');
    //     return false;
    //   }
    // }

    try {
      console.log('🤖 Starting auto-reply process for lead:', {
        leadId: lead.id,
        senderEmail: lead.sender_email,
        subject: lead.subject,
        status: lead.status
      });

      // Get the current session to extract Google token
      const { data: sessionData } = await supabase.auth.getSession();
      
      // The Google OAuth token is stored in provider_token
      const googleToken = sessionData?.session?.provider_token;

      if (!googleToken) {
        console.error('No Google token available');
        toast.error('Google authentication required. Please sign out and sign in again to enable auto-reply.', {
          duration: 5000,
          action: {
            label: 'Sign Out',
            onClick: async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }
          }
        });
        return false;
      }

      // Get auth token for edge function calls
      const authToken = sessionData?.session?.access_token;
      if (!authToken) {
        console.error('No auth token available');
        toast.error('Authentication issue. Please sign out and sign in again.');
        return false;
      }

      // First generate the AI response
      console.log('Generating AI response...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-ai-response', {
        body: {
          emailContent: lead.full_content || lead.snippet || lead.subject,
          emailSubject: lead.subject,
          senderEmail: lead.sender_email,
          tone: settings.tone,
          length: settings.length
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (aiError || !aiResponse?.response) {
        console.error('Failed to generate AI response:', aiError);
        toast.error('Failed to generate AI response');
        return false;
      }

      console.log('✅ AI response generated successfully');

      // Send the email with Google token
      console.log('🚀 Sending auto-reply email...');

      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-reply', {
        body: {
          leadId: lead.id,
          recipientEmail: lead.sender_email,
          subject: `Re: ${lead.subject}`,
          body: aiResponse.response
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Google-Token': googleToken
        }
      });

      if (emailError) {
        console.error('❌ Failed to send auto-reply:', emailError);
        
        // Check for specific error messages
        if (emailError.message?.includes('403') || emailError.message?.includes('Gmail API access denied')) {
          toast.error('Gmail send permission not granted. Please sign out and sign in again to grant email sending permissions.', {
            duration: 5000,
            action: {
              label: 'Sign Out',
              onClick: async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }
            }
          });
        } else if (emailError.message?.includes('401') || emailError.message?.includes('invalid or expired')) {
          toast.error('Google access token expired. Please sign out and sign in again to refresh permissions.', {
            duration: 5000,
            action: {
              label: 'Sign Out',
              onClick: async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }
            }
          });
        } else {
          toast.error(`Failed to send auto-reply: ${emailError.message}`);
        }
        return false;
      }

      console.log('✅ Auto-reply sent successfully:', emailResult);
      
      // The edge function already updates the lead status, so we don't need to do it here
      toast.success(
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-500" />
          <span>Auto-reply sent to {lead.sender_email}!</span>
        </div>,
        { duration: 3000 }
      );
      return true;

    } catch (error: any) {
      console.error('❌ Error sending auto-reply:', error);
      
      // Check if it's a network error or other issue
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to send auto-reply. Please try again.');
      }
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