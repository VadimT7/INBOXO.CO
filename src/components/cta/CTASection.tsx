import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />
      
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to Transform Your Lead Management?
          </motion.h2>
          
          <motion.p
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Join thousands of sales teams who've already streamlined their workflow with Inboxo.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="relative group overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white text-xl px-12 py-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]"
            >
              <span className="z-10">Start Free Trial</span>
              <ArrowRight className="ml-3 h-7 w-7 z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </Button>
            {/* Commented out Schedule Demo button
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white text-lg px-8 backdrop-blur-sm"
            >
              Schedule Demo
            </Button>
            */}
          </motion.div>

          <motion.p
            className="mt-6 text-sm text-blue-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            No credit card required · 14-day free trial · Cancel anytime
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 