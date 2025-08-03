import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGmailSync } from '@/hooks/useGmailSync';
import { useAutoGmailSync } from '@/hooks/useAutoGmailSync';
import { useResponseTimeAnalytics } from '@/hooks/useResponseTimeAnalytics';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useAutoReply } from '@/hooks/useAutoReply';
import { AutoReplyToggle } from '@/components/AutoReplyToggle';
import { toast } from 'sonner';
import { 
  RefreshCw, Mail, Search, Filter, Zap, Target, Trophy, Star,
  Clock, User, ChevronRight, Flame, Snowflake, ThermometerSun,
  CheckCircle2, Circle, TrendingUp, Calendar, MoreHorizontal,
  Eye, ExternalLink, Archive, Trash2, Heart, AlertTriangle,
  MessageSquare, Send, ArrowLeft, Copy, Share2, GripVertical,
  ChevronDown, ChevronUp, Square, CheckSquare, X, Bot, Sparkles,
  Building2,
  Phone,
  MoreVertical,
  Plus,
  History,
  ChevronLeft,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useConfetti } from '@/hooks/useConfetti';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AIResponseGenerator } from '@/components/AIResponseGenerator';
import SubscriptionOverlay from '@/components/subscription/SubscriptionOverlay';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Lead {
  id: string;
  sender_email: string;
  subject: string;
  snippet: string;
  full_content?: string;
  received_at: string;
  status: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  responded_at?: string | null;
  response_time_minutes?: number | null;
  answered?: boolean;
  auto_replied?: boolean;
  gmail_reply_id?: string;
  sort_order?: number;
}

const LeadsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const confetti = useConfetti();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthSession();
  const { syncGmailLeads, loading: syncLoading } = useGmailSync();
  const { 
    autoSyncLoading, 
    lastAutoSync, 
    isAutoSyncEnabled, 
    triggerAutoSync,
    isServerSyncEnabled
  } = useAutoGmailSync(
    (newLeads) => {
      // Process new leads for auto-reply when found by auto-sync
      if (newLeads.length > 0 && autoReplySettings.enabled) {
        console.log(`🤖 Auto-sync found ${newLeads.length} new leads, processing for auto-reply...`);
        processNewLeadsForAutoReply(newLeads);
      }
    },
    async () => {
      // Refresh leads list when auto-sync completes
      console.log('🔄 Auto-sync completed, refreshing leads list...');
      try {
        await fetchLeads();
        console.log('✅ Leads list refreshed successfully after auto-sync');
      } catch (error) {
        console.error('❌ Error refreshing leads after auto-sync:', error);
        toast.error('Failed to refresh leads after auto-sync');
      }
    }
  );
  const { markLeadAsResponded } = useResponseTimeAnalytics();
  const { hasValidAccess } = useSubscriptionStatus();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [answeredFilter, setAnsweredFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Session-based sync period state (default to 1 day)
  const [sessionSyncPeriod, setSessionSyncPeriod] = useState(1);
  
  // Auto-reply
  const { 
    settings: autoReplySettings, 
    sendAutoReply,
    toggleAutoReply,
    saveSettings: saveAutoReplySettings
  } = useAutoReply();
  
  // Additional state for auto-reply management
  const [autoReplyingLeads, setAutoReplyingLeads] = useState<Set<string>>(new Set());
  
  // Track processed leads to prevent infinite loops
  const processedLeadsRef = useRef<Set<string>>(new Set());

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    variant: 'danger',
    onConfirm: () => {},
    isLoading: false,
  });

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 220, // ms to hold before drag starts
        tolerance: 5, // allow small movement before drag
      },
    })
  );

  // Helper functions for confirmation modals
  const showConfirmation = (config: {
    title: string;
    description: string;
    confirmText: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
  }) => {
    setConfirmationModal({
      isOpen: true,
      title: config.title,
      description: config.description,
      confirmText: config.confirmText,
      variant: config.variant || 'danger',
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        try {
          await config.onConfirm();
        } finally {
          setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
      isLoading: false,
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
  };

  // Bulk selection helpers
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(leadId)) {
        newSelection.delete(leadId);
      } else {
        newSelection.add(leadId);
      }
      return newSelection;
    });
  };

  const selectAllVisibleLeads = () => {
    const visibleLeadIds = filteredLeads.map(lead => lead.id);
    setSelectedLeadIds(new Set(visibleLeadIds));
  };

  const deselectAllLeads = () => {
    setSelectedLeadIds(new Set());
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      deselectAllLeads();
    }
  };

  const bulkDeleteLeads = async (leadIds: string[]) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .in('id', leadIds);

      if (error) {
        toast.error('Failed to delete leads');
        return;
      }

      // Update state more carefully to prevent blank page
      const deletedAt = new Date().toISOString();
      setAllLeads(prev => {
        const updated = prev.map(lead => 
          leadIds.includes(lead.id) 
            ? { ...lead, is_deleted: true, deleted_at: deletedAt } 
            : lead
        );
        console.log('Updated leads after bulk delete:', updated.length);
        return updated;
      });
      
      toast.success(`${leadIds.length} leads deleted • View in Recently Deleted to restore`, {
        duration: 4000,
      });
      
      // Clear selection and exit selection mode
      deselectAllLeads();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error bulk deleting leads:', error);
      toast.error('Failed to delete leads');
    }
  };

  const bulkRestoreLeads = async (leadIds: string[]) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          is_deleted: false, 
          deleted_at: null 
        })
        .in('id', leadIds);

      if (error) {
        toast.error('Failed to restore leads');
        return;
      }

      setAllLeads(prev => prev.map(lead => 
        leadIds.includes(lead.id) 
          ? { ...lead, is_deleted: false, deleted_at: null } 
          : lead
      ));
      
      toast.success(`${leadIds.length} leads restored`);
      
      // Clear selection
      deselectAllLeads();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error bulk restoring leads:', error);
      toast.error('Failed to restore leads');
    }
  };

  const bulkPermanentlyDeleteLeads = async (leadIds: string[]) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);

      if (error) {
        toast.error('Failed to permanently delete leads');
        return;
      }

      setAllLeads(prev => prev.filter(lead => !leadIds.includes(lead.id)));
      
      toast.success(`${leadIds.length} leads permanently deleted`);
      
      // Clear selection
      deselectAllLeads();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error bulk permanently deleting leads:', error);
      toast.error('Failed to permanently delete leads');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    setOverId(over.id as string);

    // Only reorder if dragging over another lead (not a column)
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    // Find the active and over leads in the current leads array
    const activeIndex = leads.findIndex(lead => lead.id === activeId);
    const overIndex = leads.findIndex(lead => lead.id === overId);

    // Only reorder if both are valid and in the same column
    if (activeIndex !== -1 && overIndex !== -1) {
      const activeLead = leads[activeIndex];
      const overLead = leads[overIndex];
      if (activeLead.status === overLead.status) {
        setAllLeads(prev => {
          // Only reorder within the same status
          const filtered = prev.filter(l => l.status === activeLead.status && !l.is_deleted);
          const ids = filtered.map(l => l.id);
          const from = ids.indexOf(activeId);
          const to = ids.indexOf(overId);
          if (from === -1 || to === -1) return prev;
          // Get all leads in this status
          const reordered = arrayMove(filtered, from, to);
          // Merge back into prev
          let result = [...prev];
          let j = 0;
          for (let i = 0; i < result.length; i++) {
            if (result[i].status === activeLead.status && !result[i].is_deleted) {
              result[i] = reordered[j++];
            }
          }
          return result;
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the active lead
    const activeLead = leads.find(lead => lead.id === activeId);
    if (!activeLead) return;

    // Check if over is a column
    const validStatuses = ['unclassified', 'hot', 'warm', 'cold'];
    
    // If dropping on a column header
    if (validStatuses.includes(overId)) {
      if (activeLead.status !== overId) {
        updateLeadStatus(activeId, overId);
        
        // Show success message
        const statusEmojis = {
          hot: '🔥',
          warm: '🌤️', 
          cold: '❄️',
          unclassified: '📋'
        };
        const emoji = statusEmojis[overId as keyof typeof statusEmojis] || '✅';
        toast.success(`${emoji} Lead moved to ${overId}!`, {
          duration: 2000,
        });
      }
      return;
    }

    // If dropping on another lead, we need to handle reordering
    const overLead = leads.find(lead => lead.id === overId);
    if (!overLead) return;

    // If leads are in different columns, move to new column
    if (activeLead.status !== overLead.status) {
      updateLeadStatus(activeId, overLead.status);
      
      const statusEmojis = {
        hot: '🔥',
        warm: '🌤️', 
        cold: '❄️',
        unclassified: '📋'
      };
      const emoji = statusEmojis[overLead.status as keyof typeof statusEmojis] || '✅';
      toast.success(`${emoji} Lead moved to ${overLead.status}!`, {
        duration: 2000,
      });
    } else {
      // Same column - just reorder
      const activeIndex = leads.findIndex(lead => lead.id === activeId);
      const overIndex = leads.findIndex(lead => lead.id === overId);
      
      if (activeIndex !== overIndex) {
        setAllLeads(prev => arrayMove(prev, activeIndex, overIndex));
      }
    }
  };

  const fetchLeads = async () => {
    if (!user) {
      setAllLeads([]);
      setLoading(false);
      return [];
    }

    try {
      // Fetch ALL leads (both active and deleted) in one query
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to fetch leads');
        return [];
      }

      const leads = data || [];
      setAllLeads(leads);
      return leads;
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead status:', error);
        toast.error('Failed to update lead status');
        return;
      }

      // Update local state
      setAllLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      // Show success message
      if (newStatus !== 'unclassified') {
        const rewards = ['🎉', '🚀', '⭐', '🏆', '💪'];
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        
        toast.success(`${randomReward} Lead classified!`, {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  // Process new leads for auto-reply
  const processNewLeadsForAutoReply = useCallback(async (newLeads: Lead[]) => {
    if (!newLeads.length) return;
    
    console.log('🤖 Auto-reply processing started:', {
      totalNewLeads: newLeads.length,
      autoReplyEnabled: autoReplySettings.enabled,
      settings: autoReplySettings,
      newLeadsData: newLeads
    });
    
    // Check if auto-reply is enabled
    if (!autoReplySettings.enabled) {
      console.log('Auto-reply is disabled, skipping processing');
      return;
    }
    
    console.log('Processing new leads for auto-reply:', newLeads.length);
    
    // Only process leads that haven't been answered yet and haven't been auto-replied to
    const unansweredLeads = newLeads.filter(lead => {
      const isAnswered = lead.answered === true;
      const isAutoReplied = lead.auto_replied === true;
      const isProcessed = processedLeadsRef.current.has(lead.id);
      
      console.log(`🔍 Lead ${lead.sender_email}:`, {
        answered: isAnswered,
        auto_replied: isAutoReplied,
        processed: isProcessed,
        eligible: !isAnswered && !isAutoReplied && !isProcessed
      });
      
      return !isAnswered && !isAutoReplied && !isProcessed;
    });
    
    console.log(`Found ${unansweredLeads.length} unanswered leads eligible for auto-reply`);
    console.log('Lead statuses:', unansweredLeads.map(l => ({ 
      email: l.sender_email, 
      status: l.status,
      answered: l.answered,
      auto_replied: l.auto_replied 
    })));
    
    // Filter for hot and warm leads
    const leadsToAutoReply = unansweredLeads.filter(lead => 
      lead.status === 'hot' || lead.status === 'warm'
    );
    
    console.log(`🔥 Found ${leadsToAutoReply.length} hot/warm leads to auto-reply`);
    console.log('Eligible leads for auto-reply:', leadsToAutoReply.map(l => ({
      id: l.id,
      email: l.sender_email,
      status: l.status,
      answered: l.answered,
      auto_replied: l.auto_replied
    })));
    
    if (leadsToAutoReply.length === 0) {
      console.log('❄️ No hot/warm leads found for auto-reply');
      return;
    }
    
    // Mark leads as being processed to prevent re-processing
    leadsToAutoReply.forEach(lead => {
      processedLeadsRef.current.add(lead.id);
    });
    
    // Add all leads to loading state at once
    setAutoReplyingLeads(prev => {
      const newSet = new Set(prev);
      leadsToAutoReply.forEach(lead => newSet.add(lead.id));
      return newSet;
    });
    
    // Process all leads in parallel for faster processing
    const autoReplyPromises = leadsToAutoReply.map(async (lead) => {
      console.log(`🔥 Auto-replying to ${lead.status} lead from ${lead.sender_email}`);
      
      try {
        const success = await sendAutoReply(lead);
        if (success) {
          console.log(`✅ Auto-reply sent successfully to ${lead.sender_email}`);
          
          // Update local state to reflect the change
          setAllLeads(prev => prev.map(l => 
            l.id === lead.id 
              ? { ...l, answered: true, auto_replied: true, responded_at: new Date().toISOString() }
              : l
          ));
          
          // Show success toast
          toast.success(
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              <span>Auto-replied to {lead.sender_email}</span>
            </div>,
            { duration: 3000 }
          );
          
          return { lead, success: true };
        } else {
          console.error(`❌ Failed to auto-reply to ${lead.sender_email}`);
          // Remove from processed set if failed so it can be retried later
          processedLeadsRef.current.delete(lead.id);
          return { lead, success: false };
        }
      } catch (error) {
        console.error(`❌ Error during auto-reply to ${lead.sender_email}:`, error);
        // Remove from processed set if failed so it can be retried later
        processedLeadsRef.current.delete(lead.id);
        return { lead, success: false, error };
      } finally {
        // Remove lead from loading state
        setAutoReplyingLeads(prev => {
          const newSet = new Set(prev);
          newSet.delete(lead.id);
          return newSet;
        });
      }
    });
    
    // Wait for all auto-replies to complete
    const results = await Promise.all(autoReplyPromises);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✨ Auto-reply batch complete: ${successCount} succeeded, ${failCount} failed`);
    
    // Show summary toast if multiple leads were processed
    if (leadsToAutoReply.length > 1) {
      if (failCount === 0) {
        toast.success(`🎉 Auto-replied to all ${successCount} leads!`, { duration: 4000 });
      } else if (successCount > 0) {
        toast.warning(`Auto-replied to ${successCount} leads, ${failCount} failed`, { duration: 4000 });
      } else {
        toast.error(`Failed to auto-reply to all ${failCount} leads`, { duration: 4000 });
      }
    }
  }, [autoReplySettings.enabled, sendAutoReply, autoReplySettings]);

  // Test auto-reply for debugging
  const testAutoReply = async () => {
    console.log('🧪 Testing auto-reply functionality...');
    
    // Find the most recent hot or warm lead that hasn't been auto-replied to
    const testLead = leads.find(lead => 
      (lead.status === 'hot' || lead.status === 'warm') && 
      !lead.answered && 
      !lead.auto_replied
    );
    
    if (!testLead) {
      toast.error('No eligible leads found for testing. Need a hot/warm lead that hasn\'t been answered or auto-replied to.');
      return;
    }
    
    console.log('🎯 Testing auto-reply with lead:', {
      id: testLead.id,
      email: testLead.sender_email,
      subject: testLead.subject,
      status: testLead.status
    });
    
    // Add lead to loading state
    setAutoReplyingLeads(prev => new Set([...prev, testLead.id]));
    
    try {
      const success = await sendAutoReply(testLead);
      if (success) {
        // Update local state to reflect the change
        setAllLeads(prev => prev.map(l => 
          l.id === testLead.id 
            ? { ...l, answered: true, auto_replied: true, responded_at: new Date().toISOString() }
            : l
        ));
        
        toast.success(
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-500" />
            <span>Test auto-reply sent to {testLead.sender_email}!</span>
          </div>,
          { duration: 3000 }
        );
      }
    } catch (error) {
      console.error('Test auto-reply failed:', error);
      toast.error('Test auto-reply failed. Check console for details.');
    } finally {
      // Remove lead from loading state
      setAutoReplyingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(testLead.id);
        return newSet;
      });
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to delete lead');
        return;
      }

      setAllLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, is_deleted: true, deleted_at: new Date().toISOString() } : lead
      ));
      toast.success('Lead deleted • View in Recently Deleted to restore', {
        duration: 4000,
      });
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const restoreLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          is_deleted: false, 
          deleted_at: null 
        })
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to restore lead');
        return;
      }

      setAllLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, is_deleted: false, deleted_at: null } : lead
      ));
      toast.success('Lead restored');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error restoring lead:', error);
      toast.error('Failed to restore lead');
    }
  };

  const permanentlyDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to permanently delete lead');
        return;
      }

      setAllLeads(prev => prev.filter(lead => lead.id !== leadId));
      toast.success('Lead permanently deleted');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error permanently deleting lead:', error);
      toast.error('Failed to permanently delete lead');
    }
  };

  const toggleAnsweredStatus = async (leadId: string, answered: boolean) => {
    try {
      // Trigger animation and confetti only when marking as answered
      if (answered) {
        setIsAnimating(true);
        confetti.triggerSuccess(); // Add confetti celebration!
        setTimeout(() => setIsAnimating(false), 1000);
      }

      const updateData: any = { answered };
      
      // If marking as answered, also set responded_at if not already set
      if (answered) {
        const lead = leads.find(l => l.id === leadId);
        if (lead && !lead.responded_at) {
          updateData.responded_at = new Date().toISOString();
          
          // Calculate response time if we have the received_at time
          if (lead.received_at) {
            const responseTime = Math.floor(
              (new Date().getTime() - new Date(lead.received_at).getTime()) / (1000 * 60)
            );
            updateData.response_time_minutes = responseTime;
          }
        }
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to update lead status');
        return;
      }

      // Update leads state
      setAllLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, ...updateData } : lead
      ));

      // Update selectedLead state immediately if it's the same lead
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, ...updateData } : null);
      }

      toast.success(answered ? '✅ Lead marked as answered!' : '↩️ Lead marked as unanswered');
    } catch (error) {
      console.error('Error updating answered status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleSyncGmail = async (period?: number) => {
    try {
      // Don't allow manual sync if auto-sync is running
      if (autoSyncLoading) {
        toast.info('🔄 Auto-sync is currently running, please wait...', {
          duration: 3000,
        });
        return;
      }

      setShowDeleted(false); // Switch back to main view when syncing
      
      // Use provided period or fall back to session sync period
      const syncPeriod = period !== undefined ? period : sessionSyncPeriod;
      
      // If a specific period was provided, update the session sync period
      if (period !== undefined) {
        setSessionSyncPeriod(period);
      }
      
      console.log('🔄 Starting manual Gmail sync...');
      console.log(`📅 Sync period: ${syncPeriod} days (session default: ${sessionSyncPeriod} days)`);
      
      // Show immediate feedback
      toast.info(`🔄 Starting manual sync (${syncPeriod} day${syncPeriod === 1 ? '' : 's'})...`, {
        duration: 2000,
        id: 'manual-sync-start'
      });
      
      // Get current lead IDs before sync
      const leadIdsBefore = new Set(allLeads.map(lead => lead.id));
      
      // Sync Gmail and get the result with new leads data
      const syncResult = await syncGmailLeads(syncPeriod);
      
      console.log('📧 Gmail sync result:', {
        newLeadsCount: syncResult?.new_leads_data?.length || 0,
        totalNewEmails: syncResult?.total_new_emails || 0,
        autoReplyEnabled: autoReplySettings.enabled
      });
      
      // Show success notification
      toast.success('✅ Manual sync completed!', {
        duration: 2000,
        id: 'manual-sync-complete'
      });
      
      // Refresh all leads in the UI and get the updated data
      console.log('🔄 Refreshing leads list after manual sync...');
      const updatedLeads = await fetchLeads();
      
      // Find truly new leads by comparing IDs
      const newLeads = updatedLeads.filter(lead => !leadIdsBefore.has(lead.id));
      
      console.log('🆕 New leads detected:', {
        count: newLeads.length,
        leads: newLeads.map(l => ({ 
          id: l.id, 
          email: l.sender_email, 
          status: l.status,
          subject: l.subject 
        }))
      });

      // Show notification about new leads found
      if (newLeads.length > 0) {
        toast.success(`📧 Found ${newLeads.length} new lead${newLeads.length === 1 ? '' : 's'}!`, {
          duration: 4000,
        });
      } else {
        toast.info('📭 No new leads found', {
          duration: 2000,
        });
      }
      
      // Process new leads for auto-reply if any were found
      if (newLeads.length > 0 && autoReplySettings.enabled) {
        console.log(`🤖 Processing ${newLeads.length} new leads for auto-reply...`);
        
        // Process immediately without delay
        await processNewLeadsForAutoReply(newLeads);
      } else if (newLeads.length === 0) {
        console.log('📭 No new leads found during sync');
      } else {
        console.log('🔕 Auto-reply is disabled, skipping processing');
      }
    } catch (error) {
      console.error('Gmail sync error:', error);
      toast.error('❌ Manual sync failed. Please try again.', {
        duration: 4000,
      });
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard');
  };

  const openInGmail = (email: string, subject: string) => {
    const searchQuery = `from:${email} subject:"${subject}"`;
    const gmailUrl = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(searchQuery)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleReplyToLead = async (lead: Lead, message?: string) => {
    // Mark as responded when user clicks reply
    if (markLeadAsResponded) {
      await markLeadAsResponded(lead.id);
      toast.success('Response time recorded!');
    }
    
    // Automatically mark as answered
    await toggleAnsweredStatus(lead.id, true);
    
    // Open email client with optional pre-filled message
    const subject = `Re: ${lead.subject}`;
    let mailtoUrl = `mailto:${lead.sender_email}?subject=${encodeURIComponent(subject)}`;
    
    if (message) {
      // Clean up the message for email body
      const cleanMessage = message.replace(/\n/g, '%0D%0A');
      mailtoUrl += `&body=${encodeURIComponent(message)}`;
    }
    
    window.location.href = mailtoUrl;
  };

  // Computed property for current leads based on view
  const leads = useMemo(() => {
    if (showDeleted) {
      return allLeads
        .filter(lead => lead.is_deleted)
        .sort((a, b) => {
          const aDate = new Date(a.deleted_at || 0).getTime();
          const bDate = new Date(b.deleted_at || 0).getTime();
          return bDate - aDate; // Most recently deleted first
        });
    } else {
      return allLeads
        .filter(lead => !lead.is_deleted)
        .sort((a, b) => {
          const aDate = new Date(a.received_at).getTime();
          const bDate = new Date(b.received_at).getTime();
          return bDate - aDate; // Most recently received first
        });
    }
  }, [allLeads, showDeleted]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchLeads();
      // Clear processed leads cache when user changes or on initial load
      processedLeadsRef.current.clear();
    } else if (!authLoading && !user) {
      setAllLeads([]);
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    // Reset showFullContent and showAIResponse when modal opens/closes or lead changes
    if (!showDetailsModal || !selectedLead) {
      setShowFullContent(false);
      setShowAIResponse(false);
    }
  }, [showDetailsModal, selectedLead?.id]);

  // Check for subscription success
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      // Mark that user has completed subscription flow
      localStorage.setItem('subscriptionPageSeen', 'true');
      localStorage.setItem('userHasLoggedIn', 'true');
      
      // Show success message
      toast.success('🎉 Welcome to Inboxo! Your subscription is active. Let\'s start organizing your leads!', {
        duration: 4000,
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/leads');
    }
  }, [searchParams]);

  // Clear selection when switching between views
  useEffect(() => {
    deselectAllLeads();
    setIsSelectionMode(false);
  }, [showDeleted]);

  // Helper function to determine if content should be truncated
  const shouldTruncateContent = (content: string) => {
    return content && content.length > 300;
  };

  // Helper function to get display content
  const getDisplayContent = (lead: Lead) => {
    const content = lead.full_content || lead.snippet || '';
    if (!showFullContent && shouldTruncateContent(content)) {
      return content.substring(0, 300) + '...';
    }
    return content;
  };

  // Filter leads based on search query and answered status
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.sender_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.snippet.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAnsweredFilter = answeredFilter === 'all' || 
        (answeredFilter === 'answered' && lead.answered) ||
        (answeredFilter === 'unanswered' && !lead.answered);
      
      return matchesSearch && matchesAnsweredFilter;
    });
  }, [leads, searchQuery, answeredFilter]);

  const categorizedLeads = useMemo(() => ({
    unclassified: filteredLeads.filter(lead => lead.status === 'unclassified'),
    hot: filteredLeads.filter(lead => lead.status === 'hot'),
    warm: filteredLeads.filter(lead => lead.status === 'warm'),
    cold: filteredLeads.filter(lead => lead.status === 'cold')
  }), [filteredLeads]);

  // Basic metrics
  const totalLeads = showDeleted ? leads.length : leads.filter(l => !l.is_deleted).length;
  const classifiedLeads = showDeleted ? 0 : leads.filter(l => !l.is_deleted && l.status !== 'unclassified').length;
  const answeredLeads = showDeleted ? 0 : leads.filter(l => !l.is_deleted && l.answered).length;
  const completionPercentage = totalLeads > 0 ? (classifiedLeads / totalLeads) * 100 : 0;
  const answeredPercentage = totalLeads > 0 ? (answeredLeads / totalLeads) * 100 : 0;

  // Selection metrics
  const selectedLeads = Array.from(selectedLeadIds);
  const isAllSelected = filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length;
  const isSomeSelected = selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length;

  // Clear processed leads when auto-reply is disabled/enabled
  useEffect(() => {
    if (!autoReplySettings.enabled) {
      // Clear processed leads when auto-reply is disabled so they can be processed again when re-enabled
      processedLeadsRef.current.clear();
      console.log('🔄 Auto-reply disabled, cleared processed leads cache');
    } else {
      console.log('✅ Auto-reply enabled, processed leads cache size:', processedLeadsRef.current.size);
    }
  }, [autoReplySettings.enabled]);

  // Debug function to manually clear processed leads cache
  const clearProcessedLeadsCache = () => {
    processedLeadsRef.current.clear();
    console.log('🧹 Manually cleared processed leads cache');
    toast.info('Processed leads cache cleared - auto-reply will retry all eligible leads');
  };

  // Effect to watch for new leads and trigger auto-reply
  useEffect(() => {
    console.log('🔍 Auto-reply effect triggered:', {
      autoReplyEnabled: autoReplySettings.enabled,
      totalLeads: allLeads.length,
      processedCacheSize: processedLeadsRef.current.size,
      autoReplyingLeadsSize: autoReplyingLeads.size
    });

    // Only run if auto-reply is enabled and we have leads
    if (!autoReplySettings.enabled || allLeads.length === 0) {
      if (!autoReplySettings.enabled) {
        console.log('❌ Auto-reply is disabled, skipping effect');
      }
      if (allLeads.length === 0) {
        console.log('📭 No leads available, skipping effect');
      }
      return;
    }
    
    // Find leads that need auto-reply (hot/warm, not answered, not auto-replied)
    const leadsNeedingAutoReply = allLeads.filter(lead => {
      const isDeleted = lead.is_deleted === true;
      const isAnswered = lead.answered === true;
      const isAutoReplied = lead.auto_replied === true;
      const isHotOrWarm = lead.status === 'hot' || lead.status === 'warm';
      const isBeingProcessed = autoReplyingLeads.has(lead.id);
      const isAlreadyProcessed = processedLeadsRef.current.has(lead.id);
      
      const eligible = !isDeleted && !isAnswered && !isAutoReplied && isHotOrWarm && !isBeingProcessed && !isAlreadyProcessed;
      
      if (isHotOrWarm && !isDeleted) {
        console.log(`🔍 Lead ${lead.sender_email} (${lead.status}):`, {
          deleted: isDeleted,
          answered: isAnswered,
          auto_replied: isAutoReplied,
          hot_or_warm: isHotOrWarm,
          being_processed: isBeingProcessed,
          already_processed: isAlreadyProcessed,
          eligible: eligible
        });
      }
      
      return eligible;
    });
    
    console.log('🔍 Leads analysis for auto-reply:', {
      totalActiveLeads: allLeads.filter(l => !l.is_deleted).length,
      hotWarmLeads: allLeads.filter(l => !l.is_deleted && (l.status === 'hot' || l.status === 'warm')).length,
      unansweredHotWarm: allLeads.filter(l => !l.is_deleted && !l.answered && (l.status === 'hot' || l.status === 'warm')).length,
      notAutoReplied: allLeads.filter(l => !l.is_deleted && !l.answered && !l.auto_replied && (l.status === 'hot' || l.status === 'warm')).length,
      eligibleForAutoReply: leadsNeedingAutoReply.length,
      processedIds: Array.from(processedLeadsRef.current),
      autoReplyingIds: Array.from(autoReplyingLeads)
    });
    
    if (leadsNeedingAutoReply.length > 0) {
      console.log('🚨 Found leads needing auto-reply:', leadsNeedingAutoReply.map(l => ({
        id: l.id,
        email: l.sender_email,
        status: l.status,
        answered: l.answered,
        auto_replied: l.auto_replied
      })));
      
      // Mark leads as being processed to prevent re-processing
      leadsNeedingAutoReply.forEach(lead => {
        processedLeadsRef.current.add(lead.id);
      });
      
      // Process them immediately
      processNewLeadsForAutoReply(leadsNeedingAutoReply);
    } else {
      console.log('📭 No leads need auto-reply at this time');
    }
  }, [allLeads, autoReplySettings.enabled, autoReplyingLeads]); // Removed processNewLeadsForAutoReply from dependencies

  // Combined loading state for both manual and auto sync
  const isAnySyncLoading = syncLoading || autoSyncLoading;
  
  // Debug logging for sync states
  useEffect(() => {
    console.log('🔍 Sync States:', {
      syncLoading,
      autoSyncLoading,
      isAnySyncLoading,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [syncLoading, autoSyncLoading, isAnySyncLoading]);

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
            <Mail className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
          </div>
          <p className="text-slate-600 font-medium">Loading your leads...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24 p-6 sm:p-10 lg:p-16 text-[1.08rem] md:text-base">
      <div className="max-w-[95vw] mx-auto mt-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                {showDeleted ? 'Recently Deleted' : 'Lead Mission Control'}
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                {showDeleted ? 'Restore or permanently delete leads 🗑️' : 'Transform emails into opportunities 🚀'}
              </p>
            </div>

            {/* Basic Stats */}
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-slate-600">{showDeleted ? 'Deleted Leads' : 'Active Leads'}</p>
                    <p className="text-lg font-bold text-slate-900">{totalLeads}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-600">Completion</p>
                    <p className="text-lg font-bold text-slate-900">{completionPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-slate-600">Answered</p>
                    <p className="text-lg font-bold text-slate-900">{answeredLeads}</p>
                    <p className="text-xs text-slate-500">{answeredPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads by email, subject, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-white/20 rounded-xl"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={answeredFilter} onValueChange={(value: 'all' | 'answered' | 'unanswered') => setAnsweredFilter(value)}>
                <SelectTrigger className="w-32 rounded-xl bg-white/70 backdrop-blur-sm border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">All Leads</SelectItem>
                  <SelectItem value="answered" className="rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Answered</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="unanswered" className="rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Circle className="h-3 w-3 text-slate-400" />
                      <span>Unanswered</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                onClick={() => setShowDeleted(!showDeleted)}
                className="rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {showDeleted ? 'Show Active' : 'Recently Deleted'}
              </Button>
              
              <Button
                variant={isSelectionMode ? 'default' : 'outline'}
                onClick={toggleSelectionMode}
                className="rounded-xl"
              > 
                {isSelectionMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select
                  </>
                )}
              </Button>
              
              {/* Auto-Reply Toggle */}
              {!showDeleted && <AutoReplyToggle />}
              
              {/* Auto-Sync Status Indicator */}
              {/* {!showDeleted && isAutoSyncEnabled && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className={`w-2 h-2 rounded-full ${autoSyncLoading ? 'bg-blue-500' : 'bg-green-500'}`} />
                      {!autoSyncLoading && (
                        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {autoSyncLoading ? 'Syncing...' : (isServerSyncEnabled ? 'Auto-sync: ALWAYS ON' : 'Auto-sync: ON')}
                    </span>
                  </div>
                  {lastAutoSync && !autoSyncLoading && (
                    <span className="text-xs text-slate-500">
                      {new Date(lastAutoSync).toLocaleTimeString()}
                    </span>
                  )}
                  {isServerSyncEnabled && (
                    <span className="text-xs text-green-600 font-medium">
                      24/7
                    </span>
                  )}
                </div>
              )} */}
              
              {/* Split Sync Gmail Button */}
              <div className="relative">
                <div className="flex rounded-xl overflow-hidden">
                  <Button
                    disabled={isAnySyncLoading}
                    onClick={() => handleSyncGmail()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-none rounded-l-xl border-r border-blue-500/30"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isAnySyncLoading ? 'animate-spin' : ''}`} />
                    {isAnySyncLoading ? 'Syncing...' : 'Sync Gmail'}
                    {!isAnySyncLoading && sessionSyncPeriod === 1 && " (24h)"}
                    {!isAnySyncLoading && sessionSyncPeriod === 3 && " (3d)"}
                    {!isAnySyncLoading && sessionSyncPeriod === 7 && " (7d)"}
                    {!isAnySyncLoading && sessionSyncPeriod === 30 && " (1m)"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        disabled={isAnySyncLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-none rounded-r-xl px-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleSyncGmail(1)}
                        className={cn(sessionSyncPeriod === 1 && "bg-blue-50")}
                      >
                        <Check className={cn("h-4 w-4 mr-2", sessionSyncPeriod !== 1 && "opacity-0")} />
                        Last 24 hours
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSyncGmail(3)}
                        className={cn(sessionSyncPeriod === 3 && "bg-blue-50")}
                      >
                        <Check className={cn("h-4 w-4 mr-2", sessionSyncPeriod !== 3 && "opacity-0")} />
                        Last 3 days
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSyncGmail(7)}
                        className={cn(sessionSyncPeriod === 7 && "bg-blue-50")}
                      >
                        <Check className={cn("h-4 w-4 mr-2", sessionSyncPeriod !== 7 && "opacity-0")} />
                        Last 7 days
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSyncGmail(30)}
                        className={cn(sessionSyncPeriod === 30 && "bg-blue-50")}
                      >
                        <Check className={cn("h-4 w-4 mr-2", sessionSyncPeriod !== 30 && "opacity-0")} />
                        Last month
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Last Sync Indicator - positioned absolutely to not affect layout */}
                <AnimatePresence>
                  {lastAutoSync && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-1 flex items-center space-x-1.5 text-xs text-slate-500 whitespace-nowrap"
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        Last sync: {(() => {
                          const now = new Date();
                          const syncTime = new Date(lastAutoSync);
                          const diffMs = now.getTime() - syncTime.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          const diffDays = Math.floor(diffMs / 86400000);
                          
                          if (diffMins < 1) return 'just now';
                          if (diffMins < 60) return `${diffMins}m ago`;
                          if (diffHours < 24) return `${diffHours}h ago`;
                          if (diffDays === 1) return 'yesterday';
                          if (diffDays < 7) return `${diffDays}d ago`;
                          return syncTime.toLocaleDateString();
                        })()}
                      </span>
                      {isServerSyncEnabled && (
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-600 font-medium">Auto</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          <AnimatePresence>
            {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllVisibleLeads();
                          } else {
                            deselectAllLeads();
                          }
                        }}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {selectedLeads.length === 0 
                          ? `Select all ${filteredLeads.length} leads`
                          : `${selectedLeads.length} selected`
                        }
                      </span>
                    </div>
                    
                    {selectedLeads.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={deselectAllLeads}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>

                  {selectedLeads.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {showDeleted ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              showConfirmation({
                                title: 'Restore Selected Leads',
                                description: `Are you sure you want to restore ${selectedLeads.length} selected lead${selectedLeads.length === 1 ? '' : 's'}?`,
                                confirmText: 'Restore',
                                variant: 'info',
                                onConfirm: () => bulkRestoreLeads(selectedLeads),
                              });
                            }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Restore ({selectedLeads.length})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              showConfirmation({
                                title: 'Delete Forever',
                                description: `Are you sure you want to permanently delete ${selectedLeads.length} selected lead${selectedLeads.length === 1 ? '' : 's'}? This action cannot be undone.`,
                                confirmText: 'Delete Forever',
                                variant: 'danger',
                                onConfirm: () => bulkPermanentlyDeleteLeads(selectedLeads),
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Forever ({selectedLeads.length})
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            showConfirmation({
                              title: 'Delete Selected Leads',
                              description: `Are you sure you want to delete ${selectedLeads.length} selected lead${selectedLeads.length === 1 ? '' : 's'}? You can restore them from Recently Deleted within 30 days.`,
                              confirmText: 'Delete',
                              variant: 'warning',
                              onConfirm: () => bulkDeleteLeads(selectedLeads),
                            });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete ({selectedLeads.length})
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Content Area */}
        {showDeleted ? (
          /* Deleted Leads List View */
          <div className="space-y-4">
            {filteredLeads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Trash2 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No deleted leads</h3>
                <p className="text-slate-500">Deleted leads will appear here and can be restored within 30 days.</p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {filteredLeads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "bg-white/80 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-lg transition-all duration-300",
                      selectedLeadIds.has(lead.id) && "ring-2 ring-blue-500 bg-blue-50/80"
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              {isSelectionMode && (
                                <Checkbox
                                  checked={selectedLeadIds.has(lead.id)}
                                  onCheckedChange={() => toggleLeadSelection(lead.id)}
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              )}
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <h3 className="font-semibold text-slate-900 truncate">{lead.sender_email}</h3>
                              <Badge variant="outline" className="text-xs">
                                Deleted {lead.deleted_at ? new Date(lead.deleted_at).toLocaleDateString() : ''}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">
                              {lead.subject || 'No subject'}
                            </h4>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {lead.snippet}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            {!isSelectionMode && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => restoreLead(lead.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Restore
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    showConfirmation({
                                      title: 'Delete Forever',
                                      description: `Are you sure you want to permanently delete the lead from ${lead.sender_email}? This action cannot be undone.`,
                                      confirmText: 'Delete Forever',
                                      variant: 'danger',
                                      onConfirm: () => permanentlyDeleteLead(lead.id),
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Forever
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Kanban Board */
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[
                { 
                  key: 'unclassified', 
                  title: 'Unclassified', 
                  icon: Circle, 
                  color: 'slate', 
                  bgGradient: 'from-slate-400 to-slate-500',
                  count: categorizedLeads.unclassified.length 
                },
                { 
                  key: 'hot', 
                  title: 'Hot Leads', 
                  icon: Flame, 
                  color: 'red', 
                  bgGradient: 'from-red-500 to-orange-500',
                  count: categorizedLeads.hot.length 
                },
                { 
                  key: 'warm', 
                  title: 'Warm Leads', 
                  icon: ThermometerSun, 
                  color: 'yellow', 
                  bgGradient: 'from-yellow-400 to-orange-400',
                  count: categorizedLeads.warm.length 
                },
                { 
                  key: 'cold', 
                  title: 'Cold Leads', 
                  icon: Snowflake, 
                  color: 'blue', 
                  bgGradient: 'from-blue-400 to-blue-500',
                  count: categorizedLeads.cold.length 
                }
              ].map((column, index) => (
                <DroppableColumn
                  key={column.key}
                  column={column}
                  leads={categorizedLeads[column.key as keyof typeof categorizedLeads]}
                  index={index}
                  onStatusChange={updateLeadStatus}
                  onSelectLead={(lead) => {
                    setSelectedLead(lead);
                    setShowDetailsModal(true);
                  }}
                  overId={overId}
                  isSelectionMode={isSelectionMode}
                  selectedLeadIds={selectedLeadIds}
                  onToggleSelection={toggleLeadSelection}
                  autoReplyingLeads={autoReplyingLeads}
                />
              ))}
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="transform rotate-6 opacity-90">
                  <DraggableLeadCard
                    lead={leads.find(l => l.id === activeId)!}
                    onStatusChange={() => {}}
                    onSelect={() => {}}
                    columnColor="blue"
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Lead Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center justify-between pr-8">
                <span>Lead Details</span>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedLead?.status === 'hot' ? 'destructive' :
                    selectedLead?.status === 'warm' ? 'default' :
                    selectedLead?.status === 'cold' ? 'secondary' :
                    'outline'
                  }>
                    {selectedLead?.status}
                  </Badge>
                  {selectedLead?.auto_replied && (
                    <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
                      <Bot className="h-3 w-3 mr-1" />
                      Auto-replied
                    </Badge>
                  )}
                  {selectedLead && (
                    <div className="relative">
                      {/* Celebration particles */}
                      <AnimatePresence>
                        {isAnimating && (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                                style={{
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                }}
                                initial={{ 
                                  scale: 0,
                                  x: 0,
                                  y: 0,
                                  opacity: 1
                                }}
                                animate={{ 
                                  scale: [0, 1, 0],
                                  x: Math.cos(i * 45 * Math.PI / 180) * 60,
                                  y: Math.sin(i * 45 * Math.PI / 180) * 60,
                                  opacity: [1, 1, 0]
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ 
                                  duration: 0.8,
                                  ease: "easeOut"
                                }}
                              />
                            ))}
                            
                            {/* Radial glow effect */}
                            <motion.div
                              className="absolute inset-0 bg-green-400 rounded-lg opacity-20"
                              initial={{ scale: 1, opacity: 0 }}
                              animate={{ 
                                scale: [1, 1.8, 1],
                                opacity: [0, 0.3, 0]
                              }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                            
                            {/* Success sparkles */}
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={`sparkle-${i}`}
                                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                                style={{
                                  top: `${20 + i * 15}%`,
                                  left: `${15 + i * 20}%`,
                                }}
                                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                                animate={{ 
                                  scale: [0, 1.5, 0],
                                  rotate: [0, 180, 360],
                                  opacity: [0, 1, 0]
                                }}
                                transition={{ 
                                  duration: 0.8,
                                  delay: i * 0.1,
                                  ease: "easeOut"
                                }}
                              />
                            ))}
                          </>
                        )}
                      </AnimatePresence>
                      
                      <motion.div
                        animate={isAnimating ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, -2, 2, 0]
                        } : {}}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <Button
                          size="sm"
                          variant={selectedLead.answered ? "default" : "outline"}
                          onClick={() => toggleAnsweredStatus(selectedLead.id, !selectedLead.answered)}
                          className={cn(
                            "flex items-center gap-1 relative overflow-hidden",
                            selectedLead.answered 
                              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
                              : "hover:bg-green-50"
                          )}
                        >
                          <motion.div
                            animate={selectedLead.answered && isAnimating ? {
                              scale: [1, 1.3, 1],
                              rotate: [0, 360]
                            } : {}}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          >
                            <CheckCircle2 className={cn(
                              "h-3 w-3",
                              selectedLead.answered ? "text-green-700" : "text-slate-400"
                            )} />
                          </motion.div>
                          {selectedLead.answered ? "Answered" : "Mark Answered"}
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedLead && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">From</h3>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{selectedLead.sender_email}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyEmail(selectedLead.sender_email);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInGmail(selectedLead.sender_email, selectedLead.subject);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">Subject</h3>
                  <p className="font-medium">{selectedLead.subject || 'No subject'}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-slate-600">Preview</h3>
                    {shouldTruncateContent(selectedLead.full_content || selectedLead.snippet || '') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowFullContent(!showFullContent)}
                        className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                      >
                        {showFullContent ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            See Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            See More
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {getDisplayContent(selectedLead)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="min-h-[80px]">
                      <h3 className="text-sm font-medium text-slate-600 mb-1">Received</h3>
                      <p className="text-slate-700 mb-6">
                        {new Date(selectedLead.received_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {selectedLead.answered && selectedLead.responded_at && (
                        <motion.div
                          key="answered-section"
                          className="min-h-[80px]"
                          initial={{ 
                            opacity: 0, 
                            x: 20,
                            scale: 0.95
                          }}
                          animate={{ 
                            opacity: 1, 
                            x: 0,
                            scale: 1
                          }}
                          exit={{ 
                            opacity: 0, 
                            x: 20,
                            scale: 0.95
                          }}
                          transition={{ 
                            duration: 0.5, 
                            ease: "easeOut",
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                          }}
                        >
                          <motion.h3 
                            className="text-sm font-medium text-slate-600 mb-1"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            Answered {selectedLead.auto_replied && '(Auto-reply)'}
                          </motion.h3>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                          >
                            <p className="text-slate-700">
                              {new Date(selectedLead.responded_at).toLocaleString()}
                              {selectedLead.response_time_minutes && (
                                <motion.span 
                                  className="text-sm text-slate-500 block mt-1"
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.4, duration: 0.3 }}
                                >
                                  Response time: {selectedLead.response_time_minutes < 60 
                                    ? `${selectedLead.response_time_minutes}m` 
                                    : `${Math.floor(selectedLead.response_time_minutes / 60)}h ${selectedLead.response_time_minutes % 60}m`
                                  }
                                </motion.span>
                              )}
                              {selectedLead.auto_replied && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.5, duration: 0.3 }}
                                  className="mt-3"
                                >
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium shadow-lg">
                                    <Bot className="h-4 w-4" />
                                    <span>AI Auto-replied</span>
                                    <Sparkles className="h-3 w-3" />
                                  </div>
                                </motion.div>
                              )}
                            </p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">Notes</h3>
                  <Textarea
                    placeholder="Add notes about this lead..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* AI Response Generator */}
                <div className="border-t pt-4">
                  <AIResponseGenerator
                    lead={selectedLead}
                    onUseResponse={(response) => {
                      handleReplyToLead(selectedLead, response);
                      setShowDetailsModal(false);
                    }}
                  />
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    {selectedLead.is_deleted ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => restoreLead(selectedLead.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Restore Lead
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            showConfirmation({
                              title: 'Delete Forever',
                              description: 'Are you sure you want to permanently delete this lead? This action cannot be undone and the lead will be lost forever.',
                              confirmText: 'Delete Forever',
                              variant: 'danger',
                              onConfirm: () => permanentlyDeleteLead(selectedLead.id),
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Forever
                        </Button>
                      </>
                    ) : (
                                          <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        showConfirmation({
                          title: 'Delete Lead',
                          description: 'Are you sure you want to delete this lead? You can restore it from Recently Deleted within 30 days.',
                          confirmText: 'Delete Lead',
                          variant: 'warning',
                          onConfirm: () => deleteLead(selectedLead.id),
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    )}
                  </div>
                  
                  {!selectedLead.is_deleted && (
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReplyToLead(selectedLead);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Reply With My Response
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
                  </Dialog>
        </div>
        
        <SubscriptionOverlay 
          isVisible={!hasValidAccess}
          title="Subscription Required"
          message="Access to leads requires an active subscription. Choose a plan to start managing and responding to your leads with AI-powered assistance."
        />

        {/* Beautiful Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmation}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          description={confirmationModal.description}
          confirmText={confirmationModal.confirmText}
          variant={confirmationModal.variant}
          isLoading={confirmationModal.isLoading}
        />
      </div>
  );
};

interface LeadCardProps {
  lead: Lead;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onSelect: (lead: Lead) => void;
  columnColor: string;
  isDragging?: boolean;
  isBeingDragged?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (leadId: string) => void;
  isAutoReplying?: boolean;
}

const LeadCard = ({ 
  lead, 
  onStatusChange, 
  onSelect, 
  columnColor, 
  isDragging, 
  isBeingDragged, 
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  isAutoReplying = false
}: LeadCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUrgencyIndicator = () => {
    const date = new Date(lead.received_at);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 2) return { icon: AlertTriangle, color: 'text-red-500', label: 'Urgent' };
    if (diffInHours < 24) return { icon: Clock, color: 'text-yellow-500', label: 'Recent' };
    return { icon: Calendar, color: 'text-slate-400', label: 'Older' };
  };

  const urgency = getUrgencyIndicator();

  // Handle content click for modal opening or selection
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, select, [role="combobox"], input[type="checkbox"]');
    
    // In selection mode, clicking anywhere on the card should toggle selection
    if (isSelectionMode && onToggleSelection && !isInteractive) {
      onToggleSelection(lead.id);
      e.stopPropagation();
      return;
    }
    
    // In normal mode, open modal
    if (!isSelectionMode && !isInteractive) {
      e.stopPropagation();
      onSelect(lead);
    }
  };

  // Handle select change
  const handleSelectChange = (value: string) => {
    onStatusChange(lead.id, value);
  };

  return (
    <motion.div
      whileHover={!isBeingDragged ? { y: -2, scale: 1.02 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group select-none",
        isDragging && "opacity-50",
        isBeingDragged && "pointer-events-none"
      )}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <Card       className={cn(
        "bg-white/80 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden",
        lead.is_deleted && "opacity-60",
        lead.answered && "bg-green-50/80 border-green-200/40",
        isSelected && "ring-2 ring-blue-500 bg-blue-50/80",
        !isBeingDragged && "cursor-pointer"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                {isSelectionMode && onToggleSelection && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection(lead.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                )}
                <div className={`w-2 h-2 bg-gradient-to-r from-${columnColor}-400 to-${columnColor}-500 rounded-full`}></div>
                <CardTitle className="text-sm font-medium text-slate-900 truncate">
                  {lead.sender_email}
                </CardTitle>
                {lead.answered && (
                  <div className="ml-auto flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                )}

              </div>
              <div className="flex items-center space-x-2">
                <urgency.icon className={`h-3 w-3 ${urgency.color}`} />
                <p className="text-xs text-slate-500">{formatDate(lead.received_at)}</p>
                {lead.is_deleted && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    Deleted
                  </Badge>
                )}
                {lead.answered && (
                  <Badge variant="default" className="text-xs px-2 py-0 bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Answered
                  </Badge>
                )}
                {lead.auto_replied && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <Badge variant="default" className="text-xs px-2 py-0 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 shadow-sm">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Bot className="h-3 w-3 mr-1" />
                      </motion.div>
                      Auto-replied
                    </Badge>
                  </motion.div>
                )}
                {/* Auto-replying badge */}
                {isAutoReplying && !lead.answered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Badge variant="default" className="text-xs px-2 py-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-300 shadow-sm">
                      <Bot className="h-3 w-3 mr-1" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-3 w-3 mr-1 border border-white border-t-transparent rounded-full"
                      />
                      Auto-replying...
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
            
            {!isBeingDragged && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="flex space-x-1"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(lead);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          <div 
            onClick={!isBeingDragged ? handleContentClick : undefined} 
            className={cn(
              !isBeingDragged && "cursor-pointer",
              isSelectionMode && "hover:bg-blue-50/50 transition-colors"
            )}
          >
            <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">
              {lead.subject || 'No subject'}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-3">
              {lead.snippet}
            </p>
          </div>

          {!isBeingDragged && (
            <div className="pt-2">
              <Select
                value={lead.status}
                onValueChange={handleSelectChange}
                disabled={lead.is_deleted}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-white/50 border-white/20 rounded-lg pointer-events-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="unclassified" className="rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Circle className="h-3 w-3 text-slate-400" />
                      <span>Unclassified</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hot" className="rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Flame className="h-3 w-3 text-red-500" />
                      <span>Hot Lead</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warm" className="rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ThermometerSun className="h-3 w-3 text-yellow-500" />
                      <span>Warm Lead</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cold" className="rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Snowflake className="h-3 w-3 text-blue-500" />
                      <span>Cold Lead</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface DraggableLeadCardProps {
  lead: Lead;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onSelect: (lead: Lead) => void;
  columnColor: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (leadId: string) => void;
  isAutoReplying?: boolean;
}

const DraggableLeadCard = ({ 
  lead, 
  onStatusChange, 
  onSelect, 
  columnColor, 
  isSelectionMode = false, 
  isSelected = false, 
  onToggleSelection,
  isAutoReplying = false
}: DraggableLeadCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle click events to show details on click, drag on hold
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, select, [role="combobox"], input[type="checkbox"]');
    
    // In selection mode, clicking anywhere on the card should toggle selection
    if (isSelectionMode && onToggleSelection && !isInteractive) {
      onToggleSelection(lead.id);
      e.stopPropagation();
      return;
    }
    
    // In normal mode, only open details if not dragging and not on interactive elements
    if (!isDragging && !isInteractive && !isSelectionMode) {
      onSelect(lead);
      e.stopPropagation();
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        isSelectionMode 
          ? "cursor-pointer" 
          : "cursor-pointer hover:cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 rotate-3 scale-105"
      )}
      onClick={handleCardClick}
      {...attributes}
      {...(isSelectionMode ? {} : listeners)} // Disable drag listeners in selection mode
    >
      <LeadCard
        lead={lead}
        onStatusChange={(leadId, newStatus) => {
          // Prevent status changes during drag
          if (!isDragging) {
            onStatusChange(leadId, newStatus);
          }
        }}
        onSelect={(lead) => {
          // Don't trigger onSelect from the card itself since we handle it in the wrapper's onClick
          if (!isDragging) {
            // This is now handled by the wrapper's onClick
          }
        }}
        columnColor={columnColor}
        isDragging={isDragging}
        isBeingDragged={true}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection}
        isAutoReplying={isAutoReplying}
      />
    </div>
  );
};

interface DroppableColumnProps {
  column: {
    key: string;
    title: string;
    icon: React.ElementType;
    color: string;
    bgGradient: string;
    count: number;
  };
  leads: Lead[];
  index: number;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onSelectLead: (lead: Lead) => void;
  overId?: string | null;
  isSelectionMode?: boolean;
  selectedLeadIds?: Set<string>;
  onToggleSelection?: (leadId: string) => void;
  autoReplyingLeads?: Set<string>;
}

const DroppableColumn = ({ 
  column, 
  leads, 
  index, 
  onStatusChange, 
  onSelectLead, 
  overId, 
  isSelectionMode = false, 
  selectedLeadIds = new Set(), 
  onToggleSelection,
  autoReplyingLeads = new Set()
}: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    data: {
      accepts: 'lead',
      status: column.key
    }
  });

  const answeredCount = leads.filter(lead => lead.answered).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "flex flex-col h-full rounded-xl transition-all min-h-[600px]",
        (isOver || overId === column.key) && "bg-blue-100/50 ring-2 ring-blue-400"
      )}
      ref={setNodeRef}
    >
      {/* Column Header */}
      <div className={cn(
        "bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm flex-shrink-0",
        (isOver || overId === column.key) && "ring-2 ring-blue-300 shadow-md"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl bg-gradient-to-r ${column.bgGradient}`}>
              <column.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-700">{column.title}</h2>
              <p className="text-sm text-slate-500">
                {column.count} leads
                {answeredCount > 0 && (
                  <span className="text-green-600 ml-1">
                    • {answeredCount} answered
                  </span>
                )}
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${
              column.count > 0 ? 'bg-gradient-to-r ' + column.bgGradient + ' text-white' : ''
            } rounded-full`}
          >
            {column.count}
          </Badge>
        </div>
      </div>

      {/* Lead Cards Area - This is the main droppable area */}
      <div 
        className={cn(
          "flex-grow space-y-3 p-3 rounded-b-xl transition-all",
          (isOver || overId === column.key) && "bg-blue-200/30"
        )}
      >
        <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {leads.map((lead, leadIndex) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: leadIndex * 0.05 }}
              >
                <DraggableLeadCard
                  lead={lead}
                  onStatusChange={onStatusChange}
                  onSelect={onSelectLead}
                  columnColor={column.color}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedLeadIds.has(lead.id)}
                  onToggleSelection={onToggleSelection}
                  isAutoReplying={autoReplyingLeads.has(lead.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
        
        {leads.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 text-slate-400"
          >
            <column.icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {column.title.toLowerCase()} yet</p>
            <p className="text-xs mt-2">Drop leads here to categorize them</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LeadsPage;
