import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '@/hooks/useAuthSession';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { session, loading: authLoading } = useAuthSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);

  useEffect(() => {
    if (authLoading || hasCheckedSubscription) return;

    // Don't redirect if user is already on subscription, success, auth, or onboarding pages
    const exemptPaths = ['/subscription', '/success', '/login', '/onboarding'];
    if (exemptPaths.includes(location.pathname)) {
      setHasCheckedSubscription(true);
      return;
    }

    if (session) {
      // Check if this is a new user who should see the subscription page
      const isNewUser = !localStorage.getItem('userHasLoggedIn');
      const subscriptionPageSeen = localStorage.getItem('subscriptionPageSeen');
      
      if (isNewUser && !subscriptionPageSeen) {
        // New user hasn't seen subscription page, redirect them
        navigate('/subscription');
        setHasCheckedSubscription(true);
        return;
      }
      
      // Mark as existing user for future sessions
      if (isNewUser) {
        localStorage.setItem('userHasLoggedIn', 'true');
      }
    }

    setHasCheckedSubscription(true);
  }, [session, authLoading, location.pathname, navigate, hasCheckedSubscription]);

  // Show loading state while checking
  if (authLoading || !hasCheckedSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard; 