const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeDashSchema = new Schema({
    employeeId: {
        type: String,
        required: true
    },
    excelSheet: {
        type: String,
    },
    notePad: {
        type: String,
    },
    todoList: {
        type: String,
    },
    notepadColor: {
        type: String,
    },
    todoColor: {
        type: String,
    },
    excelSheetColors: {
        type: String, // Will store array of colors as JSON string
        default: '[]'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmployeeDash', employeeDashSchema);
