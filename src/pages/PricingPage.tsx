import { motion } from 'framer-motion';
import PricingSection from '@/components/pricing/PricingSection';
import FAQSection from '@/components/faq/FAQSection';
import CTASection from '@/components/cta/CTASection';

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-600 text-white py-32">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            className="text-xl text-slate-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Choose the perfect plan for your team. All plans include a 14-day free trial.
          </motion.p>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};

export default PricingPage; 