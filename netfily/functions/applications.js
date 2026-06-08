// netlify/functions/applications.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

const applicationSchema = new mongoose.Schema({
  userId: String,
  fullName: String,
  email: String,
  phone: String,
  idCard: String,
  dob: String,
  universityId: String,
  universityName: String,
  majorId: String,
  majorName: String,
  subjectGroup: String,
  scores: mongoose.Schema.Types.Mixed,
  priorityGroup: String,
  priorityArea: String,
  files: mongoose.Schema.Types.Mixed,
  applicationNumber: String,
  status: { type: String, default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  note: String,
});

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  await connectDB();

  // Lấy path và id
  const path = event.path.replace('/.netlify/functions/applications', '').replace('/api/applications', '');
  const parts = path.split('/').filter(p => p);
  const id = parts[0];
  const action = parts[1];

  // PUT /api/applications/:id/status
  if (event.httpMethod === 'PUT' && id && action === 'status') {
    try {
      const { status, note } = JSON.parse(event.body || '{}');
      
      const updated = await Application.findByIdAndUpdate(
        id,
        { status, note, updatedAt: new Date() },
        { new: true }
      );
      
      if (!updated) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Application not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updated),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  // GET /api/applications/:userId
  if (event.httpMethod === 'GET' && id && id !== 'applications') {
    try {
      const apps = await Application.find({ userId: id }).sort({ submittedAt: -1 });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(apps),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  // GET /api/applications (all - for admin)
  if (event.httpMethod === 'GET' && !id) {
    try {
      const apps = await Application.find({}).sort({ submittedAt: -1 });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(apps),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  // POST /api/applications
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body);
      const application = new Application(data);
      const saved = await application.save();
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(saved),
      };
    } catch (error) {
      console.error('POST error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' }),
  };
};