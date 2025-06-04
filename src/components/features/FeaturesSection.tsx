
import { motion, useMotionValue } from 'framer-motion';
import { Inbox, Zap, Clock, Bot, BarChart, Shield, BrainCircuit } from 'lucide-react';

const features = [
  {
    icon: <Inbox className="w-9 h-9" />,
    title: "Smart Inbox Management",
    description: "Automatically categorize and prioritize your leads based on intelligent algorithms.",
    gradient: "from-blue-500 to-cyan-500",
    color: "blue",
    size: "large"
  },
  {
    icon: <Zap className="w-9 h-9" />,
    title: "Instant Lead Scoring",
    description: "Real-time classification of leads into Hot, Warm, and Cold categories.",
    gradient: "from-purple-500 to-pink-500",
    color: "purple",
    size: "small"
  },
  {
    icon: <Clock className="w-9 h-9" />,
    title: "Time-Saving Automation",
    description: "Save hours daily with automated lead sorting and response management.",
    gradient: "from-orange-500 to-red-500",
    color: "orange",
    size: "medium"
  },
  {
    icon: <Bot className="w-9 h-9" />,
    title: "AI-Powered Responses",
    description: "Generate contextual responses to leads using advanced AI technology.",
    gradient: "from-green-500 to-emerald-500",
    color: "green",
    size: "large"
  },
  {
    icon: <BarChart className="w-9 h-9" />,
    title: "Analytics Dashboard",
    description: "Track lead conversion rates and response times with detailed analytics.",
    gradient: "from-yellow-500 to-orange-500",
    color: "yellow",
    size: "medium"
  },
  {
    icon: <Shield className="w-9 h-9" />,
    title: "Secure & Private",
    description: "Enterprise-grade security with end-to-end encryption for your data.",
    gradient: "from-teal-500 to-cyan-500",
    color: "teal",
    size: "small"
  },
  {
    icon: <BrainCircuit className="w-9 h-9" />,
    title: "Smart Follow-up Intelligence",
    description: "AI-driven timing suggestions and personalized follow-up sequences for optimal engagement.",
    gradient: "from-rose-500 to-pink-500",
    color: "rose",
    size: "medium"
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    rotateX.set((relativeY - 0.5) * -10);
    rotateY.set((relativeX - 0.5) * 10);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const sizeClasses = {
    small: "col-span-1",
    medium: "col-span-1 md:col-span-2 lg:col-span-1",
    large: "col-span-1 md:col-span-2"
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[feature.size]}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      style={{
        perspective: 1000
      }}
    >
      <motion.div
        className={`relative overflow-hidden h-full p-10 ${
          feature.size === 'large' 
            ? 'bg-gradient-to-br' 
            : 'bg-white'
        } ${feature.gradient} ${
          feature.size === 'large' ? 'text-white' : ''
        } rounded-3xl transform-gpu`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          boxShadow: `0px 10px 20px rgba(0, 0, 0, 0.2)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {feature.size !== 'large' && (
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        )}
        
        <div className={`w-18 h-18 rounded-2xl ${
          feature.size === 'large' 
            ? 'bg-white/10 text-white' 
            : `bg-gradient-to-br ${feature.gradient}`
        } flex items-center justify-center mb-8 transform-gpu transition-transform duration-300 hover:scale-110`}>
          {feature.icon}
        </div>
        <h3 className={`text-2xl lg:text-3xl font-bold mb-5 ${
          feature.size === 'large' 
            ? 'text-white' 
            : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
        }`}>
          {feature.title}
        </h3>
        <p className={`text-lg ${
          feature.size === 'large' 
            ? 'text-white/90' 
            : 'text-slate-600'
        }`}>
          {feature.description}
        </p>

        {/* Floating Decorative Elements */}
        {feature.size === 'large' && (
          <>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.h2 
            className="text-5xl font-bold text-slate-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Powerful Features for Modern Teams
          </motion.h2>
          <motion.p 
            className="text-xl text-slate-600 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Everything you need to streamline your lead management process and boost conversion rates.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-10 auto-rows-fr">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
