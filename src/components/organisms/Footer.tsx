import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: 'Features', href: '/product' },
      { label: 'Pricing', href: '/billing' },
      { label: 'Beta Program', href: '/about' },
      { label: 'Roadmap', href: '/contact' },
    ],
    Company: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Beta Community', href: '/about' },
    ],
    Support: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Beta Support', href: '/contact' },
      { label: 'Feedback', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/parscade', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/parscade', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/parscade', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:admin@parscade.com', label: 'Email' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link 
              to="/" 
              className="text-2xl sm:text-3xl font-black text-white mb-4 block"
              style={{
                fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
            </Link>
            <Link to="/" className="flex items-center mb-4">
              <img
                src="/main-logo.png"
                alt="Parscade Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 bg-white/10 p-1"
              />
              <span className="text-2xl sm:text-3xl font-black text-white logo-text-light">
                Parscade
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md text-sm sm:text-base">
              Transform unstructured documents into structured data with our intelligent parsing platform.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="col-span-1">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{category}</h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-gray-400 text-sm">
            © {currentYear} Parscade. All rights reserved.
          </p>
          <div className="flex space-x-4 sm:space-x-6">
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
            >
              Terms
            </Link>
            <Link
              to="/cookies"
              className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;