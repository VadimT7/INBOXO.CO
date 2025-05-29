import { Button } from "@/components/ui/button";
import { ChevronDown, LogIn, LogOut, Inbox } from "lucide-react";
import HowItWorksSection from "@/components/HowItWorksSection";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Link } from "react-router-dom";
import AnimatedHero from "@/components/AnimatedHero";

const Index = () => {
  const { session, user, signOut, loading } = useAuthSession();

  return (
    <>
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
                className="border-slate-400 text-slate-200 hover:bg-slate-800 hover:text-white"
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
                className="border-slate-400 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-400 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </header>

        <AnimatedHero />
      </div>
      <HowItWorksSection />
    </>
  );
};

export default Index;
