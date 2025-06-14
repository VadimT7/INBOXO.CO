import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubscriptionOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
}

const SubscriptionOverlay = ({ 
  isVisible, 
  title = "Subscription Required",
  message = "Access to this feature requires an active subscription. Choose a plan to unlock all features and start growing your business." 
}: SubscriptionOverlayProps) => {
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <>
      {/* Background overlay that covers full screen but stays below header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 z-40 backdrop-blur-sm"
      />
      
      {/* Modal dialog */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border pointer-events-auto"
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{title}</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">{message}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/subscription')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
              >
                <Crown className="h-5 w-5 mr-2" />
                Choose a Plan
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => navigate('/billing')}
                className="w-full text-slate-600 hover:text-slate-800"
              >
                View Billing Details
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SubscriptionOverlay; 