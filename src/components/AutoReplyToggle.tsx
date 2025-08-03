import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Zap, Bot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAutoReply } from '@/hooks/useAutoReply';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export function AutoReplyToggle() {
  const { settings, loading, toggleAutoReply, saveSettings } = useAutoReply();
  const [showSettings, setShowSettings] = useState(false);

  // Example responses for all 9 combinations
  const getExampleResponse = (tone: string, length: string) => {
    const examples = {
      professional: {
        short: "Dear Sarah,\n\nThank you for your inquiry about our marketing services. We'd be happy to discuss how our solutions can help grow your business. Our team specializes in digital marketing and we've helped companies like yours achieve measurable results.\n\nI'd love to schedule a brief call to understand your specific needs.\n\nBest regards,\nJohn Smith",
        
        medium: "Dear Sarah,\n\nThank you for reaching out regarding our marketing services. We appreciate your interest and would be delighted to assist you.\n\nOur company specializes in providing comprehensive digital marketing solutions that help businesses streamline their operations and achieve their growth goals. We've worked with numerous clients in similar situations and have consistently delivered results that exceed expectations.\n\nI'd like to propose a brief consultation call where we can better understand your specific requirements and present tailored recommendations. Please let me know a convenient time for you.\n\nBest regards,\nJohn Smith",
        
        detailed: "Dear Sarah,\n\nThank you for your inquiry regarding our marketing services. I appreciate you taking the time to reach out to us.\n\nOur company has been helping businesses like yours achieve their objectives through our comprehensive suite of digital marketing services. We understand that every business faces unique challenges, and our approach is always tailored to meet specific client needs.\n\nBased on your initial inquiry, I believe our social media management and content marketing services would be particularly beneficial for your organization. We've successfully implemented similar solutions for companies in your industry, resulting in improved brand visibility and measurable ROI.\n\nI would welcome the opportunity to discuss your requirements in detail and provide you with a customized proposal. Could we schedule a consultation call this week? I'm available Tuesday through Thursday afternoons and would be happy to work around your schedule.\n\nBest regards,\nJohn Smith"
      },
      
      friendly: {
        short: "Hi Sarah!\n\nThanks so much for reaching out - it's great to hear from you! We'd love to help you with your marketing needs. Our team has tons of experience in this area and we're excited about the possibility of working together.\n\nWould you have 15 minutes for a quick chat this week?\n\nLooking forward to connecting!\nJohn",
        
        medium: "Hi Sarah!\n\nThanks for your message - it really made my day! We're thrilled that you're considering us for your marketing project.\n\nOur team is passionate about helping businesses like yours succeed, and we've had some amazing results with similar projects. What excites me most about your inquiry is the potential for creative collaboration.\n\nWe'd love to hop on a call and learn more about your goals and how we can support them. I'm confident we can create something great together! When would be a good time for a friendly chat? I'm pretty flexible and happy to work around your schedule.\n\nBest,\nJohn",
        
        detailed: "Hi Sarah!\n\nWhat a wonderful surprise to receive your inquiry about marketing services! I'm genuinely excited about the possibility of working with you and your team.\n\nYour project sounds fascinating, and it's exactly the kind of challenge our team loves to tackle. We've been helping businesses like yours for several years now, and every project teaches us something new. What I find particularly interesting about your situation is the opportunity to blend creativity with data-driven results.\n\nOur team is known for being collaborative, responsive, and truly invested in our clients' success. We don't just deliver services; we build lasting partnerships. I'd love to set up a conversation where we can dive deeper into your needs and explore how we might work together.\n\nAre you free for a call this week? I'm thinking we could start with a casual 30-minute chat to get to know each other better. I'll also send over some examples of recent work that might be relevant to your project.\n\nLooking forward to connecting soon!\nJohn"
      },
      
      casual: {
        short: "Hey Sarah!\n\nThanks for reaching out about marketing help. We're definitely the right team for this - we've done tons of similar work and would love to help you out.\n\nWant to jump on a quick call and chat about it? I'm free most of this week.\n\nCheers,\nJohn",
        
        medium: "Hey Sarah!\n\nThanks for the message about marketing services - sounds like a cool project! We're totally up for helping you out with this.\n\nOur team has been doing this kind of work for a while now and we've got some pretty solid experience under our belts. What you're describing sounds right up our alley, and honestly, it sounds like it could be a lot of fun to work on.\n\nWant to grab a coffee (virtual or real) and chat about it? I'm thinking we could do a quick 20-30 minute call where I can learn more about what you're trying to achieve and share some ideas.\n\nLet me know what works for your schedule!\nCheers,\nJohn",
        
        detailed: "Hey Sarah!\n\nThanks for reaching out about marketing services - this sounds like exactly the kind of project our team gets excited about! I've been doing this type of work for several years now, and your inquiry really caught my attention.\n\nWe're a pretty laid-back team but we take our work seriously, and we've helped a bunch of companies tackle similar challenges. What I love about projects like yours is that there's always room to get creative and find solutions that really work for your specific situation.\n\nWe're not about cookie-cutter approaches - we like to dig in, understand what makes your business tick, and build something that actually makes sense for you. I'm thinking it would be great to hop on a call and chat about this properly.\n\nWe could start with a casual conversation about your goals and see if there's a good fit. I'm pretty flexible with timing - mornings, afternoons, whatever works best for you. I might also send over some examples of similar work we've done, just so you can get a feel for our approach.\n\nWhat do you think? Ready to dive in and see what we can create together?\nCheers,\nJohn"
      }
    };

    return (examples as any)[tone]?.[length] || '';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Main Toggle */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Bot className={`h-4 w-4 ${settings.enabled ? 'text-green-600' : 'text-slate-400'}`} />
          <Label htmlFor="auto-reply" className="text-sm font-medium">
            Auto-Reply
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="auto-reply"
            checked={settings.enabled}
            onCheckedChange={toggleAutoReply}
            disabled={loading}
          />
          
          <AnimatePresence>
            {settings.enabled && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 font-medium">ON</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings Popup */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="p-2 h-10 w-10"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Auto-Reply Settings
            </DialogTitle>
            <DialogDescription>
              Configure how Inboxo automatically responds to your leads
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Status Indicator */}
              <div className={`p-4 rounded-lg border-2 ${
                settings.enabled 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    settings.enabled ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <span className="font-medium">
                    Auto-Reply is {settings.enabled ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  {settings.enabled && <Zap className="h-4 w-4 text-green-600" />}
                </div>
              </div>

              {/* Tone Setting */}
              <div className="space-y-2">
                <Label>Response Tone</Label>
                <Select
                  value={settings.tone}
                  onValueChange={(value: any) => saveSettings({ tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Length Setting */}
              <div className="space-y-2">
                <Label>Response Length</Label>
                <Select
                  value={settings.length}
                  onValueChange={(value: any) => saveSettings({ length: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (50-75 words)</SelectItem>
                    <SelectItem value="medium">Medium (100-150 words)</SelectItem>
                    <SelectItem value="detailed">Detailed (200+ words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">💡 Pro Tip:</span> Auto-replies use your business context 
                  from Settings → Advanced to personalize responses.
                </p>
              </div>
            </div>

            {/* Example Preview Panel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-700">Preview Example</h3>
                <Badge variant="outline" className="text-xs">
                  {settings.tone} • {settings.length}
                </Badge>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="text-xs text-slate-500 mb-2 font-medium">
                  Sample auto-reply with your current settings:
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-line font-mono leading-relaxed">
                  {getExampleResponse(settings.tone, settings.length)}
                </div>
              </div>
              
              <div className="text-xs text-slate-500 space-y-1">
                <div>• Response tone: <span className="font-medium capitalize">{settings.tone}</span></div>
                <div>• Response length: <span className="font-medium capitalize">{settings.length}</span></div>
                <div>• Uses your business info for personalization</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 