import React from 'react';
import { Link } from 'react-router-dom';

const Services = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Our Services</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ServiceCard
          title="AI Chat Support"
          description="Access 24/7 emotional support through our AI-powered chatbot."
          link="/chat-support"
        />
        <ServiceCard
          title="Mood Tracking"
          description="Track and analyze your emotional well-being over time."
          link="/mood-tracking"
        />
        <ServiceCard
          title="Resource Library"
          description="Access curated mental health resources and educational materials."
          link="/resources"
        />
      </div>
    </div>
  );
};

const ServiceCard = ({ title, description, link }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        to={link}
        className="text-indigo-600 font-medium hover:text-indigo-700"
      >
        Learn More →
      </Link>
    </div>
  </div>
);

export default Services;