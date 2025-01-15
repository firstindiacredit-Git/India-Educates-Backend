// routes/messageRoutes.js
const express = require('express');
const Message = require('../model/projectMessageModel');
const { uploadMessage } = require('../utils/multerConfig');
const router = express.Router();

// Create a message
router.post('/projectMessage', uploadMessage.array('files', 5), async (req, res) => {
  const { content, senderId, projectId } = req.body;
  const fileUrls = req.files ? req.files.map(file => `/uploads/message/${file.filename}`) : [];

  try {
    const message = new Message({ content, senderId, projectId, fileUrls });
    await message.save();
    
    // Emit socket event for new message
    req.app.get('io').to(projectId).emit('new message', message);
    
    // Emit socket event for new notification
    req.app.get('io').to(projectId).emit('new notification', {
      projectId,
      message: `New message from ${senderId} in project ${projectId}`
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Error creating message', error: error.message });
  }
});

// Get messages for a project
router.get('/messages/:projectId', async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

module.exports = router;
