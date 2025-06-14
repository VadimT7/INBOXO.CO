import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Zap,
  Users,
  Puzzle,
  Brain,
  Mail,
} from 'lucide-react';

const features = [
  {
    id: 'scoring',
    title: 'Smart Lead Scoring',
    icon: Brain,
    description: 'AI-powered lead scoring that gets smarter over time',
    details: [
      'Machine learning algorithms analyze email patterns',
      'Real-time lead quality assessment',
      'Behavioral scoring based on engagement',
      'Custom scoring rules for your business',
      'Priority inbox organization'
    ],
    image: '/features/lead-scoring.webp',
    color: 'from-purple-500 to-blue-500'
  },
  {
    id: 'automation',
    title: 'Intelligent Workflows',
    icon: Zap,
    description: 'Automate your lead nurturing process end-to-end',
    details: [
      'Custom automation rules',
      'Smart reply suggestions',
      'Scheduled follow-ups',
      'Multi-step workflows',
      'Trigger-based actions'
    ],
    image: '/features/automation.webp',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'integrations',
    title: 'Seamless Integrations',
    icon: Puzzle,
    description: 'Connect with your favorite tools and CRM systems',
    details: [
      'Native Gmail integration',
      'CRM synchronization',
      'Calendar connectivity',
      'API access',
      'Custom webhook support'
    ],
    image: '/features/integrations.webp',
    color: 'from-emerald-500 to-green-500'
  },
  {
    id: 'analytics',
    title: 'Powerful Analytics',
    icon: BarChart3,
    description: 'Data-driven insights to optimize your lead conversion',
    details: [
      'Real-time performance dashboards',
      'Conversion tracking',
      'Response time analytics',
      'Team performance metrics',
      'Custom report builder'
    ],
    image: '/features/analytics.webp',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'collaboration',
    title: 'Team Collaboration',
    icon: Users,
    description: 'Work together seamlessly on lead management',
    details: [
      'Shared inbox',
      'Team assignments',
      'Internal notes',
      'Activity timeline',
      'Role-based permissions'
    ],
    image: '/features/collaboration.webp',
    color: 'from-pink-500 to-rose-500'
  }
];

const FeatureSection = ({
  feature,
  index,
  isActive,
  onClick,
}: {
  feature: typeof features[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = feature.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 border-2 group ${
        isActive
          ? 'bg-white shadow-2xl scale-100 border-transparent bg-gradient-to-br from-slate-50 to-white'
          : 'bg-slate-50/80 hover:bg-white hover:shadow-xl scale-95 border-slate-200/60 hover:border-slate-300'
      }`}
      onClick={onClick}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} transform transition-transform duration-300 hover:scale-110 shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-slate-900">{feature.title}</h3>
        <p className="mt-4 text-slate-600 max-w-sm">{feature.description}</p>
        
        {!isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r ${feature.color} text-white opacity-90 hover:opacity-100 transition-all duration-300 relative group overflow-hidden`}>
              <span className="relative z-10 flex items-center">
                Discover More
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              {/* Glowing effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/20 via-transparent to-white/20 group-hover:animate-pulse" />
            </span>
          </motion.div>
        )}

        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <ul className="mt-6 space-y-4">
              {feature.details.map((detail, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-center text-slate-700"
                >
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color} mr-3 flex-shrink-0`} />
                  <span>{detail}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Card background effects */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 transition-opacity duration-300 ${
          isActive ? 'opacity-5' : 'group-hover:opacity-5'
        }`}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 rounded-2xl transition-opacity duration-300 ${
        isActive ? 'opacity-10' : 'opacity-0 hover:opacity-10'
      }`} />
    </motion.div>
  );
};

const FeaturesPage = () => {
  const [activeFeature, setActiveFeature] = useState<string>(features[0].id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 mt-8">
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Modern Lead Management
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mt-8 mb-12">
              Transform your inbox into a powerful lead conversion machine with our
              comprehensive suite of features.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-4">
              <Button
                size="lg"
                className="relative group overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white text-xl px-12 py-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]"
                asChild
              >
                <Link to="/login" className="flex items-center">
                  <span className="z-10">Start Free Trial</span>
                  <ArrowRight className="ml-3 h-7 w-7 z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="relative group overflow-hidden border-2 border-slate-400 bg-slate-800/50 text-slate-200 hover:text-white backdrop-blur-sm text-xl px-12 py-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                asChild
              >
                <Link to="/pricing" className="flex items-center">
                  <span className="z-10">View Pricing</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-900 opacity-0 group-hover:opacity-90 transition-opacity duration-300" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <FeatureSection
              key={feature.id}
              feature={feature}
              index={index}
              isActive={activeFeature === feature.id}
              onClick={() => setActiveFeature(feature.id)}
            />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Lead Management?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that have already streamlined their lead
              conversion process with our powerful features.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="relative group overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white text-xl px-12 py-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]"
                asChild
              >
                <Link to="/login" className="flex items-center">
                  <span className="z-10">Start Free Trial</span>
                  <ArrowRight className="ml-3 h-7 w-7 z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="relative group overflow-hidden border-2 border-slate-400 bg-slate-800/50 text-slate-200 hover:text-white backdrop-blur-sm text-xl px-12 py-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                asChild
              >
                <Link to="/pricing" className="flex items-center">
                  <span className="z-10">View Pricing</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-900 opacity-0 group-hover:opacity-90 transition-opacity duration-300" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage; 