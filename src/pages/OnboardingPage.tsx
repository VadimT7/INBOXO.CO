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
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-start the magic when component mounts (only once)
  useEffect(() => {
    if (user && !hasStarted) {  // Only start if we haven't started yet
      setHasStarted(true);
      startOnboardingFlow();
    }
  }, [user, hasStarted]);

  const startOnboardingFlow = async () => {
    // Prevent restart if we're already past step 1
    if (step > 1) return;
    
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
    
    // Step 4: Celebration - FINAL STEP, never go back
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
          length: 'short'
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
          {/* Step 1: Beautiful Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="relative mx-auto w-24 h-24 mb-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl"></div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl"
                ></motion.div>
                <div className="absolute inset-2 bg-white rounded-2xl flex items-center justify-center">
                  <Zap className="h-10 w-10 text-blue-600" />
                </div>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold mb-6"
              >
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  InboxFlow
                </span>
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-12 max-w-2xl mx-auto"
              >
                <p className="text-xl text-slate-700 mb-4 font-medium">
                  Watch AI turn your email leads into customers
                </p>
                <p className="text-lg text-slate-600">
                  We'll analyze your inbox and generate your first AI response in{' '}
                  <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    30 seconds
                  </span>
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center items-center space-x-8"
              >
                {[
                  { label: "Scan Gmail", delay: 0.7 },
                  { label: "Find Hot Leads", delay: 0.8 },
                  { label: "Generate Response", delay: 0.9 }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: item.delay, type: "spring" }}
                    className="flex items-center text-slate-600"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3 shadow-lg"
                    ></motion.div>
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Beautiful Gmail Sync */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="relative mx-auto w-20 h-20 mb-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl shadow-xl"></div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-blue-400/30 rounded-3xl"
                ></motion.div>
                <div className="absolute inset-2 bg-white rounded-2xl flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-8 w-8 text-emerald-600" />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold mb-6"
              >
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Analyzing
                </span>{' '}
                your inbox
              </motion.h2>
              
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto mb-8 overflow-hidden"
              >
                <motion.div
                  animate={{
                    background: [
                      "linear-gradient(45deg, #ecfeff, #f0f9ff)",
                      "linear-gradient(45deg, #f0f9ff, #f0fdf4)",
                      "linear-gradient(45deg, #f0fdf4, #ecfeff)"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 opacity-60"
                />
                
                <div className="relative">
                  <motion.div
                    key={leadCount}
                    initial={{ scale: 0.8, rotateY: -180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3"
                  >
                    {leadCount}
                  </motion.div>
                  <p className="text-lg text-slate-700 font-medium mb-6">potential leads found</p>
                  
                  <div className="flex justify-center space-x-2 mb-4">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.4, 1],
                          backgroundColor: [
                            "#10b981", 
                            "#3b82f6", 
                            "#8b5cf6", 
                            "#10b981"
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                          delay: i * 0.2 
                        }}
                        className="w-3 h-3 rounded-full shadow-lg"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-slate-600 font-medium"
              >
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent font-semibold">
                  AI is identifying
                </span>{' '}
                high-value prospects...
              </motion.p>
            </motion.div>
          )}

          {/* Step 3: Beautiful AI Generation */}
          {step === 3 && selectedLead && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
              >
                <motion.h2 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="text-4xl font-bold mb-3"
                >
                  <span className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
                    Perfect lead
                  </span>{' '}
                  identified
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-slate-600"
                >
                  Watch AI craft a response that converts
                </motion.p>
              </motion.div>

              {/* Beautiful Email Preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-2xl mx-auto"
              >
                <Card className="relative overflow-hidden shadow-2xl border-0">
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(45deg, #fef3c7, #fed7aa)",
                        "linear-gradient(45deg, #fed7aa, #fecaca)",
                        "linear-gradient(45deg, #fecaca, #fef3c7)"
                      ]
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute inset-0 opacity-30"
                  />
                  <CardContent className="relative p-6 bg-white/90 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                          className="w-3 h-3 bg-red-500 rounded-full shadow-sm"
                        ></motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                          className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"
                        ></motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                          className="w-3 h-3 bg-green-500 rounded-full shadow-sm"
                        ></motion.div>
                        <span className="text-sm text-slate-600 ml-2 font-medium">Gmail</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                        <Target className="h-3 w-3 mr-1" />
                        High Intent
                      </Badge>
                    </div>
                    
                    <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-xl p-4 shadow-inner">
                      <p className="font-semibold text-slate-900 mb-1">
                        From: {selectedLead.sender_email}
                      </p>
                      <p className="text-sm text-slate-600 mb-3">
                        Subject: {selectedLead.subject}
                      </p>
                      <p className="text-slate-700 leading-relaxed">
                        {selectedLead.snippet}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Beautiful AI Response Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                <Card className="relative overflow-hidden shadow-2xl border-0">
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(45deg, #1e293b, #0f172a)",
                        "linear-gradient(45deg, #0f172a, #1e293b)"
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0"
                  />
                  <CardContent className="relative p-6">
                    <div className="flex items-center mb-4">
                      <motion.div
                        animate={isGenerating ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="relative w-12 h-12 mr-4"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"></div>
                        <div className="absolute inset-1 bg-white rounded-lg flex items-center justify-center">
                          <Bot className="h-6 w-6 text-slate-700" />
                        </div>
                        {isGenerating && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                          ></motion.div>
                        )}
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-white text-lg">InboxFlow AI</h3>
                        <div className="flex items-center text-sm">
                          {isGenerating ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <Loader2 className="h-3 w-3 mr-1 text-blue-400" />
                              </motion.div>
                              <span className="text-blue-400 font-medium">Generating response...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 text-emerald-400 mr-1" />
                              <span className="text-emerald-400 font-medium">Response ready</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative bg-white rounded-xl p-6 shadow-inner min-h-[200px] overflow-hidden"
                    >
                      <motion.div
                        animate={{
                          background: [
                            "linear-gradient(45deg, #f8fafc, #f1f5f9)",
                            "linear-gradient(45deg, #f1f5f9, #f8fafc)"
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 opacity-50"
                      />
                      <div className="relative">
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
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Step 4: Beautiful Results */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {/* Step 1: We found an awesome lead */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.3 }}
                  className="mx-auto w-16 h-16 mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl"
                >
                  <CheckCircle className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold mb-4">
                  We found an{' '}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    amazing lead
                  </span>
                </h1>
                <p className="text-xl text-slate-600">
                  Here's what happened in the last 30 seconds...
                </p>
              </motion.div>

              {/* Step 2: Here is the lead */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  1. <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">The Lead</span>
                </h2>
                <Card className="relative overflow-hidden shadow-xl border-0">
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(45deg, #dbeafe, #e0f2fe)",
                        "linear-gradient(45deg, #e0f2fe, #dbeafe)"
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 opacity-50"
                  />
                  <CardContent className="relative p-6 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="text-sm text-slate-600 ml-2 font-medium">Gmail</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                        <Target className="h-3 w-3 mr-1" />
                        High Intent
                      </Badge>
                    </div>
                    
                    <div className="bg-white/90 rounded-xl p-4 shadow-sm">
                      <p className="font-semibold text-slate-900 mb-1">
                        From: {selectedLead?.sender_email || 'sarah.johnson@techstartup.com'}
                      </p>
                      <p className="text-sm text-slate-600 mb-3">
                        Subject: {selectedLead?.subject || 'Interested in your lead management solution'}
                      </p>
                      <p className="text-slate-700 leading-relaxed">
                        {selectedLead?.snippet || 'Hi! I came across your website and I\'m really interested in learning more about how your platform could help our growing sales team manage leads more effectively. We\'re currently handling about 200 leads per month manually and it\'s becoming overwhelming. Could we schedule a quick call to discuss pricing and features?'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 3: Here is the AI response */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  2. <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">InboxFlow's AI Response</span>
                </h2>
                <Card className="relative overflow-hidden shadow-xl border-0">
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(45deg, #1e293b, #334155)",
                        "linear-gradient(45deg, #334155, #1e293b)"
                      ]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute inset-0"
                  />
                  <CardContent className="relative p-6">
                    <div className="flex items-center mb-4">
                      <div className="relative w-12 h-12 mr-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg"></div>
                        <div className="absolute inset-1 bg-white rounded-lg flex items-center justify-center">
                          <Bot className="h-6 w-6 text-slate-700" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">InboxFlow AI</h3>
                        <div className="flex items-center text-sm text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="font-medium">Generated in 2.3 seconds</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-inner">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {aiResponse || `Hi Sarah,

Thank you for reaching out! I'm excited to hear about your interest in our lead management solution.

Based on what you've described, it sounds like you're dealing with exactly the challenges our platform was designed to solve. Managing 200+ leads manually is not only overwhelming but also means you're likely missing opportunities.

Our AI-powered system can help you:
• Automatically score and prioritize your hottest leads
• Generate personalized responses in seconds (like this one!)
• Never miss a follow-up with smart automation

I'd love to show you how this could transform your sales process. Are you available for a quick 15-minute demo this week? I can show you exactly how we'd handle your current lead volume.

Best regards,
Vadim Tuchila
Founder, InboxFlow`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 4: These leads convert by 85% */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  3. <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">The Results</span>
                </h2>
                <Card className="relative overflow-hidden shadow-xl border-0">
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(45deg, #ecfdf5, #f0fdf4)",
                        "linear-gradient(45deg, #f0fdf4, #ecfdf5)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0"
                  />
                  <CardContent className="relative p-8 text-center bg-white/70 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4"
                    >
                      85%
                    </motion.div>
                    <p className="text-xl font-bold text-green-800 mb-3">
                      Conversion Rate
                    </p>
                    <p className="text-green-700 text-lg">
                      Leads who receive AI responses like this convert 85% of the time.
                      That's <span className="font-bold text-emerald-800">17x higher</span> than industry average.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 5: The offer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="text-center space-y-6"
              >
                <div className="max-w-lg mx-auto">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    Ready to send this response?
                  </h2>
                  <p className="text-lg text-slate-600 mb-6">
                    Send this AI-generated message now, then unlock InboxFlow to automate 
                    all your future responses.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button 
                      size="lg" 
                      onClick={handleSendResponse}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 shadow-lg"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Send This Response
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button 
                      size="lg" 
                      onClick={handleSeeAllFeatures}
                      className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white text-lg py-6 shadow-lg"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Unlock All Your Leads
                    </Button>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-sm text-slate-500 space-y-1"
                >
                  <p>✓ 30-day money-back guarantee</p>
                  <p>✓ Setup takes 2 minutes</p>
                  <p>✓ Cancel anytime</p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage; 