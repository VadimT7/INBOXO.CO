import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Zap, RefreshCw, Copy, Check, Sparkles, Brain, 
  Clock, ArrowRight, Wand2, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAIResponseHistory } from '@/hooks/useAIResponseHistory';
import { supabase } from '@/integrations/supabase/client';

interface AIResponseGeneratorProps {
  lead: {
    id?: string;
    sender_email: string;
    subject: string;
    snippet: string;
    full_content?: string;
  };
  onUseResponse: (response: string) => void;
}

export const AIResponseGenerator = ({ lead, onUseResponse }: AIResponseGeneratorProps) => {
  const { writingStyle, saveResponseToHistory, getSimilarResponses } = useAIResponseHistory();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'casual'>(
    (writingStyle.preferred_tone as any) || 'professional'
  );
  const [responseLength, setResponseLength] = useState<'short' | 'medium' | 'detailed'>(
    (writingStyle.preferred_length as any) || 'short'
  );
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generationTime, setGenerationTime] = useState(0);
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  
  // Add ref for auto-scrolling
  const aiPanelRef = useRef<HTMLDivElement>(null);

  // Update defaults when writing style loads
  useEffect(() => {
    if (writingStyle.preferred_tone) {
      setSelectedTone(writingStyle.preferred_tone as any);
    }
    if (writingStyle.preferred_length) {
      setResponseLength(writingStyle.preferred_length as any);
    }
  }, [writingStyle]);

  // Auto-scroll when AI panel opens
  useEffect(() => {
    if (showAIPanel && aiPanelRef.current) {
      setTimeout(() => {
        aiPanelRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }, 100); // Small delay to allow animation to start
    }
  }, [showAIPanel]);

  const tones = [
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'friendly', label: 'Friendly', icon: '😊' },
    { value: 'casual', label: 'Casual', icon: '👋' }
  ];

  const lengths = [
    { value: 'short', label: 'Short', words: '50-75' },
    { value: 'medium', label: 'Medium', words: '100-150' },
    { value: 'detailed', label: 'Detailed', words: '200+' }
  ];

  const generateAIResponse = async () => {
    setIsGenerating(true);
    const startTime = Date.now();

    try {
      // Get similar past responses for context
      const similarResponses = await getSimilarResponses(lead.sender_email);
      
      // Call the real AI endpoint
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-ai-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: lead.full_content || lead.snippet,
          emailSubject: lead.subject,
          senderEmail: lead.sender_email,
          tone: selectedTone,
          length: responseLength,
          writingStyle,
          similarResponses
        }),
      });

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        let errorMessage = 'Failed to generate response';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Could not parse error response as JSON:', e);
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          errorMessage = `Server error (${response.status}): ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let aiData;
      try {
        aiData = await response.json();
      } catch (e) {
        console.error('Could not parse response as JSON:', e);
        const responseText = await response.text();
        console.error('Response text:', responseText);
        throw new Error('Invalid response format from AI service');
      }
      
      const generatedResponseText = aiData.response;

      setGeneratedResponse(generatedResponseText);
      setGenerationTime((Date.now() - startTime) / 1000);
      
      // Save to history
      if (lead.id) {
        const saved = await saveResponseToHistory(
          lead.id,
          lead.sender_email,
          lead.subject,
          lead.full_content || lead.snippet,
          generatedResponseText,
          selectedTone,
          responseLength
        );
        
        if (saved) {
          // Generate a temporary ID for this response
          setCurrentResponseId(`temp_${Date.now()}`);
        }
      }
      
      // Show success animation
      toast.success('🤖 AI Response Generated!', {
        description: `Generated in ${((Date.now() - startTime) / 1000).toFixed(1)}s using GPT-4`
      });
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      // If AI service fails, fall back to template-based response for now
      if (error.message?.includes('AI service not configured') || error.message?.includes('Invalid response format')) {
        console.log('Falling back to template-based response');
        const fallbackResponse = generateResponseBasedOnContent(
          lead.full_content || lead.snippet,
          lead.subject,
          selectedTone,
          responseLength,
          []
        );
        
        setGeneratedResponse(fallbackResponse);
        setGenerationTime((Date.now() - startTime) / 1000);
        
        // Save to history
        if (lead.id) {
          await saveResponseToHistory(
            lead.id,
            lead.sender_email,
            lead.subject,
            lead.full_content || lead.snippet,
            fallbackResponse,
            selectedTone,
            responseLength
          );
        }
        
        toast.success('📝 Response Generated!', {
          description: `Generated in ${((Date.now() - startTime) / 1000).toFixed(1)}s (template-based)`
        });
      } else {
        toast.error(error.message || 'Failed to generate response');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateResponseBasedOnContent = (
    content: string,
    subject: string,
    tone: string,
    length: string,
    similarResponses: any[]
  ): string => {
    // This is a simplified version. In production, this would call an AI API
    const contentLower = content.toLowerCase();
    
    // Detect intent from email content
    let intent = 'general';
    if (contentLower.includes('price') || contentLower.includes('cost') || contentLower.includes('budget')) {
      intent = 'pricing';
    } else if (contentLower.includes('demo') || contentLower.includes('trial')) {
      intent = 'demo';
    } else if (contentLower.includes('feature') || contentLower.includes('how')) {
      intent = 'features';
    }

    // Add personalization from writing style
    const signature = writingStyle.signature || '[Your Name]';

    // Generate response based on intent and tone
    const responses = {
      pricing: {
        professional: `Thank you for your interest in our pricing. I'd be happy to discuss our pricing options that best fit your needs. 

Our plans start at $X/month and scale based on your usage. I've attached our detailed pricing guide for your reference.

