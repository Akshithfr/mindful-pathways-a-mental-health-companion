// src/services/mlService.js
import * as tf from '@tensorflow/tfjs';
import axios from 'axios';
import { userDataService } from './userDataService';

class MoodMLService {
  constructor() {
    this.model = null;
    this.predictionFeatures = [
      'dayOfWeek',
      'timeOfDay',
      'previousMoodValue',
      'sleepQuality',
      'exercise',
      'socialInteraction',
      'workStress'
    ];
    this.triggerFeatureMap = {
      'Work Stress': 'workStress',
      'Poor Sleep': 'sleepQuality',
      'Exercise': 'exercise',
      'Talking with Friend': 'socialInteraction'
      // Map can be expanded with more features
    };
    this.modelMetrics = {
      trainingSamples: 0,
      validationLoss: null,
      trainingLoss: null,
      averageError: null,
      lastTrainingDate: null
    };
    this.baseUrl = 'http:localhost:5000/';
  }

  // Set up API instance with auth token
  getAPI() {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
  }

  // Preprocess mood entries for training
  preprocessData(moodEntries) {
    // Skip if not enough data
    if (moodEntries.length < 10) return null;

    const features = [];
    const labels = [];

    // Process entries to create feature vectors and labels
    for (let i = 1; i < moodEntries.length; i++) {
      const entry = moodEntries[i];
      const prevEntry = moodEntries[i-1];
      
      // Extract day of week (0-6)
      const dayOfWeek = new Date(entry.timestamp).getDay();
      
      // Convert time of day to numerical value
      const timeMap = { 'Morning': 0, 'Afternoon': 1, 'Evening': 2, 'Night': 3 };
      const timeOfDay = timeMap[entry.timeOfDay] || 2; // Default to evening if missing
      
      // Previous mood as a predictor
      const previousMoodValue = prevEntry.moodValue;
      
      // Initialize feature values based on triggers and activities
      const featureValues = {
        sleepQuality: 0.5, // Default values
        exercise: 0,
        socialInteraction: 0,
        workStress: 0
      };
      
      // Update feature values based on triggers
      if (entry.triggers && Array.isArray(entry.triggers)) {
        entry.triggers.forEach(trigger => {
          const featureName = this.triggerFeatureMap[trigger];
          if (featureName) {
            // For negative features like stress, increase value
            if (featureName === 'workStress') {
              featureValues[featureName] = 1;
            } 
            // For positive features, set to 0 to indicate lack of it
            else if (featureName === 'sleepQuality') {
              featureValues[featureName] = 0;
            }
          }
        });
      }
      
      // Update feature values based on activities
      if (entry.activities && Array.isArray(entry.activities)) {
        entry.activities.forEach(activity => {
          const featureName = this.triggerFeatureMap[activity];
          if (featureName) {
            // For positive activities, set to 1
            if (featureName === 'exercise' || featureName === 'socialInteraction') {
              featureValues[featureName] = 1;
            }
            // Improve sleep quality if it's mentioned as activity
            else if (featureName === 'sleepQuality') {
              featureValues[featureName] = 1;
            }
          }
        });
      }
      
      // Create feature vector
      const featureVector = [
        dayOfWeek / 6, // Normalize to 0-1 range
        timeOfDay / 3, // Normalize to 0-1 range
        (previousMoodValue - 1) / 4, // Normalize from 1-5 to 0-1 range
        featureValues.sleepQuality,
        featureValues.exercise,
        featureValues.socialInteraction,
        featureValues.workStress
      ];
      
      features.push(featureVector);
      
      // Normalize mood value from 1-5 to 0-1 for training
      const normalizedMoodValue = (entry.moodValue - 1) / 4;
      labels.push(normalizedMoodValue);
    }
    
    return { features, labels };
  }

