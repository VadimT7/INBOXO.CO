import { useState, useEffect, useMemo } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGmailSync } from '@/hooks/useGmailSync';
import { useResponseTimeAnalytics } from '@/hooks/useResponseTimeAnalytics';
import { toast } from 'sonner';
import { 
  RefreshCw, Mail, Search, Filter, Zap, Target, Trophy, Star,
  Clock, User, ChevronRight, Flame, Snowflake, ThermometerSun,
  CheckCircle2, Circle, TrendingUp, Calendar, MoreHorizontal,
  Eye, ExternalLink, Archive, Trash2, Heart, AlertTriangle,
  MessageSquare, Send, ArrowLeft, Copy, Share2, GripVertical,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AIResponseGenerator } from '@/components/AIResponseGenerator';

interface Lead {
  id: string;
  sender_email: string;
  subject: string;
  snippet: string;
  full_content?: string;
  received_at: string;
  status: string;
  is_archived?: boolean;
  responded_at?: string | null;
  response_time_minutes?: number | null;
  answered?: boolean;
}

const LeadsPage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const { syncGmailLeads, loading: syncLoading } = useGmailSync();
  const { markLeadAsResponded } = useResponseTimeAnalytics(user?.id);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [answeredFilter, setAnsweredFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [isAnimating, setIsAnimating] = useState(false);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Use delay to require holding for 250ms before dragging starts
        delay: 100,
        // Also keep a small distance threshold to avoid accidental drags
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    // If not dropped over a valid droppable area or the over.id is not a valid status
    if (!over) {
      // Just reset the active ID and return - lead stays in original position
      return;
    }

    const leadId = active.id as string;
    const newStatus = over.id as string;
    
    // Validate that the over.id is a valid status category
    const validStatuses = ['unclassified', 'hot', 'warm', 'cold'];
    if (!validStatuses.includes(newStatus)) {
      // Not a valid status category, ignore the drop
      return;
    }
    
    // Find the lead being dragged
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.status !== newStatus) {
      updateLeadStatus(leadId, newStatus);
      
      // Show success message with animation
      const statusEmojis = {
        hot: '🔥',
        warm: '🌤️', 
        cold: '❄️',
        unclassified: '📋'
      };
      const emoji = statusEmojis[newStatus as keyof typeof statusEmojis] || '✅';
      toast.success(`${emoji} Lead moved to ${newStatus}!`, {
        duration: 2000,
      });
    }
  };

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
        toast.error('Failed to fetch leads');
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
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

      // Update local state with animation
      setLeads(prev => prev.map(lead => 
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

  const archiveLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_archived: true })
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to archive lead');
        return;
      }

      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, is_archived: true } : lead
      ));
      
      toast.success('Lead archived');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error archiving lead:', error);
      toast.error('Failed to archive lead');
    }
  };

  const unarchiveLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_archived: false })
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to activate lead');
        return;
      }

      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, is_archived: false } : lead
      ));
      
      toast.success('Lead activated');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error activating lead:', error);
      toast.error('Failed to activate lead');
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to delete lead');
        return;
      }

      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      toast.success('Lead deleted');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const toggleAnsweredStatus = async (leadId: string, answered: boolean) => {
    try {
      // Trigger animation only when marking as answered
      if (answered) {
        setIsAnimating(true);
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
      setLeads(prev => prev.map(lead => 
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

  const handleSyncGmail = async () => {
    try {
      console.log('Starting Gmail sync from LeadsPage...');
      await syncGmailLeads();
      await fetchLeads();
      toast.success('📧 Fresh leads synced!');
    } catch (error) {
      console.error('Gmail sync error in LeadsPage:', error);
      // Error handling is done in the hook
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
      const success = await markLeadAsResponded(lead.id);
      if (success) {
        toast.success('Response time recorded!');
      }
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

  useEffect(() => {
    if (!authLoading && user) {
      fetchLeads();
    } else if (!authLoading && !user) {
      setLeads([]);
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    // Reset showFullContent and showAIResponse when modal opens/closes or lead changes
    if (!showDetailsModal || !selectedLead) {
      setShowFullContent(false);
      setShowAIResponse(false);
    }
  }, [showDetailsModal, selectedLead?.id]);

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

  // Filter leads based on search query and archive status
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.sender_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.snippet.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesArchiveFilter = showArchived ? lead.is_archived : !lead.is_archived;
      
      const matchesAnsweredFilter = answeredFilter === 'all' || 
        (answeredFilter === 'answered' && lead.answered) ||
        (answeredFilter === 'unanswered' && !lead.answered);
      
      return matchesSearch && matchesArchiveFilter && matchesAnsweredFilter;
    });
  }, [leads, searchQuery, showArchived, answeredFilter]);

  const categorizedLeads = useMemo(() => ({
    unclassified: filteredLeads.filter(lead => lead.status === 'unclassified'),
    hot: filteredLeads.filter(lead => lead.status === 'hot'),
    warm: filteredLeads.filter(lead => lead.status === 'warm'),
    cold: filteredLeads.filter(lead => lead.status === 'cold')
  }), [filteredLeads]);

  // Basic metrics
  const totalLeads = leads.filter(l => !l.is_archived).length;
  const classifiedLeads = leads.filter(l => !l.is_archived && l.status !== 'unclassified').length;
  const answeredLeads = leads.filter(l => !l.is_archived && l.answered).length;
  const completionPercentage = totalLeads > 0 ? (classifiedLeads / totalLeads) * 100 : 0;
  const answeredPercentage = totalLeads > 0 ? (answeredLeads / totalLeads) * 100 : 0;

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
                Lead Mission Control
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Transform emails into opportunities 🚀</p>
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
                    <p className="text-xs text-slate-600">Active Leads</p>
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
                variant={showArchived ? 'default' : 'outline'}
                onClick={() => setShowArchived(!showArchived)}
                className="rounded-xl"
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Show Active' : 'Show Archived'}
              </Button>
              
              <Button
                onClick={handleSyncGmail}
                disabled={syncLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                Sync Gmail
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
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
                            Answered
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
                    {selectedLead.is_archived ? (
                      <Button
                        variant="outline"
                        onClick={() => unarchiveLead(selectedLead.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Activate Lead
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => archiveLead(selectedLead.id)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this lead?')) {
                          deleteLead(selectedLead.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  
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
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
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
}

const LeadCard = ({ lead, onStatusChange, onSelect, columnColor, isDragging, isBeingDragged }: LeadCardProps) => {
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

  // Handle content click for modal opening
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(lead);
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
        "group select-none", // Add select-none to prevent text selection
        isDragging && "opacity-50",
        isBeingDragged && "pointer-events-none" // Disable pointer events on child elements during drag
      )}
      style={{
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none',
      }}
    >
      <Card className={cn(
        "bg-white/80 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden",
        lead.is_archived && "opacity-60",
        lead.answered && "bg-green-50/80 border-green-200/40",
        !isBeingDragged && "cursor-pointer"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 bg-gradient-to-r from-${columnColor}-400 to-${columnColor}-500 rounded-full`}></div>
                <CardTitle className="text-sm font-medium text-slate-900 truncate">
                  {lead.sender_email}
                </CardTitle>
                {lead.answered && (
                  <div className="ml-auto">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <urgency.icon className={`h-3 w-3 ${urgency.color}`} />
                <p className="text-xs text-slate-500">{formatDate(lead.received_at)}</p>
                <Badge variant="outline" className="text-xs px-2 py-0">
                  {urgency.label}
                </Badge>
                {lead.is_archived && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    Archived
                  </Badge>
                )}
                {lead.answered && (
                  <Badge variant="default" className="text-xs px-2 py-0 bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Answered
                  </Badge>
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
            className={!isBeingDragged ? "cursor-pointer" : ""}
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
                disabled={lead.is_archived}
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
}

const DraggableLeadCard = ({ lead, onStatusChange, onSelect, columnColor }: DraggableLeadCardProps) => {
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
    // Only call onSelect if we're not dragging and the click wasn't on an interactive element
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, select, [role="combobox"]');
    
    if (!isDragging && !isInteractive) {
      onSelect(lead);
      e.stopPropagation();
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "cursor-pointer hover:cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 rotate-3 scale-105"
      )}
      onClick={handleCardClick}
      {...attributes}
      {...listeners}
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
}

const DroppableColumn = ({ column, leads, index, onStatusChange, onSelectLead }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    // Make the entire column a valid drop target
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
        "flex flex-col h-full rounded-xl transition-all", // Use flex column, full height
        isOver && "bg-blue-100/50 ring-2 ring-blue-400" // Visual feedback for the entire column
      )}
      ref={setNodeRef} // The entire column is the drop target
    >
      {/* Column Header (does not grow) */}
      <div className={cn(
        "bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm",
        isOver && "ring-2 ring-blue-300 shadow-md" // Enhanced header highlight
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

      {/* Lead Cards (grows to fill remaining space) */}
      <div 
        className={cn(
          "flex-grow space-y-3 min-h-[200px] p-3 rounded-b-xl transition-all", // flex-grow, adjusted padding and rounding
          isOver && "bg-blue-200/30" // Subtle background for card area when column isOver
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LeadsPage;
