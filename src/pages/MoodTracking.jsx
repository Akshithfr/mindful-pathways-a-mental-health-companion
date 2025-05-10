import React from 'react';
import EnhancedMoodTracker from '../components/mood/EnhancedMoodTracker';

const MoodTracking = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Mood Tracking</h1>
      <div className="bg-gray-50 rounded-lg p-8">
        <EnhancedMoodTracker />
      </div>
    </div>
  );
};

export default MoodTracking;
