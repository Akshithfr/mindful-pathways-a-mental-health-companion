const mongoose = require('mongoose');

const MLModelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modelType: {
    type: String,
    required: true
  },
  modelData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metrics: {
    trainingSamples: Number,
    trainingLoss: Number,
    validationLoss: Number,
    averageError: Number,
    lastTrainingDate: Date
  }
}, { timestamps: true });

const MLModel = mongoose.model('MLModel', MLModelSchema);

module.exports = MLModel;