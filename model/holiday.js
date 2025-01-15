const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
    name: String,
    date: String,
    isConfirmed: { type: Boolean, default: false },
    adminDecision: { type: String, default: null }, // Store super admin's decision
});

module.exports = mongoose.model("Holiday", holidaySchema);
