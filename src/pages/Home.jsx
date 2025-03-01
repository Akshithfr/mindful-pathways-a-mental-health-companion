import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Journey to Mental Wellness Starts Here
            </h1>
            <p className="text-xl mb-8">
              Access support, track your mood, and discover resources for better mental health.
            </p>
            <Link
              to="/chat-support"
              className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Start Chatting
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="AI Chat Support"
              description="24/7 compassionate chat support to help you navigate your emotions."
              icon="💭"
              link="/chat-support"
            />
            <FeatureCard
              title="Mood Tracking"
              description="Track your emotional well-being and gain insights into your mental health patterns."
              icon="📊"
              link="/mood-tracking"
            />
            <FeatureCard
              title="Resources"
              description="Access curated mental health resources and educational content."
              icon="📚"
              link="/resources"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ title, description, icon, link }) => (
  <Link to={link}>
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </Link>
);

export default Home;