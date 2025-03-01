import React from 'react';
import MoodTracker from '../components/mood/MoodTracker';

const MoodTracking = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Mood Tracking</h1>
      <div className="bg-gray-50 rounded-lg p-8">
        <MoodTracker />
      </div>
    </div>
  );
};

export default MoodTracking;
