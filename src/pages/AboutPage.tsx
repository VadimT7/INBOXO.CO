import { Mail, Users, Inbox, Target, Sparkles, Rocket, Globe, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const AboutPage = () => {
  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      image: "https://api.dicebear.com/7.x/personas/svg?seed=alex&backgroundColor=b6e3f4",
    },
    {
      name: "Sarah Miller",
      role: "Head of Product",
      image: "https://api.dicebear.com/7.x/personas/svg?seed=sarah&backgroundColor=ffdfbf",
    },
    {
      name: "James Wilson",
      role: "Lead Engineer",
      image: "https://api.dicebear.com/7.x/personas/svg?seed=james&backgroundColor=c0aede",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-32 pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            Transforming Email Management
          </h1>
          <p className="text-xl text-slate-300 mb-12">
            We're on a mission to help businesses turn their inbox chaos into organized opportunities.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="relative py-24 px-4 overflow-hidden -mt-20">
        {/* Dynamic flowing background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 opacity-5" />
        
        {/* Animated flow patterns */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary flow wave */}
          <div className="absolute w-full h-full">
            <svg className="absolute w-[200%] h-full animate-wave" viewBox="0 0 1000 1000" preserveAspectRatio="none">
              <path
                className="fill-blue-500/10"
                d="M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500 L1000,1000 L0,1000 Z"
              >
                <animate
                  attributeName="d"
                  dur="20s"
                  repeatCount="indefinite"
                  values="
                    M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500 L1000,1000 L0,1000 Z;
                    M0,500 C200,600 300,400 500,500 C700,600 800,400 1000,500 L1000,1000 L0,1000 Z;
                    M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500 L1000,1000 L0,1000 Z"
                />
              </path>
            </svg>
          </div>

          {/* Secondary flow wave */}
          <div className="absolute w-full h-full">
            <svg className="absolute w-[200%] h-full animate-wave-reverse" viewBox="0 0 1000 1000" preserveAspectRatio="none">
              <path
                className="fill-purple-500/10"
                d="M0,500 C200,600 300,400 500,500 C700,600 800,400 1000,500 L1000,1000 L0,1000 Z"
              >
                <animate
                  attributeName="d"
                  dur="15s"
                  repeatCount="indefinite"
                  values="
                    M0,500 C200,600 300,400 500,500 C700,600 800,400 1000,500 L1000,1000 L0,1000 Z;
                    M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500 L1000,1000 L0,1000 Z;
                    M0,500 C200,600 300,400 500,500 C700,600 800,400 1000,500 L1000,1000 L0,1000 Z"
                />
              </path>
            </svg>
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
            <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-delay" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow" />
          </div>

          {/* Gradient mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center justify-center p-2 rounded-full bg-blue-100 text-blue-600 mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Our Story
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20"
          >
            {[
              { value: "1,000+", label: "Active Users", icon: Users },
              { value: "1M+", label: "Emails Processed", icon: Mail },
              { value: "50,000+", label: "Leads Generated", icon: Target },
              { value: "10,000+ hrs", label: "Time Saved", icon: Clock }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative bg-white rounded-2xl shadow-lg p-8 transform group-hover:scale-[1.02] transition-all duration-300">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </h3>
                    <p className="text-slate-600 font-medium">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Story Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="bg-white rounded-2xl shadow-xl p-8 relative z-10 h-full transform group-hover:scale-[1.02] transition-transform duration-300">
                <Rocket className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-4">The Beginning</h3>
                <p className="text-slate-600">
                  Inboxo was born from a simple observation: businesses spend too much time managing emails and miss valuable opportunities in the process. Our founder, having experienced this firsthand while running a digital agency, decided to create a solution that would transform how businesses handle their email communications.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="bg-white rounded-2xl shadow-xl p-8 relative z-10 h-full transform group-hover:scale-[1.02] transition-transform duration-300">
                <Mail className="w-10 h-10 text-indigo-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-4">The Evolution</h3>
                <p className="text-slate-600">
                  What started as a simple tool for organizing leads has evolved into a comprehensive platform that helps businesses not just manage their emails, but turn them into meaningful relationships and opportunities.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="bg-white rounded-2xl shadow-xl p-8 relative z-10 h-full transform group-hover:scale-[1.02] transition-transform duration-300">
                <Globe className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-4">Today & Beyond</h3>
                <p className="text-slate-600">
                  Today, Inboxo serves thousands of businesses worldwide, helping them save time and capture more opportunities from their inbox. We're just getting started, and we're excited to continue innovating and helping businesses grow.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <Button
              size="lg"
              className="relative group overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white text-xl px-12 py-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]"
              asChild
            >
              <Link to="/login" className="flex items-center">
                <span className="z-10">Start For Free</span>
                <ArrowRight className="ml-3 h-7 w-7 z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-slate-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-slate-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 