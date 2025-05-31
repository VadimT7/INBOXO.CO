import { Mail, Users, Inbox, Target } from "lucide-react";

const AboutPage = () => {
  const stats = [
    { label: "Active Users", value: "1,000+", icon: Users },
    { label: "Emails Processed", value: "1M+", icon: Mail },
    { label: "Leads Generated", value: "50,000+", icon: Target },
    { label: "Time Saved", value: "10,000+ hrs", icon: Inbox },
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      image: "https://api.dicebear.com/7.x/personas/svg?seed=alex&backgroundColor=b6e3f4",
    },
    {
      name: "Sarah Miller",
      role: "Head of Product",
      image: "https://api.dicebear.com/7.x/personas/svg?seed=sarah&backgroundColor=ffdfbf",
    },
    {
      name: "James Wilson",
      role: "Lead Engineer",
      image: "https://api.dicebear.com/7.x/personas/svg?seed=james&backgroundColor=c0aede",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Transforming Email Management
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            We're on a mission to help businesses turn their inbox chaos into organized opportunities.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 -mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200"
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
            Our Story
          </h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-slate-600 mb-6">
              InboxFlow was born from a simple observation: businesses spend too much time managing emails and miss valuable opportunities in the process. Our founder, having experienced this firsthand while running a digital agency, decided to create a solution that would transform how businesses handle their email communications.
            </p>
            <p className="text-slate-600 mb-6">
              What started as a simple tool for organizing leads has evolved into a comprehensive platform that helps businesses not just manage their emails, but turn them into meaningful relationships and opportunities.
            </p>
            <p className="text-slate-600">
              Today, InboxFlow serves thousands of businesses worldwide, helping them save time and capture more opportunities from their inbox. We're just getting started, and we're excited to continue innovating and helping businesses grow.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-slate-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-slate-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 