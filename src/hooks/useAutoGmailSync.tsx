import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthSession } from './useAuthSession';
import { useGmailSync } from './useGmailSync';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useAutoGmailSync(onNewLeads?: (newLeads: any[]) => void, onSyncComplete?: () => void) {
  const { user } = useAuthSession();
  const { syncGmailLeads, loading: manualSyncLoading } = useGmailSync();
  const [autoSyncLoading, setAutoSyncLoading] = useState(false);
  const [lastAutoSync, setLastAutoSync] = useState<Date | null>(null);
  const [isServerSyncEnabled, setIsServerSyncEnabled] = useState(false);
  const [serverSyncRunning, setServerSyncRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialSyncRef = useRef(false);
  const hasShownAutoSyncNotificationRef = useRef(false);
  const lastKnownSyncTime = useRef<Date | null>(null);

  // Check server-side auto-sync status
  useEffect(() => {
    if (user) {
      checkServerSyncStatus();
    }
  }, [user]);

  const checkServerSyncStatus = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('auto_sync_enabled, last_auto_sync, google_refresh_token')
        .eq('id', user!.id)
        .single();

      if (!error && profile) {
        const hasRefreshToken = !!profile.google_refresh_token;
        const autoSyncEnabled = profile.auto_sync_enabled && hasRefreshToken;
        
        setIsServerSyncEnabled(autoSyncEnabled);
        
        if (profile.last_auto_sync) {
          const lastSync = new Date(profile.last_auto_sync);
          setLastAutoSync(lastSync);
          lastKnownSyncTime.current = lastSync;
        }

        if (autoSyncEnabled) {
          console.log('🔄 Server-side auto-sync is active - syncing every 5 minutes regardless of browser state');
          // Only show notification once per session
          if (!hasShownAutoSyncNotificationRef.current) {
            hasShownAutoSyncNotificationRef.current = true;
            toast.success('🔄 Auto-sync is active! Your leads sync every 5 minutes even when offline.', {
              duration: 5000,
            });
          }
        } else if (!hasRefreshToken) {
          console.log('⚠️ Server-side auto-sync disabled - no refresh token');
          toast.warning('⚠️ For continuous auto-sync, please sign out and sign in again to grant offline access.', {
            duration: 8000,
            action: {
              label: 'Sign Out & Re-authenticate',
              onClick: async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }
            }
          });
        } else if (profile.auto_sync_enabled && !hasRefreshToken) {
          console.log('⚠️ Auto-sync enabled but missing refresh token');
          toast.warning('⚠️ Auto-sync requires re-authentication. Please sign out and sign in again.', {
            duration: 8000,
            action: {
              label: 'Re-authenticate',
              onClick: async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking server sync status:', error);
    }
  };

  // Client-side sync function (for immediate feedback and initial sync)
  const performClientSync = useCallback(async () => {
    if (!user || manualSyncLoading) {
      console.log('⏸️ Skipping client sync: no user or manual sync in progress');
      return;
    }

    try {
      setAutoSyncLoading(true);
      console.log('🔄 Starting client-side sync...');
      
      // Show immediate feedback to user
      toast.info('🔄 Syncing now...', {
        duration: 3000,
        id: 'client-sync-start'
      });
      
      // Perform the sync with a 1-day period
      const syncResult = await syncGmailLeads(1);
      
      const now = new Date();
      setLastAutoSync(now);
      lastKnownSyncTime.current = now;
      console.log('✅ Client-side sync completed successfully');
      
      // Show success notification
      toast.success('✅ Sync completed!', {
        duration: 2000,
        id: 'client-sync-complete'
      });
      
      // If we have new leads and a callback, call it
      if (syncResult?.new_leads_data && syncResult.new_leads_data.length > 0) {
        console.log(`📧 Found ${syncResult.new_leads_data.length} new leads`);
        console.log('🔍 New leads data structure:', syncResult.new_leads_data);
        
        // Show notification about new leads
        toast.success(`📧 Found ${syncResult.new_leads_data.length} new lead${syncResult.new_leads_data.length === 1 ? '' : 's'}!`, {
          duration: 4000,
        });
        
        if (onNewLeads) {
          console.log('🤖 Calling onNewLeads callback for auto-reply processing...');
          onNewLeads(syncResult.new_leads_data);
        }
      }
      
      // Call sync complete callback to refresh UI immediately
      if (onSyncComplete) {
        console.log('🔄 Refreshing UI after client sync...');
        onSyncComplete();
      }
    } catch (error) {
      console.error('❌ Client-side sync failed:', error);
      toast.error('❌ Sync failed. Server auto-sync will continue in background.', {
        duration: 3000,
      });
    } finally {
      setAutoSyncLoading(false);
    }
  }, [user, syncGmailLeads, manualSyncLoading, onNewLeads, onSyncComplete]);

  // Initial sync on login (immediate feedback)
  useEffect(() => {
    if (user && !hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
      console.log('👋 User logged in, performing initial client sync...');
      
      // Show immediate notification
      toast.info('🚀 Starting initial sync...', {
        duration: 3000,
      });
      
      // Delay initial sync slightly to let the UI settle
      const initialSyncTimeout = setTimeout(() => {
        performClientSync();
      }, 1000);

      return () => clearTimeout(initialSyncTimeout);
    }
  }, [user, performClientSync]);

  // Set up periodic check for server sync updates (every 30 seconds)
  useEffect(() => {
    if (!user || !isServerSyncEnabled) {
      return;
    }

    console.log('⏰ Setting up periodic check for server sync updates...');
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check for server sync updates every 30 seconds for better responsiveness
    intervalRef.current = setInterval(async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_auto_sync')
          .eq('id', user.id)
          .single();

        if (profile?.last_auto_sync) {
          const serverLastSync = new Date(profile.last_auto_sync);
          
          // Check if a sync is likely running (last sync was less than 30 seconds ago)
          const timeSinceLastSync = Date.now() - serverLastSync.getTime();
          const isSyncLikelyRunning = timeSinceLastSync < 30000; // 30 seconds
          
          setServerSyncRunning(isSyncLikelyRunning);
          
          // If the server sync time is newer than our last known time
          if (!lastKnownSyncTime.current || serverLastSync > lastKnownSyncTime.current) {
            setLastAutoSync(serverLastSync);
            lastKnownSyncTime.current = serverLastSync;
            console.log('🔄 Server auto-sync detected, refreshing UI...');
            
            // Show a subtle notification about the background sync
            toast.info('📧 Background sync completed - refreshing leads...', {
              duration: 2000,
            });
            
            // Note: Server-side auto-sync already processes auto-replies directly in the server function
            // We don't need to call onNewLeads here because the server has already handled auto-replies
            // We just need to refresh the UI to show the updated leads
            if (onSyncComplete) {
              onSyncComplete();
            }
          }
        }
      } catch (error) {
        console.error('Error checking server sync status:', error);
      }
    }, 30 * 1000); // Check every 30 seconds

    // Cleanup on unmount or user change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, isServerSyncEnabled, onSyncComplete]);

  // Reset initial sync flag when user changes
  useEffect(() => {
    if (!user) {
      hasInitialSyncRef.current = false;
      hasShownAutoSyncNotificationRef.current = false;
      setIsServerSyncEnabled(false);
      setLastAutoSync(null);
      lastKnownSyncTime.current = null;
      setServerSyncRunning(false);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    autoSyncLoading: autoSyncLoading || serverSyncRunning,
    lastAutoSync,
    isAutoSyncEnabled: !!user && isServerSyncEnabled,
    isServerSyncEnabled,
    // Force an immediate client-side sync
    triggerAutoSync: performClientSync
  };
} 