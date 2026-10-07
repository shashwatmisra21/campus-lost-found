const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const uploadsDir = path.join(__dirname, '..', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

function localUrl(filename) {
  return `/uploads/${filename}`;
}

async function uploadImage(file) {
  if (!file) return '';

  if (env.cloudinaryEnabled) {
    const { v2: cloudinary } = require('cloudinary');
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'campus-lost-found',
      resource_type: 'image',
    });
    return result.secure_url;
  }

  ensureUploadsDir();
  const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
  return localUrl(filename);
}

module.exports = { uploadImage, uploadsDir };
