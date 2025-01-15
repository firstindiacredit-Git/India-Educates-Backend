const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    employeeName: {
        type: String,
        required: true,
    },
    employeeCompany: {
        type: String,
    },
    employeeImage: {
        type: String,
        required: true
    },
    resume: {
        type: String,
    },
    aadhaarCard: {
        type: String,
    },
    panCard: {
        type: String,
    },
    employeeId: {
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
    department: {
        type: String,
    },
    designation: {
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
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
