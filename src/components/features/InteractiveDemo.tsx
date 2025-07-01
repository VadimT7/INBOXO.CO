import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Mail, 
  Target, 
  Send, 
  TrendingUp, 
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bot,
  MessageSquare
} from 'lucide-react';

interface DemoProps {
  feature: 'ai-scoring' | 'automation' | 'analytics';
}

export const InteractiveDemo = ({ feature }: DemoProps) => {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsActive(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-[800px] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden shadow-2xl">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/50 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              opacity: 0
            }}
            animate={{ 
              y: '-100%',
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
      
      {feature === 'ai-scoring' && <AIScoreDemo isActive={isActive} />}
      {feature === 'automation' && <AutomationFlowDemo isActive={isActive} />}
      {feature === 'analytics' && <AnalyticsDashboardDemo isActive={isActive} />}
    </div>
  );
};

const AIScoreDemo = ({ isActive }: { isActive: boolean }) => {
  const [emails, setEmails] = useState([
    { id: 1, from: 'sarah@techcorp.com', subject: 'Re: Enterprise Solution Pricing', score: 0, status: 'pending' },
    { id: 2, from: 'mike@startup.io', subject: 'Quick question about features', score: 0, status: 'pending' },
    { id: 3, from: 'noreply@newsletter.com', subject: 'Your weekly digest', score: 0, status: 'pending' },
    { id: 4, from: 'ceo@fortune500.com', subject: 'Interested in partnership', score: 0, status: 'pending' },
  ]);

  useEffect(() => {
    if (isActive) {
      const processEmails = async () => {
        for (let i = 0; i < emails.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setEmails(prev => prev.map((email, index) => {
            if (index === i) {
              const scores = [95, 42, 12, 98];
              return { 
                ...email, 
                score: scores[i], 
                status: scores[i] > 70 ? 'hot' : scores[i] > 40 ? 'warm' : 'cold' 
              };
            }
            return email;
          }));
        }
      };
      processEmails();
    }
  }, [isActive]);

  return (
    <div className="p-8 h-full flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-8"
      >
        <Brain className="w-8 h-8 text-purple-400 mr-3" />
        <h3 className="text-2xl font-bold text-white">AI Lead Scoring Engine</h3>
      </motion.div>
      
      <div className="flex-1 space-y-4">
        {emails.map((email, index) => (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-white font-medium">{email.from}</div>
                  <div className="text-slate-400 text-sm">{email.subject}</div>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {email.status === 'pending' ? (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Bot className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span className="text-blue-400 text-sm">Analyzing...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="scored"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className={`text-2xl font-bold ${
                      email.status === 'hot' ? 'text-red-400' : 
                      email.status === 'warm' ? 'text-yellow-400' : 
                      'text-blue-400'
                    }`}>
                      {email.score}%
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      email.status === 'hot' ? 'bg-red-400/20 text-red-300' : 
                      email.status === 'warm' ? 'bg-yellow-400/20 text-yellow-300' : 
                      'bg-blue-400/20 text-blue-300'
                    }`}>
                      {email.status.toUpperCase()} LEAD
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mt-6 p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-emerald-400 mr-2" />
            <span className="text-emerald-300 font-medium">2 Hot Leads Identified!</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center"
          >
            Take Action
            <ArrowRight className="w-4 h-4 ml-1" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const AutomationFlowDemo = ({ isActive }: { isActive: boolean }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { icon: Mail, label: 'Email Received', description: 'New inquiry from potential client' },
    { icon: Brain, label: 'AI Analysis', description: 'Intent and sentiment detected' },
    { icon: Target, label: 'Lead Scored', description: '92% match - High priority' },
    { icon: MessageSquare, label: 'Response Generated', description: 'Personalized reply created' },
    { icon: Send, label: 'Auto-Sent', description: 'Response delivered in 37 seconds' },
  ];

  useEffect(() => {
    if (isActive) {
      const timer = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isActive, steps.length]);

  return (
    <div className="p-8 h-full flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-8"
      >
        <Zap className="w-8 h-8 text-blue-400 mr-3" />
        <h3 className="text-2xl font-bold text-white">Intelligent Workflow Engine</h3>
      </motion.div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-lg">
          {/* Connection lines */}
          {steps.map((_, index) => {
            if (index < steps.length - 1) {
              const isActive = index < currentStep;
              return (
                <motion.div
                  key={`line-${index}`}
                  className="absolute left-10 bg-slate-700"
                  style={{
                    top: `${(index + 1) * 100}px`,
                    width: '2px',
                    height: '80px',
                  }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-b from-blue-400 to-purple-400"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isActive ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ transformOrigin: 'top' }}
                  />
                </motion.div>
              );
            }
            return null;
          })}
          
          {/* Steps */}
          <div className="relative space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <motion.div
                    animate={{ 
                      scale: isCurrent ? [1, 1.2, 1] : 1,
                      boxShadow: isCurrent ? '0 0 40px rgba(59, 130, 246, 0.5)' : 'none'
                    }}
                    transition={{ duration: 0.5 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-slate-700'
                    }`}
                  >
                    <Icon className={`w-10 h-10 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className={`font-semibold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                      {step.label}
                    </div>
                    <div className={`text-sm ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                      {step.description}
                    </div>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 grid grid-cols-3 gap-4"
      >
        <div className="text-center p-4 bg-slate-800/50 rounded-xl">
          <div className="text-2xl font-bold text-purple-400">37s</div>
          <div className="text-sm text-slate-400">Avg Response Time</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-xl">
          <div className="text-2xl font-bold text-blue-400">98%</div>
          <div className="text-sm text-slate-400">Accuracy Rate</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-xl">
          <div className="text-2xl font-bold text-emerald-400">24/7</div>
          <div className="text-sm text-slate-400">Always Active</div>
        </div>
      </motion.div>
    </div>
  );
};

const AnalyticsDashboardDemo = ({ isActive }: { isActive: boolean }) => {
  const [chartData, setChartData] = useState(Array(7).fill(0));
  
  useEffect(() => {
    if (isActive) {
      const newData = [45, 68, 52, 78, 85, 92, 98];
      const timer = setInterval(() => {
        setChartData(prev => 
          prev.map((val, i) => {
            const target = newData[i];
            const diff = target - val;
            return val + diff * 0.1;
          })
        );
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isActive]);

  return (
    <div className="p-8 h-full flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center mb-8"
      >
        <TrendingUp className="w-8 h-8 text-emerald-400 mr-3" />
        <h3 className="text-2xl font-bold text-white">Predictive Analytics Dashboard</h3>
      </motion.div>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-sm">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">73.2%</div>
          <div className="text-sm text-emerald-400">+22.5% this month</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-300 text-sm">Response Time</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">1.2 min</div>
          <div className="text-sm text-emerald-400">-87% improvement</div>
        </motion.div>
      </div>
      
      <div className="flex-1 bg-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-300 font-medium">Weekly Lead Quality Trend</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full" />
            <span className="text-sm text-slate-400">High Quality</span>
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between space-x-2">
          {chartData.map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          ))}
        </div>
        
        <div className="flex justify-between mt-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <span key={i} className="text-xs text-slate-500">{day}</span>
          ))}
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-emerald-300 font-medium">AI Prediction</div>
            <div className="text-sm text-slate-400">Next week: +18% more qualified leads expected</div>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-6 h-6 text-emerald-400" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}; 