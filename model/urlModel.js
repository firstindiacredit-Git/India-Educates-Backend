const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  title: { type: String, required: true },
  original_url: { type: String, required: true },
  short_url: { type: String, required: true, unique: true },
  qr: { type: String },
  userId: { type: String, required: true },// take a user id from Local Storage
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Url', urlSchema);