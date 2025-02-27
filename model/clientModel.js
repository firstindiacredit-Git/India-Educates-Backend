const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientSchema = new Schema({
  clientName: {
    type: String,
    required: true,
  },

  clientImage: {
    type: String
  },
  clientDL: {
    type: String
  },
  clientPassport: {
    type: String
  },
  clientAgentID: {
    type: String
  },
  clientGovtID: {
    type: String
  },
  clientEmail: {
    type: String,
    required: true,
    unique: true
  },

  clientPassword: {
    type: String,
    required: true,
  },

  clientPhone: {
    type: String,
  },

  clientAddress: {
    type: String,
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
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
