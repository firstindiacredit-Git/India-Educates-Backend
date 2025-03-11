const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    studentName: {
        type: String,
        required: true,
    },
    studentImage: {
        type: String,
        default: "default.jpeg"
    },
    studentIdImage: {
        type: String,
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true
    },
    joiningDate: {
        type: Date,
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
        required: true
    },
    alternatePhone: {
        type: String,
    },
    course: {
        type: String,
    },
    university: {
        type: String,
    },
    batch: {
        type: String,
    },
    description: {
        type: String
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
    },
    loans: [{
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        description: {
            type: String,
            required: true
        },
        dueDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'PARTIALLY_PAID', 'PAID'],
            default: 'PENDING'
        },
        interestRate: {
            type: Number,
            default: 0
        },
        remainingAmount: {
            type: Number
        },
        notes: {
            type: String
        },
        paymentHistory: [{
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            },
            paymentMethod: {
                type: String,
                enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
                required: true
            },
            transactionId: {
                type: String
            },
            notes: {
                type: String
            }
        }]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("Student", studentSchema); 