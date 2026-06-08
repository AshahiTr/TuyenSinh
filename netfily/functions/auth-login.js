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
  const { email, password } = JSON.parse(event.body || '{}');

  if (!email || !password)
    return { statusCode: 400, headers, body: JSON.stringify({ message: 'Vui lòng nhập email và mật khẩu!' }) };

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return { statusCode: 401, headers, body: JSON.stringify({ message: 'Email hoặc mật khẩu không đúng!' }) };

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email,
              phone: user.phone, dob: user.dob, idCard: user.idCard },
    }),
  };
};