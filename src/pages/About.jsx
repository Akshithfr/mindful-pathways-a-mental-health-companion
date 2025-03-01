import React from 'react';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">About Mindful Pathways</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-6">
            At Mindful Pathways, we're dedicated to making mental health support accessible,
            personalized, and effective. Our platform combines cutting-edge technology with
            compassionate care to help you navigate your mental health journey.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Our Approach</h2>
          <p className="text-gray-600">
            We believe in a holistic approach to mental wellness that combines AI-powered
            support, mood tracking, and evidence-based resources. Our platform is designed
            to be your companion in maintaining and improving your mental well-being.
          </p>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>24/7 AI-powered emotional support</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>Personalized mood tracking and insights</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>Curated mental health resources</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">✓</span>
              <span>Crisis support and emergency resources</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;