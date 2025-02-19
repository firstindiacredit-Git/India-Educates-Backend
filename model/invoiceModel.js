const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    invoiceDate: {
        type: Date,
        required: true
    },
    invoiceDueDate: {
        type: Date,
        required: true
    },
    logo: {
        type: String,
        required: false,
        default: null
    },
    billedBy: {
        type: String,
        required: true
    },
    clientDetail: {
        type: String,
        required: true
    },
    table: [{
        item: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        rate: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    bankDetails: {
        accountName: {
            type: String,
            required: true
        },
        accountNumber: {
            type: String,
            required: true
        },
        ifsc: {
            type: String,
            required: true
        },
        accountType: {
            type: String,
            required: true
        },
        bankName: {
            type: String,
            required: true
        }
    },
    termsConditions: {
        type: String,
        required: true
    }
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
