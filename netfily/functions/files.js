// netlify/functions/files.js
// Handles: GET /api/files/:id

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI ||
  'mongodb+srv://DATA:741852%40A@cluster0.nytsgyz.mongodb.net/admission_system?retryWrites=true&w=majority&authSource=admin';

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
}

const fileSchema = new mongoose.Schema({
  name:        String,
  contentType: String,
  data:        String,  // base64
  size:        Number,
  uploadDate:  { type: Date, default: Date.now },
});
const FileModel = mongoose.models.File || mongoose.model('File', fileSchema);

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };

  await connectDB();

  const id   = event.path.split('/').pop();
  const file = await FileModel.findById(id).catch(() => null);
  if (!file) {
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'File not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=86400',
    },
    body: file.data,
    isBase64Encoded: true,
  };
};