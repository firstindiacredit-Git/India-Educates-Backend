const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const taskSchema = new Schema({

    assignedBy: {
        type: String,
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    taskTitle: {
        type: String,
        required: true
    },
    taskDate: {
        type: Date,
        default: () => {
            // Create date in Indian timezone (UTC+5:30)
            const indiaTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
            return new Date(indiaTime);
        }
    },
    taskImages: [{
        type: String,
    }],
    taskEndDate: {
        type: Date,
    },
    taskAssignPerson: {
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    },
    taskPriority: {
        type: String,
    },
    isCompleted: {
        type: Boolean,
        default: false,
        required: true
    },
    taskStatus: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Complete'],
        default: 'Not Started'
    },
    description: {
        type: String,
    },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
