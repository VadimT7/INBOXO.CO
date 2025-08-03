import { Link } from "react-router-dom";
import { Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {/* Logo */}
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 shadow-lg group">
                {/* Modern "I" with inbox-like design */}
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                  {/* Top bar (inbox lid) */}
                  <div className="absolute top-1 w-5 h-0.5 bg-white rounded-full opacity-90"></div>
                  {/* Main "I" stem */}
                  <div className="w-1 h-4 bg-white rounded-full"></div>
                  {/* Bottom bar (inbox base) */}
                  <div className="absolute bottom-1 w-5 h-0.5 bg-white rounded-full opacity-90"></div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-white/10 rounded-lg blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
              </div>
              <span className="text-xl font-bold">Inboxo</span>
            </div>
            <p className="text-slate-400 mb-4">
              Transform your inbox into a lead-generating powerhouse with AI-powered email management.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/inboxo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://github.com/inboxo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:hello@inboxo.com"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/features"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/customers"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Customers
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-center text-slate-400 text-sm">
            © {currentYear} Inboxo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 