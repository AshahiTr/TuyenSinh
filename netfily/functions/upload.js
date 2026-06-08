// netlify/functions/upload.js
// Handles: POST /api/upload
// Note: Netlify Functions have a 6 MB body limit (base64-encoded = ~4 MB raw).
// Files are stored as base64 strings in MongoDB since Buffer is not available
// in the same way in the serverless environment.

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
  data:        String,   // base64 string
  size:        Number,
  uploadDate:  { type: Date, default: Date.now },
});
const FileModel = mongoose.models.File || mongoose.model('File', fileSchema);

const headers = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  await connectDB();

  // ── GET /api/upload/:id  (file retrieval) ────────────────────────────────
  if (event.httpMethod === 'GET') {
    const id = event.path.split('/').pop();
    const file = await FileModel.findById(id).catch(() => null);
    if (!file) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': file.contentType,
      },
      body: file.data,
      isBase64Encoded: true,
    };
  }

  // ── POST /api/upload ─────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    // Netlify passes multipart as base64 in event.body when isBase64Encoded=true
    // Parse the multipart boundary manually
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    const boundary    = contentType.split('boundary=')[1];
    if (!boundary) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No boundary found' }) };
    }

    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const parts      = parseMultipart(bodyBuffer, boundary);
    const filePart   = parts.find((p) => p.name === 'file');

    if (!filePart) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No file field' }) };
    }

    const saved = await new FileModel({
      name:        filePart.filename,
      contentType: filePart.contentType,
      data:        filePart.data.toString('base64'),
      size:        filePart.data.length,
    }).save();

    const baseUrl = process.env.URL || 'http://localhost:8888';
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id:   saved._id,
        name: saved.name,
        type: saved.contentType,
        url:  `${baseUrl}/api/files/${saved._id}`,
      }),
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

// ── Minimal multipart/form-data parser ──────────────────────────────────────
function parseMultipart(buffer, boundary) {
  const parts   = [];
  const sep     = Buffer.from(`--${boundary}`);
  const sepEnd  = Buffer.from(`--${boundary}--`);
  let   offset  = 0;

  while (offset < buffer.length) {
    const start = indexOf(buffer, sep, offset);
    if (start === -1) break;
    offset = start + sep.length;

    if (buffer.slice(offset, offset + 2).toString() === '--') break; // final boundary

    // skip CRLF after boundary
    offset += 2;

    // find end of headers (double CRLF)
    const headerEnd = indexOf(buffer, Buffer.from('\r\n\r\n'), offset);
    if (headerEnd === -1) break;

    const rawHeaders = buffer.slice(offset, headerEnd).toString();
    offset = headerEnd + 4;

    // find next boundary
    const nextBoundary = indexOf(buffer, sep, offset);
    const dataEnd      = nextBoundary === -1 ? buffer.length : nextBoundary - 2; // strip trailing CRLF
    const data         = buffer.slice(offset, dataEnd);
    offset             = nextBoundary === -1 ? buffer.length : nextBoundary;

    // parse Content-Disposition
    const dispositionMatch = rawHeaders.match(/Content-Disposition:[^\r\n]*/i);
    const contentTypeMatch  = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i);
    if (!dispositionMatch) continue;

    const nameMatch     = dispositionMatch[0].match(/name="([^"]+)"/);
    const filenameMatch = dispositionMatch[0].match(/filename="([^"]+)"/);

    parts.push({
      name:        nameMatch     ? nameMatch[1]     : '',
      filename:    filenameMatch ? filenameMatch[1] : '',
      contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
      data,
    });
  }

  return parts;
}

function indexOf(buf, search, offset = 0) {
  for (let i = offset; i <= buf.length - search.length; i++) {
    if (buf.slice(i, i + search.length).equals(search)) return i;
  }
  return -1;
}