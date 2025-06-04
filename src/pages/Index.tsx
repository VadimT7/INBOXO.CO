
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
        <div className="relative z-10 pt-24 pb-20 sm:pt-28 sm:pb-24 lg:pt-40 lg:pb-32">
          <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-10 text-center">
            <motion.h1
              className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-12 pt-12"
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
              className="text-2xl sm:text-3xl lg:text-4xl text-slate-300 mb-20 max-w-5xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Automatically sort, prioritize, and respond to leads. Save hours daily and never miss a hot opportunity again.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-28"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-2xl px-16 py-10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                asChild
              >
                <Link to="/login">
                  Get Started Free
                  <ArrowRight className="ml-3 h-7 w-7" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-400 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white backdrop-blur-sm text-2xl px-16 py-10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                onClick={() => setShowDemoVideo(true)}
              >
                <Play className="w-7 h-7 mr-3" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              className="mt-16 flex justify-center space-x-20 sm:space-x-28 text-slate-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">92%</div>
                <div className="text-xl sm:text-2xl">Faster Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">4.3x</div>
                <div className="text-xl sm:text-2xl">Lead Conversion</div>
              </div>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">16hrs</div>
                <div className="text-xl sm:text-2xl">Saved Weekly</div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-0 -z-10">
          <AnimatedHero />
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ChevronDown className="h-10 w-10 text-slate-400 animate-bounce" />
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
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl">InboxFlow Product Demo</DialogTitle>
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
