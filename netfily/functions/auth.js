// netlify/functions/auth.js
// Handles: POST /api/auth/register  →  /.netlify/functions/auth/register
//          POST /api/auth/login     →  /.netlify/functions/auth/login

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tuyen_sinh_secret_key_2025';
const MONGO_URI  = process.env.MONGODB_URI  ||
  'mongodb+srv://DATA:741852%40A@cluster0.nytsgyz.mongodb.net/admission_system?retryWrites=true&w=majority&authSource=admin';

// ── DB connection (reused across warm invocations) ──────────────────────────
let cached = global._mongoConn;
async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return;
  cached = await mongoose.connect(MONGO_URI);
  global._mongoConn = cached;
}

// ── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  phone:     { type: String, required: true },
  dob:       { type: String, required: true },
  idCard:    { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── CORS helper ──────────────────────────────────────────────────────────────
const headers = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function ok(body, status = 200) {
  return { statusCode: status, headers, body: JSON.stringify(body) };
}
function err(msg, status = 400) {
  return { statusCode: status, headers, body: JSON.stringify({ message: msg }) };
}

// ── Handler ──────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  const path = event.path.replace(/.*\/auth/, '');   // e.g. "/register"
  const body = JSON.parse(event.body || '{}');

  await connectDB();

  // ── REGISTER ────────────────────────────────────────────────────────────
  if (path === '/register' && event.httpMethod === 'POST') {
    const { fullName, email, password, phone, dob, idCard } = body;
    if (!fullName || !email || !password || !phone || !dob || !idCard)
      return err('Vui lòng điền đầy đủ thông tin!');

    if (await User.findOne({ email }))
      return err('Email đã được sử dụng!');
    if (await User.findOne({ idCard }))
      return err('Số CCCD đã được đăng ký!');

    const hashed = await bcrypt.hash(password, 10);
    const saved  = await new User({ fullName, email, password: hashed, phone, dob, idCard }).save();
    const token  = jwt.sign({ id: saved._id, email: saved.email }, JWT_SECRET, { expiresIn: '7d' });

    return ok({
      token,
      user: { id: saved._id, fullName: saved.fullName, email: saved.email,
              phone: saved.phone, dob: saved.dob, idCard: saved.idCard },
    }, 201);
  }

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (path === '/login' && event.httpMethod === 'POST') {
    const { email, password } = body;
    if (!email || !password) return err('Vui lòng nhập email và mật khẩu!');

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return err('Email hoặc mật khẩu không đúng!', 401);

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return ok({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email,
              phone: user.phone, dob: user.dob, idCard: user.idCard },
    });
  }

  return err('Not found', 404);
};