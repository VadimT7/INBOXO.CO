import { Button } from "@/components/ui/button";
import { ChevronDown, LogIn, LogOut, Inbox, ArrowRight } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedHero from "@/components/AnimatedHero";
import FeaturesSection from "@/components/features/FeaturesSection";
import TestimonialsSection from "@/components/testimonials/TestimonialsSection";
import PricingSection from "@/components/pricing/PricingSection";
import FAQSection from "@/components/faq/FAQSection";
import CTASection from "@/components/cta/CTASection";

const Index = () => {
  const { session, user, signOut, loading } = useAuthSession();

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-b from-slate-900 to-black text-white overflow-hidden">
        {/* Header for Login/Logout */}
        <header className="absolute top-0 right-0 p-4 sm:p-6 z-50">
          {loading ? (
            <p className="text-sm text-slate-300">Loading user...</p>
          ) : session ? (
            <div className="flex items-center space-x-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-400 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white backdrop-blur-sm"
              >
                <Link to="/leads">
                  <Inbox className="mr-2 h-4 w-4" /> Leads
                </Link>
              </Button>
              <span className="text-sm text-slate-300 hidden sm:inline">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="border-slate-400 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white backdrop-blur-sm"
              >
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-400 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white backdrop-blur-sm"
              >
                <Link to="/pricing">Pricing</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-400 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white backdrop-blur-sm"
              >
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            </div>
          )}
        </header>

        <div className="relative z-10 pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-10 pt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Transform Your Inbox into a{" "}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Lead-Converting Machine
              </span>
            </motion.h1>
            
            <motion.p
              className="text-2xl sm:text-3xl text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Automatically sort, prioritize, and respond to leads. Save hours daily and never miss a hot opportunity again.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xl px-12 py-8 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                asChild
              >
                <Link to="/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-3 border-slate-400 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white backdrop-blur-sm text-xl px-12 py-8 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              className="mt-12 flex justify-center space-x-16 sm:space-x-24 text-slate-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">50%</div>
                <div className="text-lg sm:text-xl">Faster Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">2x</div>
                <div className="text-lg sm:text-xl">Lead Conversion</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">8hrs</div>
                <div className="text-lg sm:text-xl">Saved Weekly</div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-0 -z-10">
          <AnimatedHero />
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ChevronDown className="h-8 w-8 text-slate-400 animate-bounce" />
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};

export default Index;
