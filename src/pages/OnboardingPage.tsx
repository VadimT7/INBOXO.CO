import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useGmailSync } from '@/hooks/useGmailSync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Mail, RefreshCw, Bot, CheckCircle, Zap, ArrowRight, 
  Sparkles, Target, Clock, TrendingUp, Loader2, Crown,
  Flame, ThermometerSun, Snowflake, Send, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Lead {
  id: string;
  sender_email: string;
  subject: string;
  snippet: string;
  full_content?: string;
  received_at: string;
  status: string;
}

const OnboardingPage = () => {
  const { user } = useAuthSession();
  const { syncGmailLeads } = useGmailSync();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto-start the magic when component mounts
  useEffect(() => {
    if (user) {
      startOnboardingFlow();
    }
  }, [user]);

  const startOnboardingFlow = async () => {
    // Step 1: Welcome (2 seconds)
    setProgress(10);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Start Gmail sync
    setStep(2);
    setProgress(25);
    await triggerGmailSync();
    
    // Step 3: Select best lead and generate AI response
    setStep(3);
    setProgress(60);
    await generateAIResponse();
    
    // Step 4: Celebration
    setStep(4);
    setProgress(100);
    triggerCelebration();
  };

  const triggerGmailSync = async () => {
    try {
      console.log('🚀 Starting automatic Gmail sync...');
      
      // Simulate real-time lead discovery
      const countInterval = setInterval(() => {
        setLeadCount(prev => {
          const newCount = prev + Math.floor(Math.random() * 3) + 1;
          return Math.min(newCount, 25); // Cap at 25 for demo
        });
      }, 300);

      // Actually sync Gmail
      await syncGmailLeads();
      
      // Fetch the actual leads
      const { data: fetchedLeads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user?.id)
        .order('received_at', { ascending: false })
        .limit(20);

      clearInterval(countInterval);

      if (error) {
        console.error('Error fetching leads:', error);
        // Use demo data if real sync fails
        setLeads(createDemoLeads());
        setLeadCount(5);
      } else {
        setLeads(fetchedLeads || []);
        setLeadCount(fetchedLeads?.length || 0);
      }

      // Wait a moment to show the final count
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.error('Gmail sync error:', error);
      // Fallback to demo leads
      setLeads(createDemoLeads());
      setLeadCount(5);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const createDemoLeads = (): Lead[] => {
    return [
      {
        id: 'demo-1',
        sender_email: 'sarah.johnson@techstartup.com',
        subject: 'Interested in your lead management solution',
        snippet: 'Hi! I came across your website and I\'m really interested in learning more about how your platform could help our growing sales team manage leads more effectively. We\'re currently handling about 200 leads per month manually and it\'s becoming overwhelming. Could we schedule a quick call to discuss pricing and features?',
        received_at: new Date().toISOString(),
        status: 'unclassified'
      },
      {
        id: 'demo-2',
        sender_email: 'mike.chen@growthagency.io',
        subject: 'Demo request for our agency',
        snippet: 'Hello, we\'re a digital marketing agency looking for a better way to manage client leads. Your AI-powered solution looks promising. What would be the best plan for an agency managing multiple client accounts?',
        received_at: new Date().toISOString(),
        status: 'unclassified'
      }
    ];
  };

  const selectBestDemoLead = (leads: Lead[]): Lead | null => {
    if (leads.length === 0) return null;
    
    // Find lead with question marks (shows engagement)
    const questionLead = leads.find(lead => 
      lead.snippet.includes('?') && 
      lead.snippet.length > 100 && 
      lead.snippet.length < 300
    );
    
    return questionLead || leads[0];
  };

  const generateAIResponse = async () => {
    const bestLead = selectBestDemoLead(leads);
    if (!bestLead) return;
    
    setSelectedLead(bestLead);
    setIsGenerating(true);
    
    // Wait a moment to build suspense
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Call our actual AI endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: bestLead.snippet,
          emailSubject: bestLead.subject,
          senderEmail: bestLead.sender_email,
          tone: 'professional',
          length: 'medium'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.response);
      } else {
        // Fallback to demo response
        setAiResponse(generateDemoResponse(bestLead));
      }
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback to demo response
      setAiResponse(generateDemoResponse(bestLead));
    }
    
    setIsGenerating(false);
    
    // Start typewriter effect
    setIsTyping(true);
  };

  const generateDemoResponse = (lead: Lead): string => {
    const firstName = lead.sender_email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    
    return `Hi ${capitalizedName},

Thank you for reaching out! I'm excited to hear about your interest in our lead management solution.

Based on what you've described, it sounds like you're dealing with exactly the challenges our platform was designed to solve. Managing 200+ leads manually is not only overwhelming but also means you're likely missing opportunities.

Our AI-powered system can help you:
• Automatically score and prioritize your hottest leads
• Generate personalized responses in seconds (like this one!)
• Never miss a follow-up with smart automation

I'd love to show you how this could transform your sales process. Are you available for a quick 15-minute demo this week? I can show you exactly how we'd handle your current lead volume.

Best regards,
Vadim Tuchila
Founder, InboxFlow`;
  };

  const triggerCelebration = () => {
    setShowConfetti(true);
    
    // Multiple confetti bursts
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 500);
  };

  const handleSendResponse = () => {
    if (selectedLead) {
      // Open email client with pre-filled response
      const subject = `Re: ${selectedLead.subject}`;
      const mailtoUrl = `mailto:${selectedLead.sender_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(aiResponse)}`;
      window.location.href = mailtoUrl;
      
      // Mark onboarding as complete and redirect to subscription
      localStorage.setItem('hasSeenOnboarding', 'true');
      toast.success('🎉 Amazing! Now let\'s unlock AI for all your leads...');
      
      setTimeout(() => {
        navigate('/subscription');
      }, 2000);
    }
  };

  const handleSeeAllFeatures = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    navigate('/subscription');
  };

  const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    useEffect(() => {
      if (!text || !isTyping) return;
      
      let i = 0;
      setDisplayedResponse('');
      
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayedResponse(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
          setIsTyping(false);
          onComplete?.();
        }
      }, 30); // Fast typing for excitement
      
      return () => clearInterval(timer);
    }, [text, isTyping, onComplete]);
    
    return (
      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
        {displayedResponse}
        {isTyping && <span className="animate-pulse">|</span>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-slate-600 mt-2 text-center">
            Step {step} of 4 • Getting your first AI response ready...
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </motion.div>
              
              <h1 className="text-4xl font-bold mb-4">
                Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">InboxFlow</span>! 🎉
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                Let's get your first AI-generated response in the next <span className="font-bold text-blue-600">30 seconds</span>
              </p>
              
              <div className="flex justify-center space-x-8 text-sm text-slate-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Connect Gmail
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Find Hot Leads
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Generate AI Response
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Gmail Sync */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <RefreshCw className="h-24 w-24 text-blue-600" />
                </motion.div>
                <Mail className="absolute inset-4 h-16 w-16 text-blue-800" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">
                🔍 Scanning your inbox for leads...
              </h2>
              
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {leadCount}
                </div>
                <p className="text-lg text-slate-700">leads discovered!</p>
                
                <div className="mt-4 flex justify-center space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: AI Response Generation */}
          {step === 3 && selectedLead && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  🎯 Found a hot lead! Watch AI work its magic...
                </h2>
                <p className="text-slate-600">
                  This is exactly the kind of lead that converts into customers
                </p>
              </div>

              {/* Email Preview */}
              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-slate-600 ml-2">Gmail</span>
                    </div>
                    <Badge variant="destructive" className="bg-red-500">
                      <Flame className="h-3 w-3 mr-1" />
                      HOT LEAD
                    </Badge>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-lg p-4">
                    <p className="font-semibold text-slate-900">From: {selectedLead.sender_email}</p>
                    <p className="text-sm text-slate-600 mb-2">Subject: {selectedLead.subject}</p>
                    <p className="text-slate-700 leading-relaxed">{selectedLead.snippet}</p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Response */}
              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative">
                      <Bot className="h-8 w-8 text-blue-600" />
                      {isGenerating && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute -top-1 -right-1"
                        >
                          <Sparkles className="h-4 w-4 text-purple-500" />
                        </motion.div>
                      )}
                    </div>
                    <div className="ml-3">
                      <span className="font-semibold text-slate-900">AI Assistant</span>
                      <div className="flex items-center text-sm text-slate-600">
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Writing personalized response...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            Response ready!
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 min-h-[200px]">
                    {aiResponse && (
                      <TypewriterText 
                        text={aiResponse} 
                        onComplete={() => {
                          setTimeout(() => {
                            setStep(4);
                            setProgress(100);
                            triggerCelebration();
                          }, 1000);
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Celebration */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center relative"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
              >
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                  />
                  <CheckCircle className="absolute inset-2 h-20 w-20 text-white" />
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold mb-4"
              >
                🎉 BOOM! Your AI response is ready!
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto mb-8"
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">30s</div>
                    <div className="text-sm text-slate-600">AI Response Time</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">10min</div>
                    <div className="text-sm text-slate-600">Your Usual Time</div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center text-green-700">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="font-semibold">20x Faster!</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-lg text-slate-600 mb-8"
              >
                This is just the beginning. Imagine having AI handle ALL your leads like this...
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button 
                  size="lg" 
                  onClick={handleSendResponse}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send This Response
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleSeeAllFeatures}
                  className="text-xl px-8 py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Unlock AI for All Leads
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-sm text-slate-500 mt-4"
              >
                ✨ Join 1000+ sales teams already using AI to convert more leads
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage; 