
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import HowItWorksSection from "@/components/HowItWorksSection"; // Import the new section

const Index = () => {
  return (
    <>
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-black text-white overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Background shapes/glows for visual interest - optional */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600 rounded-full filter blur-3xl opacity-50 animate-[pulse_8s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-600 rounded-full filter blur-3xl opacity-50 animate-[pulse_10s_cubic-bezier(0.4,0,0.6,1)_infinite_alternate]"></div>
        </div>
        
        <main className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 flex-grow">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            Inbox chaos?
            <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-green-400">
              Turn every lead into cash.
            </span>
          </h1>
          <p className="max-w-xl md:max-w-2xl text-lg sm:text-xl md:text-2xl text-slate-300">
            InboxFlows qualifies, replies to, and organizes leads for you—instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="font-bold text-lg px-8 py-6 bg-blue-600 hover:bg-blue-500 text-white shadow-lg transform transition-all duration-200 hover:scale-105"
              onClick={() => console.log("Get Early Access clicked")}
            >
              Get Early Access
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="font-semibold text-lg px-8 py-6 border-slate-400 text-slate-200 hover:bg-slate-800 hover:text-white shadow-md transform transition-all duration-200 hover:scale-105"
              onClick={() => console.log("See How It Works clicked")}
            >
              See How It Works
            </Button>
          </div>
        </main>

        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 animate-bounce-slow opacity-70" />
        </div>
      </div>
      <HowItWorksSection /> {/* Added the new section here */}
    </>
  );
};

export default Index;
