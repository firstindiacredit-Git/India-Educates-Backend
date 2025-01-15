// model/projectMessageModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  senderId: { type: String, required: true },// take a SenderId in Localstorage
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  fileUrls: [{ type: String }], // New field for storing array of file URLs
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProjectMessage', messageSchema);
