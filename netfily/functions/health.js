// netlify/functions/health.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    await connectDB();
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'Connected' : dbState === 0 ? 'Disconnected' : 'Connecting';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'OK',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        mongodb_uri_set: !!MONGO_URI,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'ERROR',
        message: error.message,
      }),
    };
  }
};