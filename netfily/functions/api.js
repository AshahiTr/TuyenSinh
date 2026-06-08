// netlify/functions/api.js
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Cấu hình CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'tuyen_sinh_secret_key_2025';

// --- QUAN TRỌNG: Kết nối MongoDB với Connection Caching ---
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('✅ Dùng lại kết nối MongoDB cũ');
    return cachedDb;
  }
  
  console.log('🔄 Tạo kết nối MongoDB mới');
  const mongoURI = process.env.MONGODB_URI; // Lấy từ biến môi trường!
  
  if (!mongoURI) {
    throw new Error('MONGODB_URI chưa được cấu hình trong environment variables');
  }
  
  cachedDb = await mongoose.connect(mongoURI);
  return cachedDb;
}

// --- Định nghĩa Schemas ---
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  idCard: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const fileSchema = new mongoose.Schema({
  name: String,
  contentType: String,
  data: Buffer,
  size: Number,
  uploadDate: { type: Date, default: Date.now }
});

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
  applicationNumber: { 
    type: String, 
    unique: true, 
    sparse: true, 
    default: () => `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
  },
  status: { type: String, default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  note: String
}, { strict: false });

// Lấy models (tránh lỗi OverwriteModelError)
const User = mongoose.models.User || mongoose.model('User', userSchema);
const File = mongoose.models.File || mongoose.model('File', fileSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

const upload = multer({ storage: multer.memoryStorage() });

// --- API Routes (giữ nguyên logic như server gốc) ---

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: 'OK', 
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { fullName, email, password, phone, dob, idCard } = req.body;

    if (!fullName || !email || !password || !phone || !dob || !idCard) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email đã được sử dụng!' });
    }

    const existingIdCard = await User.findOne({ idCard });
    if (existingIdCard) {
      return res.status(400).json({ message: 'Số CCCD đã được đăng ký!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword, phone, dob, idCard });
    const saved = await user.save();

    const token = jwt.sign({ id: saved._id, email: saved.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: saved._id,
        fullName: saved.fullName,
        email: saved.email,
        phone: saved.phone,
        dob: saved.dob,
        idCard: saved.idCard,
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu!' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        idCard: user.idCard,
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload file endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const newFile = new File({
      name: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      size: req.file.size
    });

    const savedFile = await newFile.save();

    // Lưu ý: URL sẽ được xử lý relative, không hardcode localhost
    res.json({
      id: savedFile._id,
      name: savedFile.name,
      type: savedFile.contentType,
      url: `/api/files/${savedFile._id}`
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file endpoint
app.get('/api/files/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).send('File not found');
    }

    res.set('Content-Type', file.contentType);
    res.send(file.data);
  } catch (error) {
    console.error('Get File Error:', error);
    res.status(500).send(error.message);
  }
});

// Submit application
app.post('/api/applications', async (req, res) => {
  try {
    await connectToDatabase();
    
    console.log('Body received:', JSON.stringify(req.body, null, 2));

    const application = new Application(req.body);
    const saved = await application.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Submit Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's applications
app.get('/api/applications/:userId', async (req, res) => {
  try {
    await connectToDatabase();
    
    const apps = await Application.find({ userId: req.params.userId }).sort({ submittedAt: -1 });
    res.json(apps);
  } catch (error) {
    console.error('Get Applications Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Xử lý route không tồn tại
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/upload',
      '/api/files/:id',
      '/api/applications',
      '/api/applications/:userId'
    ]
  });
});

// --- Export handler cho Netlify ---
module.exports.handler = serverless(app);