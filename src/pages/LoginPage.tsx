import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Mail } from 'lucide-react'; // Using Mail as a generic icon for Google

const LoginPage = () => {
  const { session, signInWithGoogle, loading } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      // If user is already logged in, redirect to leads page
      navigate('/leads');
    }
  }, [session, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // If session exists after loading and useEffect hasn't redirected, it means user just logged in
  // but the redirect effect might not have run yet. This state is brief.
  if (session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p>Redirecting to leads...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-black text-white p-4">
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 bg-slate-800 p-8 sm:p-12 rounded-xl shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Welcome Back</h1>
        <p className="text-slate-300 max-w-md">
          Connect your Gmail to automatically organize your leads and send smart replies.
        </p>
        <Button
          onClick={signInWithGoogle}
          size="lg"
          className="font-semibold text-lg px-8 py-6 bg-blue-600 hover:bg-blue-500 text-white shadow-lg transform transition-all duration-200 hover:scale-105 w-full sm:w-auto"
        >
          <Mail className="mr-2 h-5 w-5" /> Login with Google
        </Button>
        <p className="text-xs text-slate-400 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
      {/* Optional: Background shapes/glows for visual interest */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600 rounded-full filter blur-3xl opacity-50 animate-[pulse_8s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-600 rounded-full filter blur-3xl opacity-50 animate-[pulse_10s_cubic-bezier(0.4,0,0.6,1)_infinite_alternate]"></div>
      </div>
    </div>
  );
};

export default LoginPage;