Would you be available for a brief 15-minute call this week to discuss which plan would work best for your specific requirements?

Best regards,
${signature}`,
        friendly: `Hi there! 

Thanks so much for reaching out about pricing! I'd love to help you find the perfect plan. 

We have several options starting from $X/month, and I think we can definitely find something that fits your budget. How about we hop on a quick call to chat about what would work best for you?

Looking forward to hearing from you!
${signature}`,
        casual: `Hey!

Great question about pricing! We've got options starting at $X/month - super flexible depending on what you need.

Want to jump on a quick call to figure out the best fit? I'm free most afternoons this week.

Cheers,
${signature}`
      },
      demo: {
        professional: `Thank you for your interest in scheduling a demo. I would be delighted to show you how our solution can address your specific needs.

I have availability this week on:
- Tuesday, 2:00 PM - 4:00 PM EST
- Thursday, 10:00 AM - 12:00 PM EST
- Friday, 1:00 PM - 3:00 PM EST

The demo typically takes 30 minutes. Please let me know which time works best for you, and I'll send a calendar invitation.

Best regards,
${signature}`,
        friendly: `Hi there!

I'm so excited that you're interested in seeing a demo! I'd love to show you around and answer any questions you have.

I'm available for a demo:
- Tuesday afternoon
- Thursday morning
- Friday after lunch

Which works best for you? The demo usually takes about 30 minutes, and I promise to make it worth your time!

Can't wait to connect!
${signature}`,
        casual: `Hey!

Awesome that you want to see a demo! I'd be happy to show you the ropes.

I'm pretty flexible this week - when works for you? Takes about 30 mins and I'll make sure to focus on the stuff that matters to you.

Talk soon!
${signature}`
      },
      general: {
        professional: `Thank you for reaching out. I appreciate your interest in our services.

${subject.includes('Re:') ? "I'm following up on our previous conversation. " : ""}I'd be happy to discuss how we can help you achieve your goals.

Could you share a bit more about your specific needs? This will help me provide you with the most relevant information.

I look forward to your response.

Best regards,
${signature}`,
        friendly: `Hi there!

Thanks so much for getting in touch! ${subject.includes('Re:') ? "Great to hear back from you! " : ""}

I'd love to learn more about what you're looking for so I can help you better. What specific challenges are you trying to solve?

Looking forward to chatting more!
${signature}`,
        casual: `Hey!

Thanks for reaching out! ${subject.includes('Re:') ? "Good to hear from you again! " : ""}

Tell me a bit more about what you need - happy to help however I can.

Cheers,
${signature}`
      }
    };

    let response = responses[intent as keyof typeof responses][tone as keyof typeof responses.pricing];

    // Adjust length
    if (length === 'short') {
      // Take first paragraph only
      response = response.split('\n\n')[0] + `\n\nBest regards,\n${signature}`;
    } else if (length === 'detailed') {
      // Add more detail
      response = response.replace(
        'Best regards,',
        `\nI've also prepared some additional resources that might be helpful for you. Let me know if you'd like me to send those over.

If you have any other questions in the meantime, please don't hesitate to reach out.

Best regards,`
      );
    }

    // Add custom phrases if any
    if (writingStyle.custom_phrases && writingStyle.custom_phrases.length > 0) {
      // In a real implementation, this would intelligently incorporate custom phrases
    }

    return response;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Response copied to clipboard!');
  };

  const handleUseResponse = (response: string) => {
    // Mark the response as used in history
    if (currentResponseId) {
      // In a real implementation, this would update the actual response ID
    }
    
    // Collapse the AI panel for better UX
    setShowAIPanel(false);
    
    // Clear the generated response
    setGeneratedResponse('');
    
    onUseResponse(response);
  };

  return (
    <div className="space-y-4">
      {/* AI Toggle Button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <Button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={cn(
            "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-6 py-2 shadow-lg transform transition-all duration-300",
            showAIPanel && "scale-105 shadow-xl"
          )}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI AutoPilot Response
          <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
            NEW
          </Badge>
        </Button>
      </motion.div>

      {/* AI Response Panel */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            ref={aiPanelRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-800">AI Response Generator</h3>
                  </div>
                  {generationTime > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Generated in {generationTime.toFixed(1)}s
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tone Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Response Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {tones.map((tone) => (
                      <Button
                        key={tone.value}
                        variant={selectedTone === tone.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTone(tone.value as any)}
                        className="w-full"
                      >
                        <span className="mr-1">{tone.icon}</span>
                        {tone.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Length Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Response Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {lengths.map((length) => (
                      <Button
                        key={length.value}
                        variant={responseLength === length.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResponseLength(length.value as any)}
                        className="w-full"
                      >
                        <div className="text-center">
                          <div className="font-medium">{length.label}</div>
                          <div className="text-xs opacity-70">{length.words} words</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={generateAIResponse}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating magic...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Response
                      </>
                    )}
                  </Button>
                </div>

                {/* Generated Response */}
                {generatedResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        Generated Response
                      </label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyToClipboard}
                        >
                          {copied ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={generateAIResponse}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Textarea
                        value={generatedResponse}
                        onChange={(e) => setGeneratedResponse(e.target.value)}
                        className="min-h-[200px] bg-white/80 border-purple-200"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          AI Generated
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setGeneratedResponse('')}
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={() => handleUseResponse(generatedResponse)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reply With This Response
                      </Button>
                    </div>

                    {/* Time Saved Badge */}
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-sm px-4 py-2 bg-green-50 text-green-700 border-green-200">
                        <Clock className="h-3 w-3 mr-2" />
                        Time saved: ~10 minutes
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 