  // Train the model with user's mood data
  async trainModel(moodEntries) {
    try {
      // Preprocess data
      const data = this.preprocessData(moodEntries);
      if (!data || data.features.length < 10) {
        console.log('Not enough data to train the model');
        return false;
      }
      
      // Log training data info for verification
      console.log('Starting model training with', data.features.length, 'data points');
      console.log('Sample feature vector:', data.features[0]);
      console.log('Sample label:', data.labels[0]);
      
      const { features, labels } = data;
      
      // Convert to tensors
      const xs = tf.tensor2d(features);
      const ys = tf.tensor1d(labels);
      
      // Define model architecture
      this.model = tf.sequential();
      
      // Add layers
      this.model.add(tf.layers.dense({
        units: 10,
        activation: 'relu',
        inputShape: [this.predictionFeatures.length]
      }));
      
      this.model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid' // Output between 0-1 for normalized mood
      }));
      
      // Compile the model
      this.model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError'
      });
      
      // Train the model with callback to monitor progress
      const result = await this.model.fit(xs, ys, {
        epochs: 100,
        batchSize: 8,
        shuffle: true,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss}, val_loss = ${logs.val_loss}`);
            }
          }
        }
      });
      
      // Calculate final metrics
      const finalLoss = result.history.loss[result.history.loss.length - 1];
      const finalValLoss = result.history.val_loss[result.history.val_loss.length - 1];
      console.log(`Training complete - Final loss: ${finalLoss}, Validation loss: ${finalValLoss}`);
      
      // Update model metrics
      this.modelMetrics = {
        trainingSamples: features.length,
        trainingLoss: finalLoss,
        validationLoss: finalValLoss,
        lastTrainingDate: new Date().toISOString()
      };
      
      // Run a test to estimate model accuracy
      const testResults = await this.testModelAccuracy(moodEntries);
      if (testResults) {
        this.modelMetrics.averageError = testResults.averageError;
      }
      
      console.log('Model trained successfully', result);
      console.log('Model metrics:', this.modelMetrics);
      
      // Dispose tensors to free memory
      xs.dispose();
      ys.dispose();
      
      return true;
    } catch (error) {
      console.error('Error training model:', error);
      return false;
    }
  }

  // Predict mood based on current conditions
  async predictMood(userData) {
    if (!this.model) {
      return null;
    }
    
    try {
      // Extract features from user data
      const dayOfWeek = new Date().getDay() / 6;
      
      // Determine time of day
      const hour = new Date().getHours();
      let timeOfDay;
      if (hour < 12) timeOfDay = 0; // Morning
      else if (hour < 17) timeOfDay = 1; // Afternoon
      else if (hour < 21) timeOfDay = 2; // Evening
      else timeOfDay = 3; // Night
      
      // Normalize time of day
      const normalizedTimeOfDay = timeOfDay / 3;
      
      // Previous mood (from userData)
      const previousMoodValue = userData.lastMoodValue ? (userData.lastMoodValue - 1) / 4 : 0.5;
      
      // Other features (from user input or defaults)
      const sleepQuality = userData.sleepQuality || 0.5;
      const exercise = userData.exercise ? 1 : 0;
      const socialInteraction = userData.socialInteraction ? 1 : 0;
      const workStress = userData.workStress ? 1 : 0;
      
      // Create input tensor
      const input = tf.tensor2d([[
        dayOfWeek,
        normalizedTimeOfDay,
        previousMoodValue,
        sleepQuality,
        exercise,
        socialInteraction,
        workStress
      ]]);
      
      // Log input for verification
      console.log('Making prediction with input:', input.arraySync());
      
      // Make prediction
      const prediction = await this.model.predict(input);
      const predictedValue = prediction.dataSync()[0];
      
      // Log raw prediction for verification
      console.log('Raw prediction value:', predictedValue);
      
      // Convert prediction back to 1-5 scale
      const moodValue = 1 + (predictedValue * 4);
      
      // Clean up
      input.dispose();
      prediction.dispose();
      
      return moodValue;
    } catch (error) {
      console.error('Prediction error:', error);
      return null;
    }
  }

  // Find factors that most influence mood
  async analyzeFactorImportance(moodEntries) {
    if (!this.model || moodEntries.length < 20) {
      return null;
    }
    
    try {
      // Calculate baseline average
      const baselineAverage = moodEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / moodEntries.length;
      
      // Create a baseline feature set
      const baselineFeatures = [
        0.5, // dayOfWeek (middle of week)
        0.5, // timeOfDay (afternoon)
        (baselineAverage - 1) / 4, // previous mood
        0.5, // sleep quality
        0.5, // exercise
        0.5, // social interaction
        0.5  // work stress
      ];
      
      // Test importance of each factor by varying it and measuring change
      const factorImpact = {};
      
      for (let i = 0; i < this.predictionFeatures.length; i++) {
        const featureHighValue = [...baselineFeatures];
        featureHighValue[i] = 1.0; // Set to high value
        
        const featureLowValue = [...baselineFeatures];
        featureLowValue[i] = 0.0; // Set to low value
        
        // Create tensors
        const highTensor = tf.tensor2d([featureHighValue]);
        const lowTensor = tf.tensor2d([featureLowValue]);
        
        // Make predictions
        const highPrediction = await this.model.predict(highTensor);
        const lowPrediction = await this.model.predict(lowTensor);
        
        // Calculate difference
        const highValue = highPrediction.dataSync()[0];
        const lowValue = lowPrediction.dataSync()[0];
        const impact = Math.abs(highValue - lowValue);
        
        // Store impact
        factorImpact[this.predictionFeatures[i]] = impact;
        
        // Log factor impact for verification
        console.log(`Factor ${this.predictionFeatures[i]} impact: ${impact.toFixed(4)}`);
        
        // Clean up
        highTensor.dispose();
        lowTensor.dispose();
        highPrediction.dispose();
        lowPrediction.dispose();
      }
      
      // Sort factors by impact
      const sortedFactors = Object.entries(factorImpact)
        .sort((a, b) => b[1] - a[1])
        .map(([factor, impact]) => ({
          factor,
          impact,
          // Convert factor name to more readable form
          label: factor.replace(/([A-Z])/g, ' $1').toLowerCase()
        }));
      
      return sortedFactors;
    } catch (error) {
      console.error('Error analyzing factor importance:', error);
      return null;
    }
  }

  // Generate personalized recommendations
  async generateRecommendations(moodEntries, currentConditions = {}) {
    if (!this.model || moodEntries.length < 15) {
      return ["Log more entries to get ML-powered recommendations"];
    }
    
    try {
      // Get factor importance analysis
      const factorAnalysis = await this.analyzeFactorImportance(moodEntries);
      if (!factorAnalysis) return ["Unable to analyze factors"];
      
      // Get the top influencing factors
      const topFactors = factorAnalysis.slice(0, 3);
      
      // Generate recommendations based on top factors
      const recommendations = [];
      
      for (const factor of topFactors) {
        switch (factor.factor) {
          case 'sleepQuality':
            recommendations.push("Prioritize consistent sleep schedule for improved mood");
            break;
          case 'exercise':
            recommendations.push("Regular physical activity significantly improves your mood");
            break;
          case 'socialInteraction':
            recommendations.push("Connecting with friends appears to have a positive effect on your mood");
            break;
          case 'workStress':
            recommendations.push("Consider stress management techniques for work-related pressure");
            break;
          case 'timeOfDay':
            // Analyze best time of day from entries
            const timeAnalysis = {};
            moodEntries.forEach(entry => {
              if (entry.timeOfDay) {
                if (!timeAnalysis[entry.timeOfDay]) {
                  timeAnalysis[entry.timeOfDay] = { sum: 0, count: 0 };
                }
                timeAnalysis[entry.timeOfDay].sum += entry.moodValue;
                timeAnalysis[entry.timeOfDay].count++;
              }
            });
            
            let bestTime = null;
            let bestScore = -Infinity;
            
            Object.entries(timeAnalysis).forEach(([time, data]) => {
              const avgScore = data.sum / data.count;
              if (avgScore > bestScore) {
                bestScore = avgScore;
                bestTime = time;
              }
            });
            
            if (bestTime) {
              recommendations.push(`Schedule important activities during ${bestTime} when your mood tends to be best`);
            }
            break;
          case 'dayOfWeek':
            // Could analyze best day of week from historical data
            recommendations.push("Your mood follows weekly patterns - plan activities accordingly");
            break;
          default:
            break;
        }
      }
      
      // If we have current conditions, predict what would improve mood
      if (Object.keys(currentConditions).length > 0) {
        const currentPrediction = await this.predictMood(currentConditions);
        
        // Try changing factors to see what would increase predicted mood
        for (const factor of this.predictionFeatures) {
          // Skip day of week and time of day as they can't be changed
          if (factor === 'dayOfWeek' || factor === 'timeOfDay') continue;
          
          // Create modified conditions
          const modifiedConditions = { ...currentConditions };
          
          // Flip binary factors, improve continuous ones
          if (factor === 'exercise' || factor === 'socialInteraction') {
            modifiedConditions[factor] = 1;
          } else if (factor === 'workStress') {
            modifiedConditions[factor] = 0;
          } else if (factor === 'sleepQuality') {
            modifiedConditions[factor] = 1;
          }
          
          // Predict with modified condition
          const modifiedPrediction = await this.predictMood(modifiedConditions);
          
          // If significant improvement, add specific recommendation
          if (modifiedPrediction && currentPrediction && modifiedPrediction - currentPrediction > 0.5) {
            switch (factor) {
              case 'exercise':
                recommendations.push("Right now, physical activity would likely improve your mood");
                break;
              case 'socialInteraction':
                recommendations.push("Connecting with a friend could help your current mood");
                break;
              case 'workStress':
                recommendations.push("Taking a break from work stress would be beneficial now");
                break;
              case 'sleepQuality':
                recommendations.push("A short nap or rest might help your current state");
                break;
              default:
                break;
            }
          }
        }
      }
      
      // Return unique recommendations
      return [...new Set(recommendations)].slice(0, 5);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return ["Error generating ML-powered recommendations"];
    }
  }
  
  // Save the trained model
  async saveModel() {
    if (!this.model) return false;
    
    try {
      // First save model to localStorage for offline access
      const saveResults = await this.model.save('localstorage://mood-prediction-model');
      console.log('Model saved to localStorage:', saveResults);
      
      // Serialize model for MongoDB
      const modelConfig = this.model.getConfig();
      const weights = this.model.getWeights();
      const serializedWeights = weights.map(w => {
        return {
          data: Array.from(w.dataSync()),
          shape: w.shape
        };
      });
      
      // Prepare model data for API
      const modelData = {
        config: modelConfig,
        weights: serializedWeights
      };
      
      // Save to MongoDB via API
      if (userDataService.isAuthenticated()) {
        try {
          const api = this.getAPI();
          await api.post(`/ml-models/mood-prediction`, {
            modelData,
            metrics: this.modelMetrics
          });
          console.log('Model saved to MongoDB');
        } catch (apiError) {
          console.error('Error saving model to MongoDB:', apiError);
          // Continue even if API save fails - model is still in localStorage
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving model:', error);
      return false;
    }
  }
  
  // Load a previously trained model
  async loadModel() {
    try {
      // First try to load from localStorage (faster and works offline)
      try {
        this.model = await tf.loadLayersModel('localstorage://mood-prediction-model');
        console.log('Model loaded from localStorage');
        
        // Also try to load metrics from localStorage
        const savedMetrics = localStorage.getItem('mood-model-metrics');
        if (savedMetrics) {
          this.modelMetrics = JSON.parse(savedMetrics);
        }
        
        return true;
      } catch (localError) {
        console.log('Model not found in localStorage, trying server...');
        
        // If local load fails, try loading from MongoDB via API
        if (userDataService.isAuthenticated()) {
          try {
            const api = this.getAPI();
            const response = await api.get(`/ml-models/mood-prediction`);
            const modelData = response.data;
            
            // Reconstruct the model from the stored configuration
            this.model = tf.sequential();
            
            // Add layers based on config
            modelData.modelData.config.forEach(layerConfig => {
              this.model.add(tf.layers.dense(layerConfig));
            });
            
            // Compile the model with same settings as original
            this.model.compile({
              optimizer: tf.train.adam(0.01),
              loss: 'meanSquaredError'
            });
            
            // Set the weights
            const weights = modelData.modelData.weights.map(weightData => {
              return tf.tensor(weightData.data, weightData.shape);
            });
            
            this.model.setWeights(weights);
            
            // Set metrics
            if (modelData.metrics) {
              this.modelMetrics = modelData.metrics;
            }
            
            console.log('Model loaded from server');
            
            // Also save to localStorage for future offline use
            await this.model.save('localstorage://mood-prediction-model');
            localStorage.setItem('mood-model-metrics', JSON.stringify(this.modelMetrics));
            
            return true;
          } catch (apiError) {
            console.error('Error loading model from server:', apiError);
            throw apiError; // Re-throw to be caught by outer catch
          }
        } else {
          throw new Error('Not authenticated and no local model found');
        }
      }
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }
  
  // Test model accuracy on existing data
  async testModelAccuracy(testEntries) {
    if (!this.model || testEntries.length < 5) return null;
    
    try {
      const errors = [];
      const predictions = [];
      
      // Make predictions on entries and compare to actual values
      for (let i = 1; i < testEntries.length; i++) {
        const entry = testEntries[i];
        const prevEntry = testEntries[i-1];
        
        // Create input data similar to predictMood
        const userData = {
          lastMoodValue: prevEntry.moodValue,
          timeOfDay: entry.timeOfDay,
          sleepQuality: entry.sleepQuality || 0.5,
          exercise: entry.activities?.includes('Exercise') ? 1 : 0,
          socialInteraction: entry.activities?.includes('Talking with Friend') ? 1 : 0,
          workStress: entry.triggers?.includes('Work Stress') ? 1 : 0
        };
        
        // Make prediction
        const prediction = await this.predictMood(userData);
        
        // Calculate error
        const actual = entry.moodValue;
        const error = Math.abs(prediction - actual);
        
        predictions.push({
          actual,
          predicted: prediction,
          error,
          date: new Date(entry.timestamp).toLocaleDateString()
        });
        
        errors.push(error);
      }
      
      // Calculate average error
      const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
      console.log('Model accuracy test - Average error:', avgError.toFixed(2));
      
      return {
        averageError: avgError,
        predictions
      };
    } catch (error) {
      console.error('Error testing model:', error);
      return null;
    }
  }
  
  // Manual test with fixed inputs
  async manualTestPrediction() {
    if (!this.model) return "Model not loaded";
    
    // Create a test case with known values
    const testInput = {
      lastMoodValue: 3,
      timeOfDay: 'Morning',
      sleepQuality: 1.0,  // Good sleep
      exercise: 1,        // Did exercise
      socialInteraction: 1, // Had social interaction
      workStress: 0       // No work stress
    };
    
    const badInput = {
      lastMoodValue: 2,
      timeOfDay: 'Night',
      sleepQuality: 0.0,  // Poor sleep
      exercise: 0,        // No exercise
      socialInteraction: 0, // No social interaction
      workStress: 1       // High work stress
    };
    
    const goodPrediction = await this.predictMood(testInput);
    const badPrediction = await this.predictMood(badInput);
    
    console.log('Manual test results:');
    console.log('- Good conditions prediction:', goodPrediction);
    console.log('- Bad conditions prediction:', badPrediction);
    
    return {
      goodConditionsPrediction: goodPrediction,
      badConditionsPrediction: badPrediction,
      difference: goodPrediction - badPrediction
    };
  }
  
  // Get model information and metrics
  getModelInfo() {
    return {
      isLoaded: !!this.model,
      metrics: this.modelMetrics,
      features: this.predictionFeatures
    };
  }
}

export const mlService = new MoodMLService();