import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { InteractiveDemo } from '@/components/features/InteractiveDemo';
import { ROICalculator } from '@/components/features/ROICalculator';
import { FeatureTestimonials } from '@/components/features/FeatureTestimonials';
import {
  ArrowRight,
  Brain,
  Zap,
  ChartBar,
  Shield,
  Globe,
  Award,
  Lock,
  Play,
  Star,
  Users,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  X,
  Target,
  MessageSquare,
  Bot,
  DollarSign,
  Gauge,
  HeartHandshake,
  Rocket,
} from 'lucide-react';

// Live stats that update in real-time
const LiveStats = () => {
  const [stats, setStats] = useState({
    leads: 2847563,
    emails: 8294018,
    timeSaved: 94827,
    revenue: 42.7,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        leads: prev.leads + Math.floor(Math.random() * 10),
        emails: prev.emails + Math.floor(Math.random() * 20),
        timeSaved: prev.timeSaved + Math.random() * 0.5,
        revenue: prev.revenue + Math.random() * 0.01,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-slate-50 to-white py-16 border-b z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Real-Time Platform Metrics
          </Badge>
          <h3 className="text-2xl font-semibold text-slate-900">Trusted by Industry Leaders</h3>
        </motion.div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-4xl lg:text-5xl font-bold text-slate-900">
              {(stats.leads / 1000000).toFixed(2)}M+
            </div>
            <div className="text-sm text-slate-600 mt-1">Leads Processed</div>
            <div className="text-xs text-emerald-600 mt-2 font-medium">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +127/sec
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="text-4xl lg:text-5xl font-bold text-slate-900">
              {(stats.emails / 1000000).toFixed(2)}M+
            </div>
            <div className="text-sm text-slate-600 mt-1">Emails Analyzed</div>
            <div className="text-xs text-emerald-600 mt-2 font-medium">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +342/sec
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-4xl lg:text-5xl font-bold text-slate-900">
              {(stats.timeSaved / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-slate-600 mt-1">Hours Saved</div>
            <div className="text-xs text-emerald-600 mt-2 font-medium">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +4.2hrs/sec
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="text-4xl lg:text-5xl font-bold text-slate-900">
              ${stats.revenue.toFixed(1)}M+
            </div>
            <div className="text-sm text-slate-600 mt-1">Revenue Generated</div>
            <div className="text-xs text-emerald-600 mt-2 font-medium">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +$1.8k/sec
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Feature showcase with interactive demo
const FeatureShowcase = () => {
  const features = [
    {
      id: 'ai-scoring',
      title: 'AI-Powered Lead Intelligence',
      subtitle: '95% accuracy in lead qualification',
      description: 'Our proprietary AI analyzes 147+ data points in real-time, including behavioral patterns, engagement signals, and purchase intent indicators.',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      benefits: [
        { label: 'Behavioral Analysis', value: '147 data points' },
        { label: 'Accuracy Rate', value: '95%' },
        { label: 'Processing Speed', value: '<100ms' },
        { label: 'Learning Model', value: 'Self-improving' },
      ],
      testimonial: 'Increased our conversion rate by 312% in 3 months.',
    },
    {
      id: 'automation',
      title: 'Intelligent Workflow Automation',
      subtitle: 'Respond 10x faster, work 90% less',
      description: 'Set up complex multi-step workflows that adapt to each lead\'s behavior. Our AI generates personalized responses that feel human.',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      benefits: [
        { label: 'Response Time', value: '< 1 minute' },
        { label: 'Workflows', value: 'Unlimited' },
        { label: 'A/B Testing', value: 'Built-in' },
        { label: 'Personalization', value: 'AI-powered' },
      ],
      testimonial: 'Saved our team 40+ hours per week on manual tasks.',
    },
  ];

  const [activeFeature, setActiveFeature] = useState(features[0]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Rocket className="w-3 h-3 mr-1" />
            Enterprise-Grade Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Technology That Drives{' '}
            <span className="text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
              Real Results
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            See how industry leaders are transforming their sales process with our AI-powered platform
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeature.id === feature.id;
              return (
                <motion.button
                  key={feature.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFeature(feature)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-lg border-2 border-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {feature.title}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Feature Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Content Side */}
            <div>
              <Badge className={`mb-4 bg-gradient-to-r ${activeFeature.color} text-white border-0`}>
                <Star className="w-3 h-3 mr-1" />
                Customer Favorite
              </Badge>
              
              <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {activeFeature.title}
              </h3>
              
              <p className="text-xl text-slate-600 mb-2">
                {activeFeature.subtitle}
              </p>
              
              <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                {activeFeature.description}
              </p>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {activeFeature.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <CheckCircle2 className={`w-5 h-5 mr-2 mt-0.5 text-emerald-500`} />
                    <div>
                      <div className="font-semibold text-slate-900">{benefit.value}</div>
                      <div className="text-sm text-slate-600">{benefit.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Testimonial */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8"
              >
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-slate-400 mr-3" />
                  <p className="text-slate-700 italic">"{activeFeature.testimonial}"</p>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className={`bg-gradient-to-r ${activeFeature.color} text-white hover:shadow-lg transition-all duration-300`}
                  asChild
                >
                  <Link to="/login" className="flex items-center">
                    Try It Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsVideoPlaying(true)}
                  className="flex items-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch 2-Min Demo
                </Button>
              </div>
            </div>

            {/* Demo Side */}
            <div>
              <InteractiveDemo feature={activeFeature.id as any} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Main Features Page
const FeaturesPage = () => {
  const { scrollY } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <motion.div 
        ref={heroRef}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden z-10"
        style={{ y: heroY }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            }}
          />
        </div>

        <motion.div 
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 mt-16"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 mb-8"
            >
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <Award className="w-3 h-3 mr-1" />
                #1 Lead Management Platform 2025
              </Badge>
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <Users className="w-3 h-3 mr-1" />
                Trusted by the Best Sales Teams
              </Badge>
              {/* <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <Star className="w-3 h-3 mr-1" />
                4.9/5 Rating (2,847 Reviews)
              </Badge> */}
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              Features That{' '}
              <span className="relative">
                <span className="text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text">
                  Transform Sales
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Join industry leaders using enterprise-grade AI that delivers
              <span className="text-white font-semibold"> 3.5x higher conversion rates</span> and
              <span className="text-white font-semibold"> 87% less manual work</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl shadow-2xl shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 group"
                asChild
              >
                <Link to="/login" className="flex items-center">
                  <span className="relative z-10">Start Free 14-Day Trial</span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50 px-8 py-6 text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/pricing" className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  See Pricing & ROI
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i}`}
                    alt=""
                    className="w-12 h-12 rounded-full border-2 border-slate-800"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-slate-400">
                  <span className="text-white font-semibold">2,847+ teams</span> increased revenue by avg. 312%
                </p>
              </div>
            </motion.div> */}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </motion.div>
      </motion.div>

      {/* Live Stats Section */}
      <LiveStats />

      {/* Problem/Solution Section */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              <Target className="w-3 h-3 mr-1" />
              The Problem We Solve
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Your Sales Team Is{' '}
              <span className="text-red-600">Drowning</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              While competitors close deals, your team wastes hours on manual tasks
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-red-50 rounded-2xl p-8 border-2 border-red-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Without Inboxo</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">4+ hours daily on email management</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">77% of leads go cold waiting for responses</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Manual lead scoring misses 65% of opportunities</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Generic responses kill engagement</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">No visibility into pipeline health</span>
                </li>
              </ul>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-emerald-50 rounded-2xl p-8 border-2 border-emerald-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">With Inboxo</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">7 minutes daily - 97% automation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Respond in under 60 seconds, 24/7</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">AI identifies 95% of high-value leads</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Personalized AI responses that convert</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Real-time analytics predict revenue</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Impact Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-6">The Inboxo Impact</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold">3.5x</div>
                <div className="text-sm opacity-90">Higher Conversion</div>
              </div>
              <div>
                <div className="text-4xl font-bold">87%</div>
                <div className="text-sm opacity-90">Less Manual Work</div>
              </div>
              <div>
                <div className="text-4xl font-bold">$2.3M</div>
                <div className="text-sm opacity-90">Avg. Revenue Increase</div>
              </div>
              <div>
                <div className="text-4xl font-bold">14 days</div>
                <div className="text-sm opacity-90">To See ROI</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Interactive Features Showcase */}
      <FeatureShowcase />

      {/* ROI Calculator Section */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">
              <DollarSign className="w-3 h-3 mr-1" />
              ROI Calculator
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              See Your{' '}
              <span className="text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
                Potential ROI
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our customers see an average 3.5x increase in conversion rates. 
              Calculate what that means for your business.
            </p>
          </motion.div>
          <ROICalculator />
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">
              <HeartHandshake className="w-3 h-3 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Loved by{' '}
              <span className="text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                Sales Leaders
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See how companies like yours transformed their sales process
            </p>
          </motion.div>
          <FeatureTestimonials />
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Enterprise-Grade Security</h3>
            <p className="text-slate-400 mb-8">Your data is protected by industry-leading security standards</p>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { icon: Shield, label: 'SOC 2 Type II' },
                { icon: Globe, label: 'GDPR Compliant' },
                { icon: Award, label: 'ISO 27001' },
                { icon: Lock, label: 'HIPAA Ready' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                      <Icon className="w-8 h-8 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-400">{item.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge className="mb-6 bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <Clock className="w-4 h-4 mr-1" />
              Limited Time: 20% Off Annual Plans
            </Badge>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Ready to{' '}
              <span className="text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text">
                10x Your Sales?
              </span>
            </h2>
            
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join 10,000+ companies already using Inboxo to transform their sales process.
              Start your free trial today - no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-white text-purple-900 hover:bg-slate-100 px-8 py-6 text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 group"
                asChild
              >
                <Link to="/login" className="flex items-center">
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-8 py-6 text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/pricing" className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Talk to Sales
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                14-day free trial
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                Cancel anytime
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                Setup in 5 minutes
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage; 