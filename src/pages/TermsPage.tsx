import { Scale, FileText, AlertCircle, Clock } from "lucide-react";

const TermsPage = () => {
  const sections = [
    {
      icon: Scale,
      title: "Legal Agreement",
      content:
        "By using Inboxo, you agree to these terms. Please read them carefully before using our services.",
    },
    {
      icon: FileText,
      title: "License",
      content:
        "We grant you a limited, non-exclusive license to use our service for your business needs.",
    },
    {
      icon: AlertCircle,
      title: "Restrictions",
      content:
        "You may not use our service for any illegal purposes or in ways that could damage our service.",
    },
    {
      icon: Clock,
      title: "Term & Termination",
      content:
        "You can stop using our service at any time. We may also terminate access if terms are violated.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-lg text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Key Points Section */}
      <section className="py-16 px-4 -mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <div
                key={section.title}
                className="bg-white rounded-lg shadow-lg p-6 flex items-start space-x-4 transform hover:scale-105 transition-transform duration-200"
              >
                <div className="flex-shrink-0">
                  <section.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-slate-600">{section.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Terms Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Detailed Terms of Service
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  1. Acceptance of Terms
                </h3>
                <p className="text-slate-600">
                  By accessing or using Inboxo, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  2. Use License
                </h3>
                <p className="text-slate-600 mb-4">
                  Subject to your compliance with these Terms, Inboxo grants you a limited, non-exclusive, non-transferable, non-sublicensable license to access and use the Services.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>The license is for personal or business use only</li>
                  <li>You may not modify or copy our software</li>
                  <li>You may not use the service for illegal purposes</li>
                  <li>You may not transfer your account to another party</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  3. Service Terms
                </h3>
                <p className="text-slate-600 mb-4">
                  Our service terms include:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>You must be 18 years or older to use this service</li>
                  <li>You must provide accurate account information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>You must comply with all applicable laws and regulations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  4. Modifications to Service
                </h3>
                <p className="text-slate-600">
                  Inboxo reserves the right to modify or discontinue the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  5. Limitation of Liability
                </h3>
                <p className="text-slate-600">
                  Inboxo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  6. Termination
                </h3>
                <p className="text-slate-600">
                  We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the service will immediately cease.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-slate-600 text-sm">
                By using Inboxo, you acknowledge that you have read and understand these terms and agree to be bound by them.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage; 