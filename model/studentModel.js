const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    studentName: {
        type: String,
        required: true,
    },
    studentImage: {
        type: String,
        required: true
    },
    resume: {
        type: String,
    },
    aadhaarCard: {
        type: String,
    },
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    joiningDate: {
        type: Date,
    },
    username: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    emailid: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
    },
    course: {
        type: String,
    },
    batch: {
        type: String,
    },
    description: {
        type: String
    },
    socialLinks: {
        linkedin: { type: String },
        instagram: { type: String },
        youtube: { type: String },
        facebook: { type: String },
        github: { type: String },
        website: { type: String },
        other: { type: String }
    },
    bankDetails: {
        accountNumber: { type: String },
        accountType: { type: String },
        accountHolderName: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
        upiId: { type: String },
        qrCode: { type: String },
        paymentApp: { type: String }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Student", studentSchema); 