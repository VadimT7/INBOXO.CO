import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Building2,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const customers = [
  {
    id: 'salesforce',
    name: 'TechVision Solutions',
    industry: 'Enterprise Software',
    logo: '/customers/techvision-logo.webp',
    quote: "InboxFlow revolutionized our sales process. The AI-powered lead scoring helped us identify high-value opportunities 4x faster, and our team's productivity skyrocketed.",
    stats: {
      responseTime: '85%',
      conversionRate: '4x',
      timesSaved: '25',
      revenueIncrease: '156'
    },
    spokesperson: {
      name: 'Michael Chen',
      role: 'VP of Global Sales',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    color: 'from-amber-500 to-yellow-500',
    case_study: {
      challenge: 'Managing a rapidly growing sales pipeline with over 10,000 monthly leads while maintaining personalized engagement and quick response times.',
      solution: "Implemented InboxFlow's enterprise solution with custom AI models and automated workflow triggers",
      results: [
        'Reduced lead qualification time from 3 days to 4 hours',
        'Increased sales team productivity by 156%',
        'Automated 85% of lead routing and initial responses',
        'Achieved 4x higher conversion rate for enterprise deals'
      ]
    }
  },
  {
    id: 'rapid-growth',
    name: 'GrowthForce Marketing',
    industry: 'Digital Marketing',
    logo: '/customers/growthforce-logo.webp',
    quote: "The automated lead scoring and response system transformed our agency. We now handle 3x more clients with the same team size, and our client satisfaction scores have never been higher.",
    stats: {
      responseTime: '92%',
      conversionRate: '3x',
      timesSaved: '20',
      revenueIncrease: '187'
    },
    spokesperson: {
      name: 'Sarah Martinez',
      role: 'Director of Operations',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    color: 'from-blue-500 to-indigo-500',
    case_study: {
      challenge: 'Scaling client communication and lead nurturing while maintaining high-touch service quality for a fast-growing agency.',
      solution: "Deployed InboxFlow's agency suite with custom templates and multi-channel automation",
      results: [
        'Scaled from 50 to 200 active clients in 6 months',
        'Maintained 98% client satisfaction score',
        'Reduced response time to under 30 minutes',
        'Increased team efficiency by 187%'
      ]
    }
  },
  {
    id: 'enterprise',
    name: 'GlobalTech Industries',
    industry: 'Manufacturing',
    logo: '/customers/globaltech-logo.webp',
    quote: "InboxFlow helped us modernize our entire sales approach. The integration with our existing CRM was seamless, and the ROI has been exceptional - we've seen a 205% increase in qualified leads.",
    stats: {
      responseTime: '78%',
      conversionRate: '2.8x',
      timesSaved: '32',
      revenueIncrease: '205'
    },
    spokesperson: {
      name: 'David Rodriguez',
      role: 'Chief Revenue Officer',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    color: 'from-emerald-500 to-teal-500',
    case_study: {
      challenge: 'Unifying global sales teams across 12 countries and modernizing a legacy lead management system.',
      solution: "Implemented InboxFlow's enterprise platform with custom localization and advanced analytics",
      results: [
        'Unified 250+ sales reps on a single platform',
        'Increased cross-border deal collaboration by 150%',
        'Reduced lead leakage by 95%',
        'Achieved 205% ROI within first year'
      ]
    }
  }
];

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white/90 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        <h4 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">{value}</h4>
      </div>
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </motion.div>
);

const CustomerStory = ({
  customer,
  isActive,
  onClick,
}: {
  customer: typeof customers[0];
  isActive: boolean;
  onClick: () => void;
}) => {
  // Commenting out video state as it's not implemented yet
  // const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer ${
          isActive 
            ? 'bg-white shadow-[0_0_50px_-12px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_-6px_rgba(234,179,8,0.5)]' 
            : 'bg-white/40 hover:bg-white hover:shadow-[0_0_30px_-12px_rgba(234,179,8,0.2)] border border-slate-200'
        } scale-${isActive ? '100' : '95'} p-8`}
        onClick={onClick}
      >
        {/* Golden glow effect */}
        <motion.div
          className="absolute -inset-2 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 opacity-0 blur-xl transition-all duration-500"
          animate={{
            opacity: isActive ? 0.15 : 0,
            scale: isActive ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 opacity-0 blur-lg transition-all duration-500"
          animate={{
            opacity: isActive ? 0.1 : 0,
            scale: isActive ? [1.1, 1, 1.1] : 1
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.5
          }}
        />

        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{customer.name}</h3>
              <p className="text-slate-600 mt-1">{customer.industry}</p>
            </div>
            <div className={`p-3 rounded-lg bg-gradient-to-r ${customer.color}`}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>

          <blockquote className="mt-6 text-lg text-slate-700 italic">{customer.quote}</blockquote>

          <div className="mt-6 flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={customer.spokesperson.image}
                alt={customer.spokesperson.name}
              />
            </div>
            <div className="ml-4">
              <div className="text-base font-medium text-slate-900">{customer.spokesperson.name}</div>
              <div className="text-sm text-slate-500">{customer.spokesperson.role}</div>
            </div>
          </div>

          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Challenge</h4>
                  <p className="mt-2 text-slate-600">{customer.case_study.challenge}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Solution</h4>
                  <p className="mt-2 text-slate-600">{customer.case_study.solution}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Results</h4>
                  <ul className="mt-2 space-y-2">
                    {customer.case_study.results.map((result, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center text-slate-600"
                      >
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${customer.color} mr-3`} />
                        {result}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                {/* Commenting out video button as it's not implemented yet
                <Button
                  className={`w-full bg-gradient-to-r ${customer.color} text-white hover:opacity-90`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Customer Story
                </Button>
                */}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Commenting out video dialog as it's not implemented yet
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{customer.name} Success Story</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-slate-200 rounded-lg">
            <div className="h-full flex items-center justify-center text-slate-400">
              Video Player Placeholder
            </div>
          </div>
        </DialogContent>
      </Dialog>
      */}
    </>
  );
};

const CustomersPage = () => {
  const [activeCustomer, setActiveCustomer] = useState<string>(customers[0].id);

  const aggregateStats = {
    avgResponseTime: '92%',
    avgConversionIncrease: '4.3x',
    avgTimeSaved: '16',
    avgRevenueGrowth: '113'
  };

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
              Customer Success{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Stories
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mt-8 mb-12">
              See how leading companies are transforming their lead management and
              achieving remarkable results with InboxFlow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
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

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Avg. Response Time Improvement"
            value={aggregateStats.avgResponseTime}
            icon={Clock}
          />
          <StatCard
            label="Avg. Conversion Rate Increase"
            value={aggregateStats.avgConversionIncrease}
            icon={TrendingUp}
          />
          <StatCard
            label="Hours Saved Weekly"
            value={aggregateStats.avgTimeSaved}
            icon={BarChart3}
          />
          <StatCard
            label="Revenue Growth"
            value={`${aggregateStats.avgRevenueGrowth}%`}
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Customer Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {customers.map((customer) => (
            <CustomerStory
              key={customer.id}
              customer={customer}
              isActive={activeCustomer === customer.id}
              onClick={() => setActiveCustomer(customer.id)}
            />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Join Our Success Stories?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Start your journey to better lead management today and see why
              companies trust InboxFlow to transform their sales process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

export default CustomersPage; 