import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Clock, DollarSign, TrendingUp, 
  CheckCircle2, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AIResponseShowcase = () => {
  const [timeSaved, setTimeSaved] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  const [responseCount, setResponseCount] = useState(0);

  useEffect(() => {
    // Animate counters
    const interval = setInterval(() => {
      setTimeSaved(prev => Math.min(prev + 0.5, 10));
      setMoneySaved(prev => Math.min(prev + 25, 167));
      setResponseCount(prev => Math.min(prev + 1, 15));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      icon: Clock,
      label: 'Time Saved',
      value: `${timeSaved.toFixed(1)} min`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: DollarSign,
      label: 'Value Created',
      value: `$${moneySaved.toFixed(0)}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Zap,
      label: 'Responses Today',
      value: responseCount,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-purple-200 max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-slate-800">AI AutoPilot Active</h3>
            </div>
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>

          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <span className="text-sm text-slate-600">{metric.label}</span>
                </div>
                <span className={`font-bold ${metric.color}`}>
                  {metric.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Monthly Savings</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-bold text-green-600">$5,000+</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 