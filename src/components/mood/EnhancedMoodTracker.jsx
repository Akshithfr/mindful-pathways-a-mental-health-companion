// src/components/mood/EnhancedMoodTracker.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, Tag, MessageCircle, TrendingUp, Activity, Brain, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userDataService } from '../../services/userDataService';
import { mlService } from '../../services/mlservices';
import MLInsightsTab from './MLInsightsTab';

const EnhancedMoodTracker = () => {
  // Auth context for user-specific data
  const { currentUser } = useAuth();
  
  // States for various functionalities
  const [moodEntries, setMoodEntries] = useState([]);
  const [currentMood, setCurrentMood] = useState('');
  const [note, setNote] = useState('');
  const [triggers, setTriggers] = useState([]);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [activeTab, setActiveTab] = useState('log');
  const [insights, setInsights] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  
  // ML-related state variables
  const [mlEnabled, setMlEnabled] = useState(false);
  const [modelTrained, setModelTrained] = useState(false);
  const [mlRecommendations, setMlRecommendations] = useState([]);
  const [predictedMood, setPredictedMood] = useState(null);
  const [factorImportance, setFactorImportance] = useState([]);
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [sleepQuality, setSleepQuality] = useState(0.5);
  const [mlInsightsLoading, setMlInsightsLoading] = useState(false);

  // Mood options with emojis, colors, and values
  const moods = [
    { label: 'Very Happy', value: 5, emoji: '😄', color: '#4ADE80' },
    { label: 'Happy', value: 4, emoji: '🙂', color: '#60A5FA' },
    { label: 'Neutral', value: 3, emoji: '😐', color: '#A78BFA' },
    { label: 'Sad', value: 2, emoji: '🙁', color: '#F59E0B' },
    { label: 'Very Sad', value: 1, emoji: '😢', color: '#EF4444' }
  ];

  // Common triggers for negative moods
  const commonTriggers = [
    'Work Stress', 'Family Issues', 'Financial Concerns', 
    'Health Problems', 'Relationship Issues', 'Social Media',
    'Poor Sleep', 'Loneliness', 'Overwhelmed'
  ];

  // Common coping activities
  const commonActivities = [
    'Exercise', 'Meditation', 'Reading', 'Talking with Friend',
    'Deep Breathing', 'Walking', 'Music', 'Creative Activity',
    'Journaling', 'Healthy Meal', 'Good Sleep'
  ];

  // Time periods
  const timePeriods = [
    'Morning', 'Afternoon', 'Evening', 'Night'
  ];

  // Load data from storage on first render
  useEffect(() => {
    let savedEntries = [];
    let savedTriggers = [];
    let savedActivities = [];
    
    if (currentUser) {
      // Get user-specific data
      savedEntries = userDataService.getMoodEntries(currentUser.id);
      
      // Get user preferences
      const userPrefs = userDataService.getUserPreferences(currentUser.id);
      savedTriggers = userPrefs.triggers || [];
      savedActivities = userPrefs.activities || [];
      
      // Check if ML was previously enabled
      setMlEnabled(userPrefs.mlEnabled || false);
    } else {
      // Fallback to local storage for backward compatibility
      const entriesFromStorage = localStorage.getItem('moodEntries');
      if (entriesFromStorage) {
        savedEntries = JSON.parse(entriesFromStorage);
      }
      
      const triggersFromStorage = localStorage.getItem('userTriggers');
      if (triggersFromStorage) {
        savedTriggers = JSON.parse(triggersFromStorage);
      }
      
      const activitiesFromStorage = localStorage.getItem('userActivities');
      if (activitiesFromStorage) {
        savedActivities = JSON.parse(activitiesFromStorage);
      }
      
      // Check if ML was previously enabled
      setMlEnabled(localStorage.getItem('mlEnabled') === 'true');
    }
    
    if (savedEntries && savedEntries.length > 0) {
      setMoodEntries(savedEntries);
    }
    
    if (savedTriggers && savedTriggers.length > 0) {
      setTriggers([...commonTriggers, ...savedTriggers]);
    } else {
      setTriggers(commonTriggers);
    }
    
    if (savedActivities && savedActivities.length > 0) {
      setActivities([...commonActivities, ...savedActivities]);
    } else {
      setActivities(commonActivities);
    }
    
    generateInsights();
    
    // Try to load existing ML model
    if (mlEnabled) {
      loadMlModel();
    }
  }, [currentUser]);

  // Save entries when they change
  useEffect(() => {
    if (moodEntries.length > 0) {
      if (currentUser) {
        // Save to user-specific storage
        userDataService.saveMoodEntries(currentUser.id, moodEntries);
      } else {
        // Fallback to localStorage
        localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
      }
      generateInsights();
      
      // If ML is enabled and we have enough entries, train/update the model
      if (mlEnabled && moodEntries.length >= 10 && !trainingInProgress) {
        trainModel();
      }
    }
  }, [moodEntries, currentUser, mlEnabled]);

  // Load existing ML model
  const loadMlModel = async () => {
    try {
      const loaded = await mlService.loadModel();
      if (loaded) {
        setModelTrained(true);
        // Generate ML recommendations based on loaded model
        updateMlInsights();
      } else if (moodEntries.length >= 10) {
        // If loading failed but we have enough data, train a new model
        trainModel();
      }
    } catch (error) {
      console.error('Error loading ML model:', error);
    }
  };

  // Train ML model with current mood data
  const trainModel = async () => {
    if (trainingInProgress || moodEntries.length < 10) return;
    
    try {
      setTrainingInProgress(true);
      const success = await mlService.trainModel(moodEntries);
      if (success) {
        setModelTrained(true);
        await mlService.saveModel();
        updateMlInsights();
      }
    } catch (error) {
      console.error('Error training model:', error);
    } finally {
      setTrainingInProgress(false);
    }
  };

  // Update ML-based insights
  const updateMlInsights = async () => {
    if (!modelTrained) return;
    
    try {
      setMlInsightsLoading(true);
      // Get current conditions
      const currentConditions = getCurrentConditions();
      
      // Generate recommendations
      const recommendations = await mlService.generateRecommendations(moodEntries, currentConditions);
      setMlRecommendations(recommendations);
      
      // Predict mood based on current conditions
      const prediction = await mlService.predictMood(currentConditions);
      setPredictedMood(prediction);
      
      // Analyze factor importance
      const factors = await mlService.analyzeFactorImportance(moodEntries);
      if (factors) {
        setFactorImportance(factors);
      }
    } catch (error) {
      console.error('Error updating ML insights:', error);
    } finally {
      setMlInsightsLoading(false);
    }
  };

  // Get current conditions for prediction
  const getCurrentConditions = () => {
    // Extract latest mood value if available
    const lastMoodValue = moodEntries.length > 0 
      ? moodEntries[moodEntries.length - 1].moodValue 
      : 3;
    
    // Extract current time of day
    const hour = new Date().getHours();
    let timeValue;
    if (hour < 12) timeValue = 'Morning';
    else if (hour < 17) timeValue = 'Afternoon';
    else if (hour < 21) timeValue = 'Evening';
    else timeValue = 'Night';
    
    // Check for exercise activity in recent entries
    const recentEntries = moodEntries.slice(-3);
    const recentExercise = recentEntries.some(entry => 
      entry.activities && entry.activities.includes('Exercise')
    );
    
    // Check for social interaction in recent entries
    const recentSocial = recentEntries.some(entry => 
      entry.activities && entry.activities.includes('Talking with Friend')
    );
    
    // Check for work stress in recent entries
    const recentWorkStress = recentEntries.some(entry => 
      entry.triggers && entry.triggers.includes('Work Stress')
    );
    
    return {
      lastMoodValue,
      timeOfDay: timeValue,
      sleepQuality: sleepQuality,
      exercise: recentExercise,
      socialInteraction: recentSocial,
      workStress: recentWorkStress
    };
  };

  // Graph data processing
  const prepareChartData = () => {
    const filteredEntries = getFilteredEntries();
    return filteredEntries.map(entry => ({
      date: new Date(entry.timestamp).toLocaleDateString(),
      value: entry.moodValue,
      mood: entry.mood,
      triggers: entry.triggers ? entry.triggers.join(', ') : '',
      activities: entry.activities ? entry.activities.join(', ') : '',
      timeOfDay: entry.timeOfDay || ''
    }));
  };

  // Prepare correlation data for activities and mood
  const prepareCorrelationData = () => {
    const activityMoods = {};
    
    moodEntries.forEach(entry => {
      if (entry.activities && Array.isArray(entry.activities)) {
        entry.activities.forEach(activity => {
          if (!activityMoods[activity]) {
            activityMoods[activity] = [];
          }
          activityMoods[activity].push(entry.moodValue);
        });
      }
    });
    
    return Object.entries(activityMoods)
      .filter(([_, moods]) => moods.length >= 2)  // Need at least 2 data points
      .map(([activity, moods]) => ({
        name: activity,
        avgMood: moods.reduce((sum, m) => sum + m, 0) / moods.length,
        count: moods.length
      }))
      .sort((a, b) => b.avgMood - a.avgMood)
      .slice(0, 8);  // Top 8 for visibility
  };

  // Prepare time of day data
  const prepareTimeData = () => {
    const timeData = {};
    
    moodEntries.forEach(entry => {
      if (entry.timeOfDay) {
        if (!timeData[entry.timeOfDay]) {
          timeData[entry.timeOfDay] = {
            totalMood: 0,
            count: 0
          };
        }
        timeData[entry.timeOfDay].totalMood += entry.moodValue;
        timeData[entry.timeOfDay].count += 1;
      }
    });
    
    return Object.entries(timeData).map(([time, data]) => ({
      name: time,
      avgMood: data.totalMood / data.count
    }));
  };

  // Prepare trigger frequency data
  const prepareTriggerData = () => {
    const triggerCount = {};
    
    moodEntries.forEach(entry => {
      if (entry.moodValue <= 3 && entry.triggers && Array.isArray(entry.triggers)) {  // Only count for neutral or negative moods
        entry.triggers.forEach(trigger => {
          triggerCount[trigger] = (triggerCount[trigger] || 0) + 1;
        });
      }
    });
    
    return Object.entries(triggerCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);  // Top 8 for visibility
  };

  // Submit the mood entry
  const handleMoodSubmit = () => {
    if (currentMood) {
      const newEntry = {
        mood: currentMood,
        moodValue: moods.find(m => m.label === currentMood)?.value || 3,
        note,
        triggers: selectedTriggers,
        activities: selectedActivities,
        timeOfDay,
        timestamp: new Date().toISOString(),
        // Add new fields for ML
        sleepQuality: sleepQuality,
      };

      // Add entry to state
      const updatedEntries = [...moodEntries, newEntry];
      setMoodEntries(updatedEntries);
      
      // Save custom triggers and activities to user preferences
      if (currentUser) {
        // Get custom triggers and activities
        const customTriggers = triggers.filter(t => !commonTriggers.includes(t));
        const customActivities = activities.filter(a => !commonActivities.includes(a));
        
        // Save to user preferences
        const preferences = userDataService.getUserPreferences(currentUser.id);
        preferences.triggers = customTriggers;
        preferences.activities = customActivities;
        userDataService.saveUserPreferences(currentUser.id, preferences);
      } else {
        // Fallback to localStorage
        const customTriggers = triggers.filter(t => !commonTriggers.includes(t));
        localStorage.setItem('userTriggers', JSON.stringify(customTriggers));
        
        const customActivities = activities.filter(a => !commonActivities.includes(a));
        localStorage.setItem('userActivities', JSON.stringify(customActivities));
      }
      
      resetForm();
      
      // Update ML insights after new entry
      if (mlEnabled && modelTrained) {
        updateMlInsights();
      }
    }
  };

  // Reset the form after submission
  const resetForm = () => {
    setCurrentMood('');
    setNote('');
    setSelectedTriggers([]);
    setSelectedActivities([]);
    setTimeOfDay('');
    setSleepQuality(0.5);
  };

  // Toggle a trigger in the selection
  const toggleTrigger = (trigger) => {
    if (selectedTriggers.includes(trigger)) {
      setSelectedTriggers(selectedTriggers.filter(t => t !== trigger));
    } else {
      setSelectedTriggers([...selectedTriggers, trigger]);
    }
  };

  // Toggle an activity in the selection
  const toggleActivity = (activity) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  // Add a custom trigger
  const addCustomTrigger = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const newTrigger = e.target.value;
      if (!triggers.includes(newTrigger)) {
        const updatedTriggers = [...triggers, newTrigger];
        setTriggers(updatedTriggers);
      }
      e.target.value = '';
    }
  };

  // Add a custom activity
  const addCustomActivity = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const newActivity = e.target.value;
      if (!activities.includes(newActivity)) {
        const updatedActivities = [...activities, newActivity];
        setActivities(updatedActivities);
      }
      e.target.value = '';
    }
  };

  // Filter entries based on time range
  const getFilteredEntries = () => {
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    return moodEntries.filter(entry => new Date(entry.timestamp) >= startDate);
  };

  // Toggle ML features
  const toggleMlFeatures = () => {
    const newMlEnabled = !mlEnabled;
    setMlEnabled(newMlEnabled);
    
    // Save preference
    if (currentUser) {
      const userPrefs = userDataService.getUserPreferences(currentUser.id);
      userPrefs.mlEnabled = newMlEnabled;
      userDataService.saveUserPreferences(currentUser.id, userPrefs);
    } else {
      localStorage.setItem('mlEnabled', newMlEnabled.toString());
    }
    
    // If enabling ML and we have enough entries, train model
    if (newMlEnabled && moodEntries.length >= 10 && !modelTrained) {
      trainModel();
    }
  };

  // Generate traditional insights from mood data
  const generateInsights = () => {
    if (moodEntries.length < 3) {
      setInsights({
        title: "Not enough data yet",
        text: "Log a few more moods to see personalized insights!",
        suggestions: ["Try to log your mood at different times of the day", "Include what activities you did"]
      });
      return;
    }

    const filteredEntries = getFilteredEntries();
    
    // Calculate average mood
    const avgMoodValue = filteredEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / filteredEntries.length;
    
    // Find common triggers for low moods
    const lowMoodEntries = filteredEntries.filter(entry => entry.moodValue <= 2);
    const triggerCounts = {};
    lowMoodEntries.forEach(entry => {
      if (Array.isArray(entry.triggers)) {
        entry.triggers.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      }
    });
    
    // Find activities correlated with higher moods
    const highMoodEntries = filteredEntries.filter(entry => entry.moodValue >= 4);
    const activityCounts = {};
    highMoodEntries.forEach(entry => {
      if (Array.isArray(entry.activities)) {
        entry.activities.forEach(activity => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
      }
    });
    
    // Sort by count
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trigger]) => trigger);
      
    const topActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([activity]) => activity);
    
    // Time of day patterns
    const timePatterns = {};
    filteredEntries.forEach(entry => {
      if (entry.timeOfDay) {
        timePatterns[entry.timeOfDay] = (timePatterns[entry.timeOfDay] || 0) + entry.moodValue;
      }
    });
    
    // Find best and worst times
    let bestTime = '';
    let worstTime = '';
    let bestScore = -Infinity;
    let worstScore = Infinity;
    
    Object.entries(timePatterns).forEach(([time, score]) => {
      const avgScore = score / filteredEntries.filter(e => e.timeOfDay === time).length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestTime = time;
      }
      if (avgScore < worstScore) {
        worstScore = avgScore;
        worstTime = time;
      }
    });
    
    // Generate insights text
    let title = '';
    let text = '';
    const suggestions = [];
    
    if (avgMoodValue >= 4) {
      title = "You're doing great!";
      text = "Your mood has been positive lately.";
    } else if (avgMoodValue >= 3) {
      title = "Staying balanced";
      text = "Your mood has been relatively stable.";
    } else {
      title = "Room for improvement";
      text = "Your mood has been lower than average.";
    }
    
    if (topTriggers.length > 0) {
      text += ` Common factors in your low moods include ${topTriggers.join(', ')}.`;
      suggestions.push(`Try to minimize exposure to ${topTriggers[0]} when possible`);
    }
    
    if (topActivities.length > 0) {
      suggestions.push(`Consider doing more ${topActivities.join(', ')}`);
    }
    
    if (bestTime) {
      text += ` You tend to feel best during the ${bestTime}.`;
    }
    
    if (worstTime) {
      suggestions.push(`Be mindful of your mental health during the ${worstTime}`);
    }
    
    setInsights({
      title,
      text,
      suggestions
    });
  };

  // UI rendering
  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'log' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('log')}
        >
          Log Mood
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'insights' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'trends' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        {/* ML tab */}
        <button 
          className={`px-4 py-2 font-medium flex items-center ${activeTab === 'ml' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('ml')}
        >
          <Brain className="w-4 h-4 mr-1" /> ML Insights
        </button>
      </div>

      {/* Log Mood Tab */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">How are you feeling right now?</h2>
          
          {/* Mood Selection */}
          <div className="mb-6">
            <label className="flex items-center text-lg mb-3">
              <span className="mr-2">Mood</span>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {moods.map(mood => (
                <button
                  key={mood.label}
                  onClick={() => setCurrentMood(mood.label)}
                  className={`p-4 rounded-lg text-center transition-colors ${
                    currentMood === mood.label 
                      ? 'ring-2 ring-offset-2 ring-indigo-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: currentMood === mood.label ? mood.color + '20' : ''
                  }}
                >
                  <div className="text-3xl mb-2">{mood.emoji}</div>
                  <div className="text-sm font-medium">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div className="mb-6">
            <label className="flex items-center text-lg mb-3">
              <Clock className="w-5 h-5 mr-2" />
              <span>Time of Day</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {timePeriods.map(time => (
                <button
                  key={time}
                  onClick={() => setTimeOfDay(time)}
                  className={`py-2 px-4 rounded-lg text-center ${
                    timeOfDay === time 
                      ? 'bg-indigo-100 text-indigo-700 font-medium' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sleep Quality - For ML */}
          <div className="mb-6">
            <label className="flex items-center text-lg mb-3">
              <span>Sleep Quality</span>
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Poor</span>
                <span>Average</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>

          {/* Triggers */}
          <div className="mb-6">
            <label className="flex items-center text-lg mb-3">
              <Tag className="w-5 h-5 mr-2" />
              <span>Triggers/Factors (if any)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {triggers.map(trigger => (
                <button
                  key={trigger}
                  onClick={() => toggleTrigger(trigger)}
                  className={`py-1 px-3 rounded-full text-sm ${
                    selectedTriggers.includes(trigger)
                      ? 'bg-red-100 text-red-700 font-medium'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {trigger}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add custom trigger (press Enter)"
              className="w-full p-2 border rounded-lg"
              onKeyDown={addCustomTrigger}
            />
          </div>

          {/* Activities */}
          <div className="mb-6">
            <label className="flex items-center text-lg mb-3">
              <Activity className="w-5 h-5 mr-2" />
              <span>Activities</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {activities.map(activity => (
                <button
                  key={activity}
                  onClick={() => toggleActivity(activity)}
                  className={`py-1 px-3 rounded-full text-sm ${
                    selectedActivities.includes(activity)
                      ? 'bg-green-100 text-green-700 font-medium'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add custom activity (press Enter)"
              className="w-full p-2 border rounded-lg"
              onKeyDown={addCustomActivity}
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="flex items-center text-lg mb-3">
              <MessageCircle className="w-5 h-5 mr-2" />
              <span>Notes (optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional thoughts..."
              className="w-full p-3 border rounded-lg h-24"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleMoodSubmit}
            disabled={!currentMood}
            className={`w-full py-3 rounded-lg font-medium ${
              currentMood
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Mood
          </button>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">{insights?.title || "Insights"}</h2>
            <p className="text-lg mb-4">{insights?.text || "Not enough data to generate insights yet."}</p>
            
            {insights?.suggestions && insights.suggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Suggestions:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {insights.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* ML toggle switch */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                  <span className="font-medium">Machine Learning Features</span>
                </div>
                <button
                  onClick={toggleMlFeatures}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    mlEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mlEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {mlEnabled 
                  ? "ML features are enabled. The app will learn from your patterns to provide personalized insights." 
                  : "Enable ML features to get personalized recommendations and predictions based on your mood patterns."}
              </p>
              {mlEnabled && moodEntries.length < 10 && (
                <p className="text-sm text-amber-600 mt-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" /> 
                  Log at least {10 - moodEntries.length} more entries to start getting ML-powered insights.
                </p>
              )}
              {trainingInProgress && (
                <p className="text-sm text-indigo-600 mt-2">Training model with your data...</p>
              )}
            </div>
          </div>
          
          {moodEntries.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activities and Mood Correlation */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Activities & Mood</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareCorrelationData()}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="avgMood" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Time of Day and Mood */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Time of Day & Mood</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareTimeData()}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="avgMood" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Trigger Frequency */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Common Triggers</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareTriggerData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name }) => name}
                      >
                        {prepareTriggerData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 25}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Mood Trends</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 rounded ${timeRange === 'week' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 rounded ${timeRange === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 rounded ${timeRange === 'year' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
              >
                Year
              </button>
            </div>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={prepareChartData()}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip 
                  content={({ payload, label }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-bold">{label}</p>
                          <p className="text-gray-700">{data.mood}</p>
                          {data.timeOfDay && <p className="text-gray-700">Time: {data.timeOfDay}</p>}
                          {data.triggers && <p className="text-gray-700">Triggers: {data.triggers}</p>}
                          {data.activities && <p className="text-gray-700">Activities: {data.activities}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  dot={{ fill: '#4F46E5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Mood History</h2>
          
          {moodEntries.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No mood entries yet</p>
          ) : (
            <div className="space-y-4">
              {[...moodEntries].reverse().map((entry, index) => {
                const mood = moods.find(m => m.label === entry.mood);
                return (
                  <div key={index} className="border rounded-lg p-4 flex">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0" 
                      style={{ backgroundColor: mood?.color + '20' }}
                    >
                      <span className="text-2xl">{mood?.emoji}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap justify-between items-start mb-2">
                        <h3 className="font-medium">{entry.mood}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      {entry.timeOfDay && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Time of Day:</span> {entry.timeOfDay}
                        </p>
                      )}
                      
                      {entry.triggers && entry.triggers.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Triggers:</span> {entry.triggers.join(', ')}
                        </p>
                      )}
                      
                      {entry.activities && entry.activities.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Activities:</span> {entry.activities.join(', ')}
                        </p>
                      )}
                      
                      {entry.note && (
                        <p className="text-sm mt-2">{entry.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ML Insights Tab */}
      {activeTab === 'ml' && (
        <MLInsightsTab 
          moodEntries={moodEntries}
          mlEnabled={mlEnabled}
          toggleMlFeatures={toggleMlFeatures}
          predictedMood={predictedMood}
          mlRecommendations={mlRecommendations}
          factorImportance={factorImportance}
          mlInsightsLoading={mlInsightsLoading}
          trainingInProgress={trainingInProgress}
        />
      )}
    </div>
  );
};

export default EnhancedMoodTracker;