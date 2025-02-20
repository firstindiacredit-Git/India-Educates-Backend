const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    employeeName: {
        type: String,
        required: true,
    },
    employeeImage: {
        type: String,
        // required: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true
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
    },
    description: {
        type: String
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        postalCode: { type: String }
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
