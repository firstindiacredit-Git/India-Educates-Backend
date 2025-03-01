const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const iccrSchema = new Schema({
    // Personal Information
    fullName: { type: String, },
    studentPhoto: { type: String }, // URL/path to uploaded photo
    dateOfBirth: { type: Date, },
    gender: { type: String, },
    placeOfBirth: { type: String, },
    mobileNumber: { type: String, },
    whatsappNumber: { type: String },
    email: { type: String, },

    // Passport Details
    passport: { type: String, },
    passportCountry: { type: String, },
    passportIssueDate: { type: Date, },
    passportExpiryDate: { type: Date, },

    // Address Information
    addressLine: { type: String, },
    city: { type: String, },
    state: { type: String, },
    addressCountry: { type: String, },
    zipcode: { type: String, },

    // Parent Information
    fatherName: { type: String, },
    fatherPhone: { type: String, },
    fatherEmail: { type: String, },
    motherName: { type: String, },
    motherPhone: { type: String, },
    motherEmail: { type: String, },

    //English Proficiency-1
    englishProficiency1: { type: String, },
    tillWhatLevel1: { type: String, },
    score1: { type: String, },

    //English Proficiency-2
    englishProficiency2: { type: String, },
    toeflScore: { type: String, },
    ieltsScore: { type: String, },
    duolingoScore: { type: String, },

    //Previous Educational Qualifications
    previousEducations: [{
        degree: { type: String },
        country: { type: String },
        board: { type: String },
        school: { type: String },
        subject: { type: String },
        year: { type: String },
        percentage: { type: String }
    }],

    //Essay
    essay: { type: String, },

    //Course Information
    academicYear: { type: String, },
    levelOfCourse: { type: String, }, // UG/PG
    courseMainStream: { type: String, }, // Science/Commerce/Arts

    //University Preferences
    universityPreferences: [{
        preference: { type: Number },
        university: { type: String },
        course: { type: String },
        subject: { type: String },
    }],

    //References
    references: [{
        name: { type: String },
        occupation: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String },
    }],

    // Details of Close Relative(s) or Friends in India
    indianContacts: [{
        contactName: { type: String },
        relationship: { type: String },
        occupation: { type: String },
        telephone: { type: String },
        email: { type: String },
        address: { type: String },
    }],

    // Additional Information
    travelledInIndia: { type: String, },
    residenceInIndia: { type: String, },
    marriedToIndian: { type: String, },
    internationalDrivingLicence: { type: String, },
    otherInformation: { type: String, },
    dateOfApplication: { type: Date, },
    placeOfApplication: { type: String, },
    signature: { type: String, },//File path


    // Required Documents
    permanentUniqueId: { type: String }, // File path
    passportCopy: { type: String }, // File path
    gradeXMarksheet: { type: String }, // File path
    gradeXIIMarksheet: { type: String }, // File path
    medicalFitnessCertificate: { type: String }, // File path
    englishTranslationOfDocuments: { type: String }, // File path
    englishAsSubjectDocument: { type: String }, // File path
    anyOtherDocument: { type: String }, // File path

    // Application Status
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
        default: 'Pending'
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});


const iccrForm1Schema = new Schema({
    // Personal Information
    fullName: { type: String, },
    countryCode: { type: String, },
    mobileNumber: { type: String, },
    email: { type: String, },
    dateOfBirth: { type: Date, },
    gender: { type: String, },
    lastQualification: { type: String, },
    course: { type: String, },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ICCR = mongoose.model("ICCR", iccrSchema);
const ICCRForm1 = mongoose.model("ICCRForm1", iccrForm1Schema);

module.exports = { ICCR, ICCRForm1 };
