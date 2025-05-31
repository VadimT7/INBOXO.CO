import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedHero from "@/components/AnimatedHero";
import FeaturesSection from "@/components/features/FeaturesSection";
import TestimonialsSection from "@/components/testimonials/TestimonialsSection";
import PricingSection from "@/components/pricing/PricingSection";
import FAQSection from "@/components/faq/FAQSection";
import CTASection from "@/components/cta/CTASection";
import LogoScroll from "@/components/LogoScroll";
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Index = () => {
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-b from-slate-900 to-black text-white overflow-hidden">
        {/* Ethereal blue gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-blue-500/10 via-blue-400/5 to-transparent pointer-events-none" />
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
                className="border-slate-400 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white backdrop-blur-sm text-xl px-12 py-8 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                onClick={() => setShowDemoVideo(true)}
              >
                <Play className="w-6 h-6 mr-2" />
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

      {/* Logo Scroll Section */}
      <LogoScroll />

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <CTASection />

      {/* Demo Video Dialog */}
      <Dialog open={showDemoVideo} onOpenChange={setShowDemoVideo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>InboxFlow Product Demo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              className="w-full h-full"
              controls
              autoPlay
              src="/demo/product-demo.mp4"
              poster="/demo/demo-thumbnail.jpg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
