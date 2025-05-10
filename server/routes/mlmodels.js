// server/routes/mlModels.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MLModel = require('../models/MLModel');

/**
 * @route   GET api/ml-models/:modelName
 * @desc    Get a saved ML model
 * @access  Private
 */
router.get('/:modelName', auth, async (req, res) => {
  try {
    const modelName = req.params.modelName;
    
    // Find model for the user
    const model = await MLModel.findOne({
      userId: req.user.id,
      modelName: modelName
    });
    
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    res.json(model);
  } catch (err) {
    console.error('Get ML model error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST api/ml-models/:modelName
 * @desc    Save a new ML model or update existing one
 * @access  Private
 */
router.post('/:modelName', auth, async (req, res) => {
  try {
    const modelName = req.params.modelName;
    const { modelData, metrics } = req.body;
    
    if (!modelData) {
      return res.status(400).json({ message: 'Model data is required' });
    }
    
    // Find model for the user
    let model = await MLModel.findOne({
      userId: req.user.id,
      modelName: modelName
    });
    
    if (model) {
      // Update existing model
      model.modelData = modelData;
      model.metrics = metrics || model.metrics;
      model.updatedAt = new Date().toISOString();
    } else {
      // Create new model
      model = new MLModel({
        userId: req.user.id,
        modelName: modelName,
        modelData: modelData,
        metrics: metrics || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Save model
    await model.save();
    res.status(201).json({ message: 'Model saved successfully' });
  } catch (err) {
    console.error('Save ML model error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE api/ml-models/:modelName
 * @desc    Delete an ML model
 * @access  Private
 */
router.delete('/:modelName', auth, async (req, res) => {
  try {
    const modelName = req.params.modelName;
    
    // Find and remove model
    const result = await MLModel.findOneAndRemove({
      userId: req.user.id,
      modelName: modelName
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    res.json({ message: 'Model deleted successfully' });
  } catch (err) {
    console.error('Delete ML model error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;