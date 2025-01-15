const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: true
    },
    projectDate: {
        type: Date,
        default: Date.now
    },
    projectCategory: {
        type: String,
        required: true
    },
    projectImage: [{
        type: String
    }],
    projectStartDate: {
        type: Date,
        required: true
    },
    projectEndDate: {
        type: Date
    },
    taskAssignPerson: [{
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    }],
    clientAssignPerson: [{
        type: Schema.Types.ObjectId,
        ref: 'Client'
    }],
    description: {
        type: String
    },
    projectIcon: {
        type: String,
        default: null
    },
    backgroundColor: {
        type: String,
        default: '#ffffff'
    },
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
