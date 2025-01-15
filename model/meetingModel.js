const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 30
  },
  guestName: {
    type: String,
    required: true
  },
  guestEmail: {
    type: String,
    required: true
  },
  guestPhone: {
    type: String,
    required: true
  },
  additionalGuests: [{
    name: String,
    email: String
  }],
  currentRevenue: {
    type: String,
    required: true
  },
  revenueGoal: {
    type: String,
    required: true
  },
  businessStruggle: {
    type: String,
    required: true
  },
  confirmAttendance: {
    type: Boolean,
    required: true,
    default: false
  },
  agreedToTerms: {
    type: Boolean,
    required: true,
    default: false
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'postponed', 'rescheduled'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);
