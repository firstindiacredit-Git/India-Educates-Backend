const express = require('express');
const Message = require('../model/taskMessageModel');
const { uploadMessage } = require('../utils/multerConfig');
const router = express.Router();

// Create a message
router.post('/taskMessage', uploadMessage.array('files', 5), async (req, res) => {
  const { content, senderId, taskId } = req.body;
  const fileUrls = req.files ? req.files.map(file => `/uploads/message/${file.filename}`) : [];

  try {
    const message = new Message({ content, senderId, taskId, fileUrls });
    await message.save();
    
    // Emit socket event for new message
    req.app.get('io').to(taskId).emit('new task message', message);
    
    // Emit socket event for new notification
    req.app.get('io').to(taskId).emit('new task notification', {
      taskId,
      message: `New message from ${senderId} in task ${taskId}`
    });
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error creating message', error });
  }
});

// Get messages for a task
router.get('/taskMessages/:taskId', async (req, res) => {
  try {
    const messages = await Message.find({ taskId: req.params.taskId });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

module.exports = router;
