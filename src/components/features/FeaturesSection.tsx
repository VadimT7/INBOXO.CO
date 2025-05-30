import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Inbox, Zap, Clock, Bot, BarChart, Shield } from 'lucide-react';
import { useState } from 'react';

const features = [
  {
    icon: <Inbox className="w-8 h-8" />,
    title: "Smart Inbox Management",
    description: "Automatically categorize and prioritize your leads based on intelligent algorithms.",
    details: [
      "AI-powered email categorization",
      "Priority inbox organization",
      "Smart filters and tags",
      "Automated lead routing"
    ],
    gradient: "from-blue-500 to-cyan-500",
    color: "blue",
    size: "large"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Instant Lead Scoring",
    description: "Real-time classification of leads into Hot, Warm, and Cold categories.",
    details: [
      "Machine learning scoring model",
      "Behavioral analytics",
      "Engagement tracking",
      "Custom scoring rules"
    ],
    gradient: "from-purple-500 to-pink-500",
    color: "purple",
    size: "small"
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Time-Saving Automation",
    description: "Save hours daily with automated lead sorting and response management.",
    details: [
      "Automated follow-ups",
      "Smart reply suggestions",
      "Scheduled campaigns",
      "Workflow automation"
    ],
    gradient: "from-orange-500 to-red-500",
    color: "orange",
    size: "medium"
  },
  {
    icon: <Bot className="w-8 h-8" />,
    title: "AI-Powered Responses",
    description: "Generate contextual responses to leads using advanced AI technology.",
    details: [
      "Natural language processing",
      "Context-aware replies",
      "Sentiment analysis",
      "Multi-language support"
    ],
    gradient: "from-green-500 to-emerald-500",
    color: "green",
    size: "large"
  },
  {
    icon: <BarChart className="w-8 h-8" />,
    title: "Analytics Dashboard",
    description: "Track lead conversion rates and response times with detailed analytics.",
    details: [
      "Real-time metrics",
      "Custom reports",
      "Team performance",
      "Conversion tracking"
    ],
    gradient: "from-yellow-500 to-orange-500",
    color: "yellow",
    size: "medium"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Secure & Private",
    description: "Enterprise-grade security with end-to-end encryption for your data.",
    details: [
      "End-to-end encryption",
      "GDPR compliance",
      "Role-based access",
      "Audit logs"
    ],
    gradient: "from-teal-500 to-cyan-500",
    color: "teal",
    size: "small"
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const z = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    const rotateXValue = (relativeY - 0.5) * -20;
    const rotateYValue = (relativeX - 0.5) * 20;
    
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
    z.set(20);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    z.set(0);
    setIsHovered(false);
  };

  const scale = useTransform(z, [0, 20], [1, 1.05]);
  const shadowBlur = useTransform(z, [0, 20], [5, 15]);
  const shadowOpacity = useTransform(z, [0, 20], [0.1, 0.3]);

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
        className={`relative overflow-hidden h-full ${
          feature.size === 'large' 
            ? 'bg-gradient-to-br' 
            : 'bg-white'
        } ${feature.gradient} ${
          feature.size === 'large' ? 'text-white' : ''
        } rounded-3xl`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          scale,
          z,
          boxShadow: useTransform(
            [shadowBlur, shadowOpacity],
            ([blur, opacity]) => `0px ${blur}px ${blur * 2}px rgba(0, 0, 0, ${opacity})`
          )
        }}
      >
        {feature.size !== 'large' && (
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        )}
        <div className="relative p-8 h-full flex flex-col">
          <div className={`w-16 h-16 rounded-2xl ${
            feature.size === 'large' 
              ? 'bg-white/10 text-white' 
              : `bg-gradient-to-br ${feature.gradient}`
          } flex items-center justify-center mb-6 transform transition-transform duration-300 hover:scale-110`}>
            {feature.icon}
          </div>
          <h3 className={`text-2xl font-bold mb-4 ${
            feature.size === 'large' 
              ? 'text-white' 
              : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
          }`}>
            {feature.title}
          </h3>
          <p className={`mb-6 ${
            feature.size === 'large' 
              ? 'text-white/90' 
              : 'text-slate-600'
          }`}>
            {feature.description}
          </p>
          
          <motion.ul 
            className="space-y-3 mt-auto"
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
            variants={{
              visible: {
                opacity: 1,
                height: 'auto',
                transition: {
                  staggerChildren: 0.1
                }
              },
              hidden: {
                opacity: 0,
                height: 0
              }
            }}
          >
            {feature.details.map((detail, i) => (
              <motion.li
                key={i}
                className={`flex items-center ${
                  feature.size === 'large' 
                    ? 'text-white/90' 
                    : 'text-slate-700'
                }`}
                variants={{
                  visible: { opacity: 1, x: 0 },
                  hidden: { opacity: 0, x: -20 }
                }}
              >
                <div className={`w-2 h-2 rounded-full ${
                  feature.size === 'large' 
                    ? 'bg-white/30' 
                    : `bg-gradient-to-r ${feature.gradient}`
                } mr-3`} />
                {detail}
              </motion.li>
            ))}
          </motion.ul>

          {/* Floating Decorative Elements */}
          {feature.size === 'large' && (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50">
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
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-8 auto-rows-fr">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 