import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calculator, ArrowRight, Target } from 'lucide-react';

export const ROICalculator = () => {
  const [leads, setLeads] = useState(1000);
  const [conversionRate, setConversionRate] = useState(2);
  const [dealSize, setDealSize] = useState(5000);
  
  const currentRevenue = leads * (conversionRate / 100) * dealSize;
  
  // Dynamic improvement factor based on current conversion rate
  // Lower conversion rates see higher improvements, higher rates see lower but still significant improvements
  const getImprovementFactor = (rate: number) => {
    if (rate <= 1) return 5.0;      // 400% increase for very low rates
    if (rate <= 2) return 4.0;      // 300% increase for low rates
    if (rate <= 3) return 3.5;      // 250% increase for moderate-low rates
    if (rate <= 5) return 3.0;      // 200% increase for moderate rates
    if (rate <= 7) return 2.5;      // 150% increase for good rates
    return 2.0;                     // 100% increase for high rates
  };
  
  const improvementFactor = getImprovementFactor(conversionRate);
  const improvedConversionRate = conversionRate * improvementFactor;
  const projectedRevenue = leads * (improvedConversionRate / 100) * dealSize;
  const additionalRevenue = projectedRevenue - currentRevenue;
  
  // Calculate the actual percentage increase
  const revenueIncreasePercentage = ((projectedRevenue - currentRevenue) / currentRevenue * 100).toFixed(0);

  return (
    <motion.div 
      className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 lg:p-12 shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Input Section */}
        <div>
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Guaranteed ROI Calculator</h3>
              <p className="text-slate-400 text-sm">Your guaranteed return with InboxFlow</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Monthly Leads
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  value={leads}
                  onChange={(e) => setLeads(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(leads - 100) / (10000 - 100) * 100}%, #475569 ${(leads - 100) / (10000 - 100) * 100}%, #475569 100%)`
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">100</span>
                  <span className="text-2xl font-bold text-white">{leads.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">10k</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Current Conversion Rate
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(conversionRate - 0.5) / (10 - 0.5) * 100}%, #475569 ${(conversionRate - 0.5) / (10 - 0.5) * 100}%, #475569 100%)`
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">0.5%</span>
                  <span className="text-2xl font-bold text-white">{conversionRate}%</span>
                  <span className="text-xs text-slate-500">10%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Average Deal Size
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={dealSize}
                  onChange={(e) => setDealSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(dealSize - 1000) / (50000 - 1000) * 100}%, #475569 ${(dealSize - 1000) / (50000 - 1000) * 100}%, #475569 100%)`
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">$1k</span>
                  <span className="text-2xl font-bold text-white">${dealSize.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">$50k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        <div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700">
            <div className="space-y-4">
              <motion.div 
                className="flex justify-between items-center pb-4 border-b border-slate-700"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div>
                  <span className="text-slate-400 text-sm">Current Monthly Revenue</span>
                  <div className="text-xl font-semibold text-slate-300 mt-1">
                    Without InboxFlow
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-400">
                  ${currentRevenue.toLocaleString()}
                </div>
              </motion.div>
              
              <motion.div 
                className="flex justify-between items-center pb-4 border-b border-slate-700"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <span className="text-slate-400 text-sm">Projected Monthly Revenue</span>
                  <div className="text-xl font-semibold text-emerald-300 mt-1">
                    With InboxFlow ({improvementFactor}x conversion)
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  ${projectedRevenue.toLocaleString()}
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-white">Additional Revenue/Month</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mr-2" />
                    <span className="text-3xl font-bold text-emerald-400">
                      +${additionalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-emerald-500/20 rounded-lg mb-4">
                  <div className="text-5xl font-bold text-emerald-300 mb-2">
                    {revenueIncreasePercentage}%
                  </div>
                  <div className="text-sm text-emerald-400">Guaranteed ROI Increase</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Based on {improvementFactor}x average conversion improvement
                  </div>
                </div>
                
                {/* Additional Annual Revenue - Full Width and Prominent */}
                <motion.div 
                  className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border-2 border-yellow-500/30"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-6 h-6 text-yellow-400 mr-2" />
                      <span className="text-sm text-yellow-400 font-medium">GUARANTEED ANNUAL IMPACT</span>
                    </div>
                    <div className="text-5xl font-bold text-yellow-300 mb-2">
                      ${(additionalRevenue * 12).toLocaleString()}
                    </div>
                    <div className="text-lg text-yellow-400 font-semibold">Additional Annual Revenue</div>
                    <div className="text-sm text-slate-400 mt-2">
                      🎯 100% guaranteed or your money back
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg flex items-center justify-center group shadow-lg shadow-emerald-500/25"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Claim Your Guaranteed ROI Today
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <p className="text-center text-sm text-slate-500 mt-4">
            ✅ 14-day free trial • ✅ No credit card required • ✅ Money-back guarantee
          </p>
        </div>
      </div>
    </motion.div>
  );
}; 