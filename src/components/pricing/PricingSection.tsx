import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createCheckoutSession } from '@/lib/stripe';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useNavigate } from 'react-router-dom';
import { EnterpriseContactDialog } from './EnterpriseContactDialog';

const plans = [
  {
    name: "Starter",
    price: "49",
    priceId: "price_1RUAFAR4VctRXueqTXYvL5w8",
    description: "Perfect for small teams and startups",
    features: [
      "Up to 1,000 leads per month",
      "Basic lead scoring",
      "Email templates",
      "Standard support",
      "1 team member"
    ],
    highlighted: false,
    cta: "Start Free Trial"
  },
  {
    name: "Professional",
    price: "99",
    priceId: "price_1RUAFPR4VctRXueqhOyOSFnq",
    description: "For growing businesses",
    features: [
      "Up to 10,000 leads per month",
      "Advanced lead scoring",
      "Custom email templates",
      "Priority support",
      "Up to 5 team members",
      "Analytics dashboard",
      "API access"
    ],
    highlighted: true,
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise",
    price: "299",
    priceId: "price_1RUAHbR4VctRXueqklf7r7hi",
    description: "For large organizations",
    features: [
      "Unlimited leads",
      "AI-powered lead scoring",
      "Advanced automation",
      "24/7 premium support",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager"
    ],
    highlighted: false,
    cta: "Contact Sales"
  }
];

const PricingCard = ({ 
  plan, 
  index, 
  onSelectPlan,
  isLoading
}: { 
  plan: typeof plans[0], 
  index: number,
  onSelectPlan: (plan: typeof plans[0]) => void,
  isLoading: boolean
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`relative ${plan.highlighted ? 'z-10' : 'z-0'}`}
    >
      {plan.highlighted ? (
        <>
          {/* Outer glow effect */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 animate-pulse" />
          {/* Inner gradient border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 rounded-xl" />
        </>
      ) : (
        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
      <Card 
        className={`relative p-8 h-full transition-all duration-300 ${
          plan.highlighted 
            ? 'border-transparent bg-gradient-to-b from-white to-amber-50 shadow-xl hover:shadow-2xl hover:scale-105 transform'
            : 'hover:border-blue-600'
        }`}
      >
        {plan.highlighted ? (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <motion.span 
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg"
              animate={{
                boxShadow: [
                  "0 0 10px rgba(251, 191, 36, 0.5)",
                  "0 0 20px rgba(251, 191, 36, 0.3)",
                  "0 0 10px rgba(251, 191, 36, 0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              Most Popular
            </motion.span>
          </div>
        ) : null}
        <div className="text-center mb-8">
          <h3 className={`text-2xl font-bold mb-2 ${
            plan.highlighted 
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent'
          }`}>{plan.name}</h3>
          <p className="text-slate-600 mb-4">{plan.description}</p>
          <div className="flex items-baseline justify-center">
            <span className={`text-4xl font-bold ${
              plan.highlighted 
                ? 'bg-gradient-to-br from-amber-700 to-yellow-600 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent'
            }`}>${plan.price}</span>
            <span className="text-slate-600 ml-2">/month</span>
          </div>
        </div>
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, i) => (
            <motion.li 
              key={i} 
              className="flex items-start"
              initial={plan.highlighted ? { opacity: 0, x: -10 } : {}}
              animate={plan.highlighted ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <Check className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
                plan.highlighted ? 'text-amber-500' : 'text-blue-600'
              }`} />
              <span className="text-slate-700">{feature}</span>
            </motion.li>
          ))}
        </ul>
        <div className="text-center">
          <Button
            size="lg"
            className={`w-full transition-all duration-300 ${
              plan.highlighted
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-lg hover:shadow-xl hover:scale-105 transform'
                : 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 shadow-md hover:shadow-lg'
            }`}
            onClick={() => onSelectPlan(plan)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              plan.cta
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

const PricingSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showEnterpriseDialog, setShowEnterpriseDialog] = useState(false);
  const { toast } = useToast();
  const { session } = useAuthSession();
  const navigate = useNavigate();

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (plan.name === "Enterprise") {
      setShowEnterpriseDialog(true);
      return;
    }

    if (!session) {
      toast({
        title: "Login Required",
        description: "Please log in to start your free trial.",
      });
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      await createCheckoutSession(plan.priceId);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterpriseSuccess = () => {
    toast({
      title: "Thank you for your interest!",
      description: "Our sales team will contact you within 24 hours.",
    });
  };

  return (
    <>
      <section className="py-20 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.span
              className="text-blue-600 font-semibold text-sm uppercase tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Pricing
            </motion.span>
            <motion.h2
              className="mt-2 text-4xl font-bold text-slate-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-slate-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Choose the perfect plan for your team's needs
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <PricingCard 
                key={plan.name} 
                plan={plan} 
                index={index} 
                onSelectPlan={handleSelectPlan}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      </section>

      <EnterpriseContactDialog
        open={showEnterpriseDialog}
        onOpenChange={setShowEnterpriseDialog}
        onSuccess={handleEnterpriseSuccess}
      />
    </>
  );
};

export default PricingSection; 