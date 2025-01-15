const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type:String,
        enum: ['superadmin', 'admin'],
        default: 'admin'
    },
    profileImage: {
        type: String,
        default: 'Images/superadminimg.jpg'
    }
});

const AdminUser = mongoose.model('AdminUser', AdminSchema);

module.exports = AdminUser;
