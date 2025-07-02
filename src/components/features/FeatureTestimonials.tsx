import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ArrowLeft, ArrowRight, Building2, Users } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'VP of Sales',
    company: 'TechCorp',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    quote: 'InboxFlow transformed our lead management. We went from 23% to 87% lead qualification accuracy in just 3 months. The AI scoring is incredibly accurate.',
    rating: 5,
    stats: { before: '23%', after: '87%', metric: 'Lead Qualification' },
    logo: '🏢',
    industry: 'Technology',
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    role: 'CEO',
    company: 'Growth Dynamics',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    quote: 'The ROI was immediate. We close 5x more deals now, and our response time went from hours to literally seconds - crazy! Best discovery and investment we made this year by far.',
    rating: 5,
    stats: { before: '4.2 hrs', after: '7 min', metric: 'Response Time' },
    logo: '📈',
    industry: 'Marketing',
  },
  {
    id: 3,
    name: 'Emily Watson',
    role: 'Head of Marketing',
    company: 'Scale.io',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    quote: 'The automation features saved our team 40+ hours per week. We can now focus on building relationships with our clients instead of taking hours to write our emails manually.',
    rating: 5,
    stats: { before: '50 hrs/week', after: '10 hrs/week', metric: 'Manual Work' },
    logo: '🚀',
    industry: 'SaaS',
  },
  {
    id: 4,
    name: 'David Park',
    role: 'Sales Director',
    company: 'Enterprise Solutions',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    quote: 'Our conversion rate increased by 312%. The automated responses allow us to focus and convert the right leads faster than ever before.',
    rating: 5,
    stats: { before: '2.1%', after: '8.7%', metric: 'Conversion Rate' },
    logo: '💼',
    industry: 'Enterprise',
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    role: 'COO',
    company: 'FastTrack Inc',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
    quote: 'InboxFlow paid for itself in half a day - it\'s this good! The AI-generated responses are so natural and absolutely undistinguishable from human responses.',
    rating: 5,
    stats: { before: '$1.2M', after: '$4.7M', metric: 'Quarterly Revenue' },
    logo: '⚡',
    industry: 'Consulting',
  },
];

export const FeatureTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (isAutoPlaying) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [isAutoPlaying]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTestimonial.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 lg:p-12 shadow-2xl"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Testimonial Content */}
            <div className="flex flex-col justify-between">
              <div>
                <Quote className="w-12 h-12 text-purple-500/20 mb-6" />
                
                <p className="text-xl lg:text-2xl text-white leading-relaxed mb-8">
                  "{currentTestimonial.quote}"
                </p>
                
                {/* Rating */}
                <div className="flex mb-6">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              {/* Author Info */}
              <div className="flex items-center">
                <img
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <div className="font-semibold text-white text-lg">{currentTestimonial.name}</div>
                  <div className="text-slate-400">{currentTestimonial.role}</div>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl mr-2">{currentTestimonial.logo}</span>
                    <span className="text-slate-500 text-sm">{currentTestimonial.company}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 backdrop-blur-sm border border-slate-700 w-full"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-1">
                    {currentTestimonial.stats.metric}
                  </h4>
                  <p className="text-sm text-slate-400">{currentTestimonial.industry} Industry</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <div className="text-sm text-red-400 mb-1">Before</div>
                    <div className="text-2xl font-bold text-red-400">{currentTestimonial.stats.before}</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="text-sm text-emerald-400 mb-1">After</div>
                    <div className="text-2xl font-bold text-emerald-400">{currentTestimonial.stats.after}</div>
                  </div>
                </div>
                
                <motion.div
                  className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl text-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                    {((parseFloat(currentTestimonial.stats.after) / parseFloat(currentTestimonial.stats.before) * 100) || 300).toFixed(0)}% 
                  </div>
                  <div className="text-sm text-slate-400">Improvement</div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevious}
            className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
      
      {/* Trust Signal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center justify-center"
      >
        <div className="flex items-center space-x-6 text-slate-500 text-sm">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>10,000+ Happy Customers</span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
            <span>4.9/5 Average Rating</span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center">
            <span>95% Customer Retention</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 