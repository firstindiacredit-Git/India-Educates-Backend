const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    senderId: { type: String, required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    fileUrls: [{ type: String }], // New field for storing array of file URLs
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TaskMessage', messageSchema);