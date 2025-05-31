import { Shield, Lock, Eye, UserCheck } from "lucide-react";

const PrivacyPage = () => {
  const sections = [
    {
      icon: Shield,
      title: "Data Protection",
      content:
        "We implement industry-standard security measures to protect your data. All information is encrypted in transit and at rest using strong encryption protocols.",
    },
    {
      icon: Lock,
      title: "Data Access",
      content:
        "We only access your email data to provide our service. Our AI processes your emails to identify leads, but we never store the full content of your emails.",
    },
    {
      icon: Eye,
      title: "Transparency",
      content:
        "We believe in complete transparency about how we handle your data. You can request a copy of your data or delete your account at any time.",
    },
    {
      icon: UserCheck,
      title: "User Control",
      content:
        "You have full control over your data. You can modify your preferences, opt-out of certain features, or completely delete your account and data at any time.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-lg text-slate-400">
            We take your privacy seriously. Here's how we protect your data.
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

      {/* Detailed Policy Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Detailed Privacy Policy
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  1. Information We Collect
                </h3>
                <p className="text-slate-600 mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Your name and email address when you create an account</li>
                  <li>Your Gmail account information when you connect it</li>
                  <li>Usage data and analytics to improve our service</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  2. How We Use Your Information
                </h3>
                <p className="text-slate-600 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Provide and improve our email management services</li>
                  <li>Process and organize your leads</li>
                  <li>Send you important updates about our service</li>
                  <li>Respond to your requests and support needs</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  3. Data Retention
                </h3>
                <p className="text-slate-600">
                  We retain your information only for as long as necessary to provide you with our services and for legitimate business purposes. If you delete your account, we will delete or anonymize your information within 30 days.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  4. Your Rights
                </h3>
                <p className="text-slate-600 mb-4">
                  You have several rights regarding your data:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Right to access your data</li>
                  <li>Right to correct inaccurate data</li>
                  <li>Right to delete your data</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  5. Updates to This Policy
                </h3>
                <p className="text-slate-600">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-slate-600 text-sm">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage; 