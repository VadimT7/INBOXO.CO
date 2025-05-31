import { useEffect, useRef } from "react";

const LogoScroll = () => {
  const logos = [
    {
      name: "Google",
      url: "https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_light_clr_74x24px.svg",
      class: "h-6",
    },
    {
      name: "Asana",
      url: "https://cdn.worldvectorlogo.com/logos/asana-logo.svg",
      class: "h-8",
    },
    {
      name: "Slack",
      url: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg",
      class: "h-8",
    },
    {
      name: "Dropbox",
      url: "https://cdn.worldvectorlogo.com/logos/dropbox-2.svg",
      class: "h-8",
    },
    {
      name: "HubSpot",
      url: "https://cdn.worldvectorlogo.com/logos/hubspot-1.svg",
      class: "h-7",
    },
    {
      name: "Zendesk",
      url: "https://cdn.worldvectorlogo.com/logos/zendesk-1.svg",
      class: "h-6",
    },
    {
      name: "Monday.com",
      url: "https://cdn.worldvectorlogo.com/logos/monday-1.svg",
      class: "h-8",
    },
    {
      name: "Notion",
      url: "https://cdn.worldvectorlogo.com/logos/notion-2.svg",
      class: "h-7",
    },
    {
      name: "Salesforce",
      url: "https://cdn.worldvectorlogo.com/logos/salesforce-2.svg",
      class: "h-7",
    },
    {
      name: "Microsoft",
      url: "https://cdn.worldvectorlogo.com/logos/microsoft-5.svg",
      class: "h-7",
    }
  ];

  // Duplicate logos for seamless scrolling
  const allLogos = [...logos, ...logos];

  return (
    <section className="py-16 bg-slate-900 relative overflow-hidden">
      {/* Gradient overlays for smooth fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-slate-900 to-transparent z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-12">
          Trusted by Industry Leaders
        </h2>

        <div className="relative">
          {/* First row - moves left */}
          <div className="flex space-x-12 animate-scroll-left">
            {allLogos.map((logo, index) => (
              <div
                key={`${logo.name}-1-${index}`}
                className="flex items-center justify-center min-w-[220px] h-20 px-6 py-4 bg-white/5 rounded-lg backdrop-blur-sm group hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg text-slate-400 group-hover:text-white transition-colors duration-300 font-medium whitespace-nowrap">
                    {logo.name}
                  </span>
                  <img
                    src={logo.url}
                    alt={`${logo.name} logo`}
                    className={`${logo.class} opacity-70 group-hover:opacity-100 transition-opacity duration-300 filter brightness-0 invert`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Second row - moves right */}
          <div className="flex space-x-12 mt-8 animate-scroll-right">
            {allLogos.reverse().map((logo, index) => (
              <div
                key={`${logo.name}-2-${index}`}
                className="flex items-center justify-center min-w-[220px] h-20 px-6 py-4 bg-white/5 rounded-lg backdrop-blur-sm group hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg text-slate-400 group-hover:text-white transition-colors duration-300 font-medium whitespace-nowrap">
                    {logo.name}
                  </span>
                  <img
                    src={logo.url}
                    alt={`${logo.name} logo`}
                    className={`${logo.class} opacity-70 group-hover:opacity-100 transition-opacity duration-300 filter brightness-0 invert`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoScroll; 