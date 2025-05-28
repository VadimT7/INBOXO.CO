
import { useState, useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGmailSync } from '@/hooks/useGmailSync';
import { toast } from 'sonner';
import { RefreshCw, Mail } from 'lucide-react';

interface Lead {
  id: string;
  sender_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  status: string;
}

const LeadsPage = () => {
  const { user, loading: authLoading } = useAuthSession();
  const { syncGmailLeads, loading: syncLoading } = useGmailSync();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    if (!user) return;

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

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      toast.success('Lead status updated');
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleSyncGmail = async () => {
    try {
      await syncGmailLeads();
      await fetchLeads(); // Refresh leads after sync
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Mail className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Please sign in</h2>
          <p className="text-slate-600">You need to be signed in to view your leads</p>
        </div>
      </div>
    );
  }

  const categorizedLeads = {
    hot: leads.filter(lead => lead.status === 'hot'),
    warm: leads.filter(lead => lead.status === 'warm'),
    cold: leads.filter(lead => lead.status === 'cold'),
    unclassified: leads.filter(lead => lead.status === 'unclassified')
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Lead Classification</h1>
              <p className="text-slate-600 mt-1">Organize and manage your email leads</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Button
                onClick={handleSyncGmail}
                disabled={syncLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>Sync Gmail</span>
              </Button>
              <div className="text-sm text-slate-600">
                Total leads: {leads.length}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Unclassified Column */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center">
                  <div className="w-3 h-3 bg-slate-400 rounded-full mr-2"></div>
                  Unclassified ({categorizedLeads.unclassified.length})
                </h2>
              </div>
              <div className="space-y-3">
                {categorizedLeads.unclassified.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onStatusChange={updateLeadStatus}
                  />
                ))}
              </div>
            </div>

            {/* Hot Column */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Hot ({categorizedLeads.hot.length})
                </h2>
              </div>
              <div className="space-y-3">
                {categorizedLeads.hot.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onStatusChange={updateLeadStatus}
                  />
                ))}
              </div>
            </div>

            {/* Warm Column */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Warm ({categorizedLeads.warm.length})
                </h2>
              </div>
              <div className="space-y-3">
                {categorizedLeads.warm.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onStatusChange={updateLeadStatus}
                  />
                ))}
              </div>
            </div>

            {/* Cold Column */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Cold ({categorizedLeads.cold.length})
                </h2>
              </div>
              <div className="space-y-3">
                {categorizedLeads.cold.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onStatusChange={updateLeadStatus}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface LeadCardProps {
  lead: Lead;
  onStatusChange: (leadId: string, newStatus: string) => void;
}

const LeadCard = ({ lead, onStatusChange }: LeadCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium text-slate-900 truncate">
              {lead.sender_email}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {formatDate(lead.received_at)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2">
            {lead.subject || 'No subject'}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-3">
            {lead.snippet}
          </p>
          <div className="pt-2">
            <Select
              value={lead.status}
              onValueChange={(value) => onStatusChange(lead.id, value)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unclassified">Unclassified</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsPage;
