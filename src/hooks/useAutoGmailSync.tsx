import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthSession } from './useAuthSession';
import { useGmailSync } from './useGmailSync';
import { toast } from 'sonner';

export function useAutoGmailSync(onNewLeads?: (newLeads: any[]) => void, onSyncComplete?: () => void) {
  const { user } = useAuthSession();
  const { syncGmailLeads, loading: manualSyncLoading } = useGmailSync();
  const [autoSyncLoading, setAutoSyncLoading] = useState(false);
  const [lastAutoSync, setLastAutoSync] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialSyncRef = useRef(false);

  // Auto-sync function with loading state
  const performAutoSync = useCallback(async () => {
    if (!user || manualSyncLoading) {
      console.log('⏸️ Skipping auto-sync: no user or manual sync in progress');
      return;
    }

    try {
      setAutoSyncLoading(true);
      console.log('🔄 Starting automatic Gmail sync...');
      
      // Perform the sync with a 1-day period for automatic sync
      const syncResult = await syncGmailLeads(1);
      
      setLastAutoSync(new Date());
      console.log('✅ Automatic Gmail sync completed successfully');
      
      // If we have new leads and a callback, call it
      if (syncResult?.new_leads_data && syncResult.new_leads_data.length > 0 && onNewLeads) {
        console.log(`📧 Auto-sync found ${syncResult.new_leads_data.length} new leads, processing for auto-reply...`);
        onNewLeads(syncResult.new_leads_data);
      }
      
      // Call sync complete callback to refresh UI
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('❌ Automatic Gmail sync failed:', error);
      // Don't show error toast for automatic sync to avoid spamming users
    } finally {
      setAutoSyncLoading(false);
    }
  }, [user, syncGmailLeads, manualSyncLoading, onNewLeads, onSyncComplete]);

  // Initial sync on login
  useEffect(() => {
    if (user && !hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
      console.log('👋 User logged in, performing initial Gmail sync...');
      
      // Delay initial sync slightly to let the UI settle
      const initialSyncTimeout = setTimeout(() => {
        performAutoSync();
      }, 1000);

      return () => clearTimeout(initialSyncTimeout);
    }
  }, [user, performAutoSync]);

  // Set up 5-minute interval for auto-sync
  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('⏰ Setting up automatic Gmail sync every 5 minutes...');
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval (5 minutes = 300,000ms)
    intervalRef.current = setInterval(() => {
      performAutoSync();
    }, 5 * 60 * 1000);

    // Cleanup on unmount or user change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, performAutoSync]);

  // Reset initial sync flag when user changes
  useEffect(() => {
    if (!user) {
      hasInitialSyncRef.current = false;
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
    autoSyncLoading,
    lastAutoSync,
    isAutoSyncEnabled: !!user,
    // Combined loading state - true if either manual or auto sync is running
    isAnySyncLoading: manualSyncLoading || autoSyncLoading,
    // Force an immediate auto-sync
    triggerAutoSync: performAutoSync
  };
} 