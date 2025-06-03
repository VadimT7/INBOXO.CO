import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Inbox, BarChart2, Settings, DollarSign } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

const Header = () => {
  const { session, user, signOut, loading } = useAuthSession();
  const isVisible = useScrollDirection();
  const location = useLocation();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  // Check if we're on a dashboard page (leads, analytics, settings, revenue)
  const isDashboardPage = session && ['/leads', '/analytics', '/settings', '/revenue'].includes(location.pathname);

  const handleSignOut = async () => {
    setShowSignOutDialog(false);
    await signOut();
  };

  return (
    <>
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
            <div className={cn(
              "absolute inset-0 backdrop-blur-md",
              isDashboardPage 
                ? "bg-gradient-to-r from-blue-600 to-blue-700" 
                : "bg-slate-900/75"
            )}></div>

            {/* Header content */}
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="relative flex items-center justify-between">
                {/* Left side - Logo */}
                <Link to={session ? "/leads" : "/"} className="text-white text-xl font-semibold flex items-center space-x-2 hover:opacity-80 transition-opacity">
                  <div className={cn(
                    "w-8 h-8 rounded flex items-center justify-center",
                    isDashboardPage ? "bg-white/20" : "bg-blue-500"
                  )}>
                    <span className="text-white font-bold text-xl">IF</span>
                  </div>
                  <span>InboxFlow</span>
                </Link>

                {/* Center - Navigation */}
                <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <ul className="flex items-center space-x-2 sm:space-x-8">
                    {session ? (
                      <>
                        <li>
                          <Button
                            asChild
                            variant="ghost"
                            size="lg"
                            className={cn(
                              "text-white text-lg font-medium transition-colors",
                              isDashboardPage 
                                ? "hover:bg-white/10 data-[state=open]:bg-white/10" 
                                : "hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <Link to="/leads">
                              <Inbox className="w-5 h-5 mr-2" />
                              Leads
                            </Link>
                          </Button>
                        </li>
                        <li>
                          <Button
                            asChild
                            variant="ghost"
                            size="lg"
                            className={cn(
                              "text-white text-lg font-medium transition-colors",
                              isDashboardPage 
                                ? "hover:bg-white/10 data-[state=open]:bg-white/10" 
                                : "hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <Link to="/analytics">
                              <BarChart2 className="w-5 h-5 mr-2" />
                              Analytics
                            </Link>
                          </Button>
                        </li>
                        {/* Revenue section temporarily removed
                        <li>
                          <Button
                            asChild
                            variant="ghost"
                            size="lg"
                            className={cn(
                              "text-white text-lg font-medium transition-colors",
                              isDashboardPage 
                                ? "hover:bg-white/10 data-[state=open]:bg-white/10" 
                                : "hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <Link to="/revenue">
                              <DollarSign className="w-5 h-5 mr-2" />
                              Revenue
                            </Link>
                          </Button>
                        </li>
                        */}
                        <li>
                          <Button
                            asChild
                            variant="ghost"
                            size="lg"
                            className={cn(
                              "text-white text-lg font-medium transition-colors",
                              isDashboardPage 
                                ? "hover:bg-white/10 data-[state=open]:bg-white/10" 
                                : "hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <Link to="/settings">
                              <Settings className="w-5 h-5 mr-2" />
                              Settings
                            </Link>
                          </Button>
                        </li>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </ul>
                </nav>

                {/* Right side - Auth */}
                <div className="flex items-center space-x-4">
                  {session ? (
                    <Button
                      variant="ghost"
                      className={cn(
                        "text-white transition-colors",
                        isDashboardPage 
                          ? "hover:bg-white/10" 
                          : "hover:bg-white/10"
                      )}
                      onClick={() => setShowSignOutDialog(true)}
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      Sign Out
                    </Button>
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
                </div>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">Sign Out Confirmation</DialogTitle>
            <DialogDescription className="text-lg text-slate-300 mt-2">
              Are you sure you want to sign out? You'll need to sign in again to access your leads and analytics.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              onClick={() => setShowSignOutDialog(false)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSignOut}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 rounded-lg"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header; 