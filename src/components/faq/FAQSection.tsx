import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the lead scoring system work?",
    answer: "Our AI-powered lead scoring system analyzes multiple factors including email content, response times, and engagement patterns. It automatically categorizes leads into Hot, Warm, and Cold based on their likelihood to convert, helping you prioritize your follow-ups effectively."
  },
  {
    question: "Is my email data secure?",
    answer: "Absolutely! We use enterprise-grade encryption and follow strict security protocols. We never store your email passwords, using OAuth2 for secure authentication. Your data is encrypted both in transit and at rest, and we're compliant with major data protection regulations."
  },
  {
    question: "Can I customize the auto-response templates?",
    answer: "Yes! You can create and customize multiple response templates for different scenarios. Our system allows you to personalize templates with dynamic fields, and you can set up different templates for different types of leads or inquiries."
  },
  {
    question: "How long does it take to set up?",
    answer: "Setup typically takes less than 5 minutes. Just connect your Gmail account, choose your preferred settings, and you're ready to go. Our onboarding wizard will guide you through the process step by step."
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes, we offer a 14-day free trial on all our plans. No credit card required. You'll have access to all features during the trial period to help you make an informed decision."
  },
  {
    question: "Can I integrate with my CRM?",
    answer: "Yes! We integrate with popular CRM platforms including Salesforce, HubSpot, and Pipedrive. Our API also allows for custom integrations with other tools and systems."
  }
];

const FAQSection = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            className="text-blue-600 font-semibold text-sm uppercase tracking-wider"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            FAQ
          </motion.span>
          <motion.h2
            className="mt-2 text-4xl font-bold text-slate-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Everything you need to know about InboxFlows
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-lg shadow-sm border border-slate-200"
              >
                <AccordionTrigger className="px-6 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-slate-900">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <p className="text-slate-600">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection; 