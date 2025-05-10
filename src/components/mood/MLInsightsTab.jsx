// src/components/mood/MLInsightsTab.jsx
import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MLVerificationPanel from './MLVerificationPanel';

const MLInsightsTab = ({ 
  moodEntries, 
  mlEnabled, 
  toggleMlFeatures, 
  predictedMood, 
  mlRecommendations, 
  factorImportance,
  mlInsightsLoading,
  trainingInProgress
}) => {
  // Format prediction to readable text
  const formatPrediction = (value) => {
    if (!value) return null;
    
    let mood = '';
    if (value >= 4.5) mood = 'very happy';
    else if (value >= 3.5) mood = 'happy';
    else if (value >= 2.5) mood = 'neutral';
    else if (value >= 1.5) mood = 'sad';
    else mood = 'very sad';
    
    return {
      value: value.toFixed(1),
      mood
    };
  };
  
  // Prepare factor importance data for chart
  const prepareFactorImportanceData = () => {
    if (!factorImportance || factorImportance.length === 0) return [];
    
    return factorImportance.map(factor => ({
      name: factor.label,
      value: factor.impact * 100 // Scale for visibility
    }));
  };
  
  const prediction = formatPrediction(predictedMood);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Brain className="w-6 h-6 mr-2 text-indigo-600" />
        Machine Learning Insights
      </h2>
      
      {/* ML Enable/Disable Toggle */}
      <div className="mb-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-medium">ML Features</span>
            <Info 
              className="w-4 h-4 ml-1 text-gray-400 cursor-help"
              title="Machine learning uses your past moods to provide personalized insights"
            />
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
          <div className="mt-3 p-3 bg-amber-50 text-amber-800 rounded-md flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Not enough data for ML insights</p>
              <p className="text-sm">Log at least {10 - moodEntries.length} more mood entries to start getting ML-powered insights.</p>
            </div>
          </div>
        )}
        
        {trainingInProgress && (
          <div className="mt-3 p-3 bg-indigo-50 text-indigo-700 rounded-md flex items-center">
            <div className="w-5 h-5 mr-2 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Training model with your data...</p>
          </div>
        )}
      </div>
      
      {/* ML Content Area */}
      {mlEnabled && moodEntries.length >= 10 ? (
        <div className="space-y-6">
          {/* Loading State */}
          {mlInsightsLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">Analyzing your mood patterns...</p>
            </div>
          ) : (
            <>
              {/* Mood Prediction */}
              {prediction && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                    Mood Prediction
                  </h3>
                  <p className="mb-2">Based on your patterns, your mood right now is predicted to be:</p>
                  <div className="text-center py-3">
                    <span className="text-3xl font-bold text-indigo-700">{prediction.value}</span>
                    <p className="text-lg">{prediction.mood}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    This prediction is based on current time, your recent moods, and patterns in your data.
                  </p>
                </div>
              )}
              
              {/* Factor Importance */}
              {factorImportance && factorImportance.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Factors Influencing Your Mood</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareFactorImportanceData()}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`${value.toFixed(1)}% impact`, 'Importance']} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    These factors have the strongest influence on your mood according to our analysis.
                  </p>
                </div>
              )}
              
              {/* ML Recommendations */}
              {mlRecommendations && mlRecommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Personalized Recommendations</h3>
                  <ul className="space-y-2">
                    {mlRecommendations.map((recommendation, index) => (
                      <li 
                        key={index}
                        className="p-3 bg-green-50 text-green-800 rounded-md flex items-start"
                      >
                        <div className="w-5 h-5 mr-2 rounded-full bg-green-200 text-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Model Verification Panel (Hidden under expansion) */}
              <MLVerificationPanel moodEntries={moodEntries} />
            </>
          )}
        </div>
      ) : (
        // ML not enabled or not enough data
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-gray-400" />
          </div>
          {!mlEnabled ? (
            <p className="text-gray-500">Enable ML features to see personalized insights</p>
          ) : (
            <p className="text-gray-500">Log more mood entries to unlock ML insights</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MLInsightsTab;