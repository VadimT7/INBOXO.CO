import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createCheckoutSession } from '@/lib/stripe';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

const plans = [
  {
    name: "Starter",
    price: "49",
    priceId: "prod_SOyB4bsEGx80b2",
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
    priceId: "prod_SOyBreKNsjPxf1",
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
    priceId: "prod_SOyEW0RCVxXjb4",
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
  onSelectPlan 
}: { 
  plan: typeof plans[0], 
  index: number,
  onSelectPlan: (plan: typeof plans[0]) => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className={`relative p-8 h-full ${plan.highlighted ? 'border-blue-500 border-2' : ''}`}>
        {plan.highlighted && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>
        )}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
          <p className="text-slate-600 mb-4">{plan.description}</p>
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
            <span className="text-slate-600 ml-2">/month</span>
          </div>
        </div>
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <Button
            size="lg"
            className={`w-full ${
              plan.highlighted
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-slate-800 hover:bg-slate-900'
            }`}
            onClick={() => onSelectPlan(plan)}
          >
            {plan.cta}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

const PricingSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (plan.name === "Enterprise") {
      // Handle enterprise plan differently (e.g., open contact form)
      toast({
        title: "Enterprise Plan Selected",
        description: "Our sales team will contact you shortly.",
      });
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

  return (
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
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 