const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderType',
        required: true
    },
    senderType: {
        type: String,
        required: true,
        enum: ['AdminUser', 'Employee', 'Client']
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'receiverType',
        required: true
    },
    receiverType: {
        type: String,
        required: true,
        enum: ['AdminUser', 'Employee', 'Client', 'Group']
    },
    message: {
        type: String,
    },
    imageUrls: [{
        type: String
    }],
    audioUrl: {
        type: String
    },
    recordingUrl: {
        type: String
    },
    videoUrl: {
        type: String
    },
    emoji: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    clearedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        userType: {
            type: String,
            required: true,
            enum: ['AdminUser', 'Employee', 'Client']
        },
        clearedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isSystemMessage: {
        type: Boolean,
        default: false
    }
});

const userChatSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    otherUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['AdminUser', 'Employee', 'Client']
    },
    backgroundColor: {
        type: String,
        default: '#efeae2'
    },
    backgroundImage: {
        type: String
    }
});

const UserChatSettings = mongoose.model('UserChatSettings', userChatSettingsSchema);

const userStatusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['AdminUser', 'Employee', 'Client', 'Student']
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    socketId: {
        type: String
    }
});

const UserStatus = mongoose.model('UserStatus', userStatusSchema);

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chats',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderType: {
        type: String,
        required: true,
        enum: ['AdminUser', 'Employee', 'Client']
    },
    message: String,
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['private', 'group'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
    Chat: mongoose.model('Chats', chatSchema),
    UserChatSettings,
    UserStatus,
    Notification
};