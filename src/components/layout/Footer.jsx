import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Mindful Pathways</h3>
            <p className="text-gray-300">Supporting your mental health journey with compassion and understanding.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white">About Us</a></li>
              <li><a href="/services" className="text-gray-300 hover:text-white">Services</a></li>
              <li><a href="/resources" className="text-gray-300 hover:text-white">Resources</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            <p className="text-gray-300">
              If you're in crisis, please call:<br />
              National Crisis Hotline: 988
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-300">© 2025 Mindful Pathways. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
