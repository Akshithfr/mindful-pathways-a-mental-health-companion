// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userDataService } from '../services/userDataService';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const moodEntries = userDataService.getMoodEntries(currentUser.id);
  
  const getRecentMood = () => {
    if (moodEntries.length === 0) return null;
    return moodEntries[moodEntries.length - 1];
  };
  
  const getStreak = () => {
    if (moodEntries.length === 0) return 0;
    
    let streak = 1;
    let previousDate = new Date(moodEntries[moodEntries.length - 1].timestamp);
    previousDate.setHours(0, 0, 0, 0);
    
    for (let i = moodEntries.length - 2; i >= 0; i--) {
      const currentDate = new Date(moodEntries[i].timestamp);
      currentDate.setHours(0, 0, 0, 0);
      
      const dayDifference = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (dayDifference === 1) {
        streak++;
        previousDate = currentDate;
      } else if (dayDifference === 0) {
        // Same day, continue
        continue;
      } else {
        // Streak broken
        break;
      }
    }
    
    return streak;
  };
  
  const recentMood = getRecentMood();
  const streak = getStreak();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Welcome, {currentUser.name}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Mood Journey</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Entries</p>
              <p className="text-3xl font-bold">{moodEntries.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Current Streak</p>
              <p className="text-3xl font-bold">{streak} days</p>
            </div>
          </div>
          
          {recentMood && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-600">Recent Mood</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl mr-2">
                  {recentMood.mood === 'Very Happy' ? '😄' : 
                   recentMood.mood === 'Happy' ? '🙂' : 
                   recentMood.mood === 'Neutral' ? '😐' : 
                   recentMood.mood === 'Sad' ? '🙁' : '😢'}
                </span>
                <span className="font-medium">{recentMood.mood}</span>
                <span className="ml-auto text-sm text-gray-500">
                  {new Date(recentMood.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          
          <Link 
            to="/mood-tracking" 
            className="mt-6 block w-full py-2 text-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Track Your Mood
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/chat-support" 
              className="block w-full py-3 px-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
            >
              Chat with Support
            </Link>
            <Link 
              to="/resources" 
              className="block w-full py-3 px-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
            >
              Browse Resources
            </Link>
            <Link 
              to="/profile" 
              className="block w-full py-3 px-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
            >
              Update Profile
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
        <div className="space-y-2">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="font-medium text-indigo-700">New Feature: Sleep Tracking</p>
            <p className="text-gray-600">Coming soon! Track your sleep and see how it affects your mood.</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="font-medium text-indigo-700">Tip of the Day</p>
            <p className="text-gray-600">Deep breathing for just 5 minutes can help reduce stress levels significantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;