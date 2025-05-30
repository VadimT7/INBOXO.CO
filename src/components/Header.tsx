import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Inbox } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { motion } from "framer-motion";

const Header = () => {
  const { session, user, signOut, loading } = useAuthSession();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6"
    >
      <div className="relative flex items-center justify-between">
        {/* Left side - Logo */}
        <Link to="/" className="text-white text-xl font-semibold">
          InboxFlow
        </Link>

        {/* Center - Navigation */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ul className="flex items-center space-x-2 sm:space-x-8">
            <li>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-white text-lg font-medium hover:bg-white/5 hover:text-white"
              >
                <Link to="/features">Features</Link>
              </Button>
            </li>
            <li>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-white text-lg font-medium hover:bg-white/5 hover:text-white"
              >
                <Link to="/customers">Customers</Link>
              </Button>
            </li>
            <li>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-white text-lg font-medium hover:bg-white/5 hover:text-white"
              >
                <Link to="/pricing">Pricing</Link>
              </Button>
            </li>
          </ul>
        </nav>

        {/* Right side - Auth */}
        <div className="flex items-center space-x-2">
          {loading ? (
            <p className="text-sm text-white/70">Loading...</p>
          ) : session ? (
            <div className="flex items-center space-x-3">
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-white text-lg font-medium hover:bg-white/5 hover:text-white"
              >
                <Link to="/leads">
                  <Inbox className="mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">Leads</span>
                </Link>
              </Button>
              <span className="text-base text-white/70 hidden lg:inline">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="lg"
                onClick={signOut}
                className="text-white text-lg font-medium hover:bg-white/5 hover:text-white"
              >
                <LogOut className="mr-0 sm:mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-white text-lg font-medium hover:bg-white/5 hover:text-white"
            >
              <Link to="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header; 