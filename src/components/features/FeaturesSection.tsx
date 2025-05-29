import { motion } from 'framer-motion';
import { Inbox, Zap, Clock, Bot, BarChart, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: <Inbox className="w-6 h-6" />,
    title: "Smart Inbox Management",
    description: "Automatically categorize and prioritize your leads based on intelligent algorithms.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Lead Scoring",
    description: "Real-time classification of leads into Hot, Warm, and Cold categories.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Time-Saving Automation",
    description: "Save hours daily with automated lead sorting and response management.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI-Powered Responses",
    description: "Generate contextual responses to leads using advanced AI technology.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: <BarChart className="w-6 h-6" />,
    title: "Analytics Dashboard",
    description: "Track lead conversion rates and response times with detailed analytics.",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure & Private",
    description: "Enterprise-grade security with end-to-end encryption for your data.",
    gradient: "from-teal-500 to-cyan-500"
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className={`absolute inset-0 opacity-0 bg-gradient-to-r ${feature.gradient} group-hover:opacity-5 transition-opacity duration-300`} />
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-4`}>
            {feature.icon}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-800">{feature.title}</h3>
          <p className="text-slate-600">{feature.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-4xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Powerful Features for Modern Teams
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Everything you need to streamline your lead management process and boost conversion rates.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 