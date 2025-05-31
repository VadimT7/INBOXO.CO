import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Inbox } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const { session, user, signOut, loading } = useAuthSession();
  const isVisible = useScrollDirection();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          {/* Background with blur effect */}
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md"></div>

          {/* Header content */}
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="relative flex items-center justify-between">
              {/* Left side - Logo */}
              <Link to="/" className="text-white text-xl font-semibold flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">IF</span>
                </div>
                <span>InboxFlow</span>
              </Link>

              {/* Center - Navigation */}
              <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <ul className="flex items-center space-x-2 sm:space-x-8">
                  <li>
                    <Button
                      asChild
                      variant="ghost"
                      size="lg"
                      className="text-white text-lg font-medium hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Link to="/features">Features</Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      asChild
                      variant="ghost"
                      size="lg"
                      className="text-white text-lg font-medium hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Link to="/customers">Customers</Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      asChild
                      variant="ghost"
                      size="lg"
                      className="text-white text-lg font-medium hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Link to="/pricing">Pricing</Link>
                    </Button>
                  </li>
                </ul>
              </nav>

              {/* Right side - Auth */}
              <div className="flex items-center space-x-4">
                {!loading && (
                  <>
                    {session ? (
                      <>
                        <Button
                          asChild
                          variant="ghost"
                          className="text-white hover:bg-white/10"
                        >
                          <Link to="/leads">
                            <Inbox className="w-5 h-5 mr-2" />
                            Leads
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-white hover:bg-white/10"
                          onClick={() => signOut()}
                        >
                          <LogOut className="w-5 h-5 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button
                        asChild
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                      >
                        <Link to="/login">
                          <LogIn className="w-5 h-5 mr-2" />
                          Sign In
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Header; 