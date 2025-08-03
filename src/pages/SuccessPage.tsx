import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/leads');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5, delay: 0.2 }}
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
        </motion.div>

        <motion.h1
          className="text-2xl font-bold text-slate-900 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Payment Successful!
        </motion.h1>

        <motion.p
          className="text-slate-600 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Thank you for subscribing to Inboxo. Your account has been activated and you can start using all features immediately.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/leads')}
          >
            Go to Dashboard
          </Button>
          <p className="text-sm text-slate-500">
            Redirecting in {countdown} seconds...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SuccessPage; 