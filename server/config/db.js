const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Correct connection string format - remove the angle brackets around password
    const uri = 'mongodb+srv://akshithrn:Akhil%40123@cluster0.dx6zk5k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    console.error('Connection string issue - please check your MongoDB Atlas connection string');
    process.exit(1);
  }
};

module.exports = connectDB;