
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, Filter, Send, Mail, FileText, MessageCircle } from "lucide-react"; // Added more icons for flexibility

const steps = [
  {
    icon: <LogIn className="w-10 h-10 text-blue-600" />,
    title: "Connect Gmail",
    description: "Secure OAuth login. No password needed.",
    delay: "0ms",
  },
  {
    icon: <Filter className="w-10 h-10 text-blue-600" />,
    title: "Auto-Sort Leads",
    description: "Your inbox becomes organized into Hot, Warm, and Cold categories.",
    delay: "200ms",
  },
  {
    icon: <Send className="w-10 h-10 text-blue-600" />,
    title: "Send Smart Replies",
    description: "Auto-reply to leads with your custom branded message.",
    delay: "400ms",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="bg-slate-50 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 text-slate-800">
          How InboxFlows Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <Card
              key={step.title}
              className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in"
              style={{ animationDelay: step.delay }}
            >
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-center mb-5">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-700">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
