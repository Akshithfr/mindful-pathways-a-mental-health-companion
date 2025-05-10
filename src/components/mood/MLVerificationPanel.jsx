// src/components/mood/MLVerificationPanel.jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { mlService } from '../../services/mlservices';

const MLVerificationPanel = ({ moodEntries }) => {
  const [testResults, setTestResults] = useState(null);
  const [manualTestResults, setManualTestResults] = useState(null);
  const [modelInfo, setModelInfo] = useState(mlService.getModelInfo());
  const [expanded, setExpanded] = useState(false);

  // Function to run model accuracy test
  const runModelTest = async () => {
    const results = await mlService.testModelAccuracy(moodEntries);
    setTestResults(results);
  };

  // Function to run a manual test with predefined inputs
  const runManualTest = async () => {
    const results = await mlService.manualTestPrediction();
    setManualTestResults(results);
  };

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium flex items-center">
          <Brain className="w-5 h-5 mr-2 text-indigo-600" />
          <span>Model Verification</span>
        </h3>
        <button 
          className="text-indigo-600 text-sm font-medium flex items-center"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide Details' : 'Show Details'}
          {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </button>
      </div>
      
      {expanded && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-2">Model Information</h4>
          <div className="space-y-1 text-sm">
            <p>Status: {modelInfo.isLoaded ? '✅ Loaded' : '❌ Not Loaded'}</p>
            {modelInfo.metrics.trainingSamples > 0 && (
              <>
                <p>Training Samples: {modelInfo.metrics.trainingSamples}</p>
                <p>Training Loss: {modelInfo.metrics.trainingLoss?.toFixed(4)}</p>
                <p>Validation Loss: {modelInfo.metrics.validationLoss?.toFixed(4)}</p>
                {modelInfo.metrics.averageError && (
                  <p>Average Prediction Error: {modelInfo.metrics.averageError.toFixed(2)} points</p>
                )}
                <p>Last Trained: {new Date(modelInfo.metrics.lastTrainingDate).toLocaleString()}</p>
              </>
            )}
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button
              onClick={runModelTest}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
            >
              Test Model Accuracy
            </button>
            <button
              onClick={runManualTest}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Run Manual Test
            </button>
            <button
              onClick={() => setModelInfo(mlService.getModelInfo())}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Refresh Info
            </button>
          </div>
        </div>
      )}
      
      {/* Test Results Display */}
      {testResults && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Accuracy Test Results</h4>
          <p className="mb-3">Average prediction error: {testResults.averageError.toFixed(2)} points</p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={testResults.predictions.map((p, i) => ({
                  index: i,
                  date: p.date,
                  actual: p.actual,
                  predicted: p.predicted
                }))}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip 
                  formatter={(value) => value.toFixed(2)}
                  labelFormatter={(index) => `Entry ${index}`}
                />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#4F46E5" name="Actual Mood" />
                <Line type="monotone" dataKey="predicted" stroke="#EF4444" name="Predicted Mood" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Manual Test Results */}
      {manualTestResults && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium mb-2">Manual Test Results</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <h5 className="font-medium">Good Conditions</h5>
              <p>Prediction: {manualTestResults.goodConditionsPrediction.toFixed(2)}</p>
              <ul className="text-sm mt-1">
                <li>Good sleep</li>
                <li>Exercise</li>
                <li>Social interaction</li>
                <li>No work stress</li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-100 rounded-lg">
              <h5 className="font-medium">Bad Conditions</h5>
              <p>Prediction: {manualTestResults.badConditionsPrediction.toFixed(2)}</p>
              <ul className="text-sm mt-1">
                <li>Poor sleep</li>
                <li>No exercise</li>
                <li>No social interaction</li>
                <li>High work stress</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 font-medium">
            Difference: {manualTestResults.difference.toFixed(2)} points
            {manualTestResults.difference >= 1 ? ' ✅' : ' ⚠️'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {manualTestResults.difference >= 1 
              ? 'The model properly distinguishes between good and bad conditions.' 
              : 'The model may not be properly distinguishing between conditions.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MLVerificationPanel;