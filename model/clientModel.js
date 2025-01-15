const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientSchema = new Schema({
  clientName: {
    type: String,
  },

  businessName: {
    type: String,
    required: true,
  },

  clientImage: { 
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
  
  clientGst: {
    type: String,
  },

  socialLinks: {
    linkedin: { type: String },
    instagram: { type: String },
    youtube: { type: String },
    facebook: { type: String },
    pinterest: { type: String },
    github: { type: String },
    website: { type: String },
    other: { type: String }
  }
}, {
  timestamps: true
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
