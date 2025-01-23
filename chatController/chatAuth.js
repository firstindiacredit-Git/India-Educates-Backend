const express = require('express');
const router = express.Router();
const { Chat, UserChatSettings, UserStatus, Notification } = require('../chatModel/chatModel');
const { uploadChat } = require('../utils/multerConfig');

// Create new chat message
router.post('/createChat', uploadChat, async (req, res) => {
    try {
        const { senderId, senderType, receiverId, receiverType, message } = req.body;

        // Initialize file URLs
        let imageUrls = [];
        let videoUrl = '';
        let audioUrl = '';
        let recordingUrl = '';

        // Handle uploaded files
        if (req.files) {
            // Handle images
            if (req.files.images) {
                imageUrls = req.files.images.map(file => `uploads/chat/images/${file.filename}`);
            }

            // Handle video
            if (req.files.video && req.files.video[0]) {
                videoUrl = `uploads/chat/videos/${req.files.video[0].filename}`;
            }

            // Handle audio
            if (req.files.audio && req.files.audio[0]) {
                audioUrl = `uploads/chat/audio/${req.files.audio[0].filename}`;
            }

            // Handle recording
            if (req.files.recording && req.files.recording[0]) {
                recordingUrl = `uploads/chat/audio/${req.files.recording[0].filename}`;
            }
        }

        const newChat = new Chat({
            senderId,
            senderType,
            receiverId,
            receiverType,
            message: message || '',
            imageUrls,
            videoUrl,
            audioUrl,
            recordingUrl
        });

        const savedChat = await newChat.save();

        // Create notification for receiver
        const notification = new Notification({
            userId: receiverId,
            chatId: savedChat._id,
            senderId: senderId,
            senderType: senderType,
            message: message || 'New message received',
            type: receiverType === 'Group' ? 'group' : 'private'
        });
        await notification.save();

        // Emit to both sender and receiver
        const io = req.app.get('io');
        io.to(receiverId).emit('receive_message', savedChat);
        io.to(senderId).emit('message_sent', savedChat);

        // Emit notification event
        io.to(receiverId).emit('new_notification', notification);

        res.status(201).json(savedChat);
    } catch (error) {
        console.error('Chat creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all chats for a user
router.get('/getChats/:senderId', async (req, res) => {
    try {
        const chats = await Chat.find({
            $or: [
                { senderId: req.params.senderId },
                { receiverId: req.params.senderId }
            ]
        }).sort({ createdAt: -1 });
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get chat between two users
router.get('/getChats/:senderId/:receiverId', async (req, res) => {
    try {
        const chats = await Chat.find({
            $or: [
                { senderId: req.params.senderId, receiverId: req.params.receiverId },
                { senderId: req.params.receiverId, receiverId: req.params.senderId }
            ]
        }).sort({ createdAt: 1 });

        // Filter out messages that were cleared by this user
        const filteredChats = chats.filter(chat => {
            const clearRecord = chat.clearedBy.find(
                clear => clear.userId.toString() === req.params.senderId
            );
            if (!clearRecord) return true;
            return chat.createdAt > clearRecord.clearedAt;
        });

        res.status(200).json(filteredChats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update chat message
router.put('/updateChat/:chatId', async (req, res) => {
    try {
        const { message } = req.body;
        const chatId = req.params.chatId;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                message,
                updatedAt: Date.now(),
                isEdited: true
            },
            { new: true }
        );

        if (!updatedChat) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Emit socket event for real-time update to both sender and receiver
        const io = req.app.get('io');
        io.to(updatedChat.senderId.toString()).emit('message_updated', updatedChat);
        io.to(updatedChat.receiverId.toString()).emit('message_updated', updatedChat);

        res.status(200).json(updatedChat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete chat message
router.delete('/deleteChat/:chatId', async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Instead of deleting, mark as deleted and clear the message
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                isDeleted: true,
                message: '',
                imageUrls: [],
                videoUrl: '',
                audioUrl: '',
                recordingUrl: ''
            },
            { new: true }
        );

        // Emit socket event for real-time deletion to both sender and receiver
        const io = req.app.get('io');
        io.to(chat.senderId.toString()).emit('message_deleted', updatedChat);
        io.to(chat.receiverId.toString()).emit('message_deleted', updatedChat);

        res.status(200).json(updatedChat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this new route
router.post('/clearChat', async (req, res) => {
    try {
        const { userId, userType, otherUserId } = req.body;

        // Find all chats between these users
        const chats = await Chat.find({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        });

        // Update all chats to mark them as cleared for this user
        await Promise.all(chats.map(chat => {
            // Remove any existing clear record for this user
            chat.clearedBy = chat.clearedBy.filter(clear => 
                clear.userId.toString() !== userId.toString()
            );
            
            // Add new clear record
            chat.clearedBy.push({
                userId,
                userType,
                clearedAt: new Date()
            });
            
            return chat.save();
        }));

        res.status(200).json({ message: 'Chat cleared successfully' });
    } catch (error) {
        console.error('Clear chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this new route for updating chat background
router.post('/updateChatBackground', uploadChat, async (req, res) => {
    try {
        const { userId, userType, otherUserId, backgroundColor } = req.body;
        let backgroundImage = '';

        if (req.files && req.files.backgroundImage && req.files.backgroundImage[0]) {
            backgroundImage = `uploads/chat/backgrounds/${req.files.backgroundImage[0].filename}`;
        }

        // Find and update or create new settings for this specific chat
        let chatSettings = await UserChatSettings.findOne({ 
            userId,
            otherUserId
        });
        
        if (chatSettings) {
            chatSettings.backgroundColor = backgroundColor;
            if (backgroundImage) {
                chatSettings.backgroundImage = backgroundImage;
            }
            await chatSettings.save();
        } else {
            chatSettings = await UserChatSettings.create({
                userId,
                otherUserId,
                userType,
                backgroundColor,
                backgroundImage
            });
        }

        res.status(200).json(chatSettings);
    } catch (error) {
        console.error('Update chat background error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get chat settings
router.get('/getChatSettings/:userId/:otherUserId', async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        // Validate that both IDs are provided and valid
        if (!userId || !otherUserId || userId === 'undefined' || otherUserId === 'undefined') {
            return res.status(400).json({ 
                error: 'Invalid user IDs provided',
                userId,
                otherUserId 
            });
        }

        const settings = await UserChatSettings.findOne({
            userId: userId,
            otherUserId: otherUserId
        });

        // If no settings exist, return default settings
        if (!settings) {
            return res.status(200).json({
                userId: userId,
                otherUserId: otherUserId,
                isMuted: false,
                isBlocked: false,
                theme: 'light',
                fontSize: 'medium'
            });
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error('Get chat settings error:', error);
        res.status(500).json({ error: 'Error fetching chat settings' });
    }
});

// Update chat settings
router.post('/updateChatSettings', async (req, res) => {
    try {
        const { userId, otherUserId, settings } = req.body;

        // Validate inputs
        if (!userId || !otherUserId || userId === 'undefined' || otherUserId === 'undefined') {
            return res.status(400).json({ 
                error: 'Invalid user IDs provided',
                userId,
                otherUserId 
            });
        }

        const updatedSettings = await UserChatSettings.findOneAndUpdate(
            { userId, otherUserId },
            { ...settings },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedSettings);
    } catch (error) {
        console.error('Update chat settings error:', error);
        res.status(500).json({ error: 'Error updating chat settings' });
    }
});

// Add new route for getting user status
router.get('/getUserStatus/:userId', async (req, res) => {
    try {
        const status = await UserStatus.findOne({ userId: req.params.userId });
        res.status(200).json(status || { isOnline: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new route to get notifications
router.get('/notifications/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.params.userId,
            isRead: false
        }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add route to mark notifications as read
router.post('/markNotificationsRead', async (req, res) => {
    try {
        const { userId, senderId } = req.body;
        await Notification.updateMany(
            { 
                userId,
                senderId,
                isRead: false
            },
            { isRead: true }
        );
        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new routes for WebRTC signaling
router.post('/call-offer', async (req, res) => {
    try {
        const { offer, callerId, receiverId, type } = req.body;
        const io = req.app.get('io');
        
        io.to(receiverId).emit('incoming-call', {
            offer,
            callerId,
            type
        });
        
        res.status(200).json({ message: 'Call offer sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/call-answer', async (req, res) => {
    try {
        const { answer, callerId, receiverId } = req.body;
        const io = req.app.get('io');
        
        io.to(callerId).emit('call-answered', {
            answer,
            receiverId
        });
        
        res.status(200).json({ message: 'Call answer sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ice-candidate', async (req, res) => {
    try {
        const { candidate, callerId, receiverId } = req.body;
        const io = req.app.get('io');
        
        io.to(receiverId).emit('ice-candidate', {
            candidate,
            callerId
        });
        
        res.status(200).json({ message: 'ICE candidate sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;