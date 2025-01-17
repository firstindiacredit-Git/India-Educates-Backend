const mongoose = require('mongoose');

const studentFormSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },  
  // Personal Information
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true },
  profileImage: { type: String },

  // Contact Information
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },

  // Academic Information
  studentId: { type: String, required: true },
  previousSchool: { type: String },
  course: { type: String, required: true },
  semester: { type: String, required: true },

  // Emergency Contact
  parentName: { type: String, required: true },
  parentContact: { type: String, required: true },
  bloodGroup: { type: String },

  // Form Specific Fields (based on form type)
  formType: { type: String, required: true },
  
  // Admission Form Fields
  previousGPA: { type: Number },
  desiredMajor: { type: String },

  // Scholarship Form Fields
  familyIncome: { type: Number },
  scholarshipType: { type: String },
  achievements: { type: String },

  // Leave Application Fields
  leaveStart: { type: Date },
  leaveEnd: { type: Date },
  leaveType: { type: String },
  leaveReason: { type: String },

  // Hostel Application Fields
  roomType: { type: String },
  duration: { type: Number },
  mealPlan: { type: String },

  // Library Card Fields
  cardType: { type: String },
  department: { type: String },

  // ID Card Fields
  idType: { type: String },
  replacementReason: { type: String },

  // Exam Registration Fields
  examType: { type: String },
  subjectCount: { type: Number },
  specialRequirements: { type: String },

  // Club Registration Fields
  clubName: { type: String },
  position: { type: String },
  experience: { type: String },

  // Certificate Request Fields
  certificateType: { type: String },
  copies: { type: Number },
  purpose: { type: String },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudentForm', studentFormSchema);
