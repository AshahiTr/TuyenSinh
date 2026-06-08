const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tuyen_sinh_secret_key_2025';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://DATA:741852%40A@cluster0.nytsgyz.mongodb.net/admission_system?retryWrites=true&w=majority';

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI);
}

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  idCard: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method not allowed' }) };

  await connectDB();
  const { fullName, email, password, phone, dob, idCard } = JSON.parse(event.body || '{}');

  if (!fullName || !email || !password || !phone || !dob || !idCard)
    return { statusCode: 400, headers, body: JSON.stringify({ message: 'Vui lòng điền đầy đủ thông tin!' }) };

  if (await User.findOne({ email }))
    return { statusCode: 400, headers, body: JSON.stringify({ message: 'Email đã được sử dụng!' }) };
  if (await User.findOne({ idCard }))
    return { statusCode: 400, headers, body: JSON.stringify({ message: 'Số CCCD đã được đăng ký!' }) };

  const hashed = await bcrypt.hash(password, 10);
  const saved = await new User({ fullName, email, password: hashed, phone, dob, idCard }).save();
  const token = jwt.sign({ id: saved._id, email: saved.email }, JWT_SECRET, { expiresIn: '7d' });

  return {
    statusCode: 201, headers,
    body: JSON.stringify({
      token,
      user: { id: saved._id, fullName: saved.fullName, email: saved.email,
              phone: saved.phone, dob: saved.dob, idCard: saved.idCard },
    }),
  };
